// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title  $CREA — the Creavault native token
/// @notice Fixed-supply ERC-20 with EIP-2612 permit, designed around three
///         value-anchoring mechanics inspired by BNB:
///
///           1. Hard cap.       100,000,000 CREA minted ONCE at deploy.
///                              No mint() function exists. Ever.
///
///           2. Auto-burn.      Whenever the protocol takes a fee, treasury
///                              calls `burnFromTreasury(amount)` which
///                              destroys CREA bought back from the open
///                              market with that revenue. The burn is
///                              rate-limited so treasury cannot grief.
///
///           3. Burn floor.     Burning halts forever once `totalSupply()`
///                              reaches FLOOR_SUPPLY (20,000,000). This
///                              guarantees a permanent circulating base
///                              and matches BNB's "burn until 100M" logic.
///
/// @dev    The token is intentionally minimal:
///           - no owner / admin / pauser / blocklist
///           - no upgradeability
///           - no mint after deploy
///           - treasury can ONLY burn (within rate limits), nothing else
///
///         All staking and revenue distribution lives in CreaStaking.sol.
contract CreaToken {
    // ─────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────

    string  public constant name     = "Creavault";
    string  public constant symbol   = "CREA";
    uint8   public constant decimals = 18;

    /// @notice Initial supply minted to the treasury at deploy.
    uint256 public constant INITIAL_SUPPLY = 100_000_000 ether;

    /// @notice Burning stops forever at this supply (matches BNB's 100M floor).
    uint256 public constant FLOOR_SUPPLY = 20_000_000 ether;

    /// @notice Maximum CREA the treasury can burn per epoch.
    /// @dev    365 day epochs · 5,000,000 CREA per year max == 5% of initial.
    uint256 public constant MAX_BURN_PER_EPOCH = 5_000_000 ether;
    uint256 public constant EPOCH_LENGTH = 365 days;

    // ─────────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────────

    /// @notice Multisig that holds protocol revenue and executes burns.
    ///         CANNOT mint, pause, blocklist, or upgrade.
    address public immutable treasury;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // Burn rate limiter
    uint256 public burnedThisEpoch;
    uint256 public epochStart;

    // EIP-2612 permit
    mapping(address => uint256) public nonces;
    bytes32 private immutable _DOMAIN_SEPARATOR;
    bytes32 private constant _PERMIT_TYPEHASH =
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

    // ─────────────────────────────────────────────────────────────
    // Events (ERC-20 + custom)
    // ─────────────────────────────────────────────────────────────

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event TreasuryBurn(uint256 amount, uint256 newSupply, uint256 epoch);

    // ─────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────

    error InsufficientBalance();
    error InsufficientAllowance();
    error PermitExpired();
    error InvalidSignature();
    error NotTreasury();
    error BurnFloorReached();
    error EpochCapExceeded();
    error ZeroAddress();

    // ─────────────────────────────────────────────────────────────
    // Constructor — mints once, then minting is impossible
    // ─────────────────────────────────────────────────────────────

    constructor(address _treasury) {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;

        // mint the entire supply to the treasury — single event
        totalSupply = INITIAL_SUPPLY;
        balanceOf[_treasury] = INITIAL_SUPPLY;
        emit Transfer(address(0), _treasury, INITIAL_SUPPLY);

        epochStart = block.timestamp;

        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(name)),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    // ─────────────────────────────────────────────────────────────
    // ERC-20
    // ─────────────────────────────────────────────────────────────

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        if (a != type(uint256).max) {
            if (a < value) revert InsufficientAllowance();
            unchecked { allowance[from][msg.sender] = a - value; }
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        if (to == address(0)) revert ZeroAddress();
        uint256 b = balanceOf[from];
        if (b < value) revert InsufficientBalance();
        unchecked {
            balanceOf[from] = b - value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }

    // ─────────────────────────────────────────────────────────────
    // EIP-2612 permit (gasless approvals)
    // ─────────────────────────────────────────────────────────────

    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _DOMAIN_SEPARATOR;
    }

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        if (block.timestamp > deadline) revert PermitExpired();

        bytes32 structHash = keccak256(
            abi.encode(_PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline)
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", _DOMAIN_SEPARATOR, structHash));
        address signer = ecrecover(digest, v, r, s);
        if (signer == address(0) || signer != owner) revert InvalidSignature();

        allowance[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    // ─────────────────────────────────────────────────────────────
    // Burn — only treasury, rate-limited, floored
    // ─────────────────────────────────────────────────────────────

    /// @notice Anyone can burn THEIR OWN tokens. Used by stakers reclaiming
    ///         penalty etc. Does not touch the treasury epoch cap.
    function burn(uint256 amount) external {
        uint256 b = balanceOf[msg.sender];
        if (b < amount) revert InsufficientBalance();
        if (totalSupply - amount < FLOOR_SUPPLY) revert BurnFloorReached();
        unchecked {
            balanceOf[msg.sender] = b - amount;
            totalSupply -= amount;
        }
        emit Transfer(msg.sender, address(0), amount);
    }

    /// @notice Treasury burns CREA it owns (bought back with protocol fees).
    ///         Hard-capped at MAX_BURN_PER_EPOCH per 365-day window so a
    ///         compromised treasury cannot drain supply.
    function burnFromTreasury(uint256 amount) external {
        if (msg.sender != treasury) revert NotTreasury();

        // roll the epoch if needed
        if (block.timestamp >= epochStart + EPOCH_LENGTH) {
            epochStart = block.timestamp;
            burnedThisEpoch = 0;
        }
        if (burnedThisEpoch + amount > MAX_BURN_PER_EPOCH) revert EpochCapExceeded();
        if (totalSupply - amount < FLOOR_SUPPLY) revert BurnFloorReached();

        uint256 b = balanceOf[treasury];
        if (b < amount) revert InsufficientBalance();

        unchecked {
            balanceOf[treasury] = b - amount;
            totalSupply -= amount;
            burnedThisEpoch += amount;
        }
        emit Transfer(treasury, address(0), amount);
        emit TreasuryBurn(amount, totalSupply, epochStart);
    }
}
