// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title  CreavaultNFT
/// @notice Minimal ERC-721 used as a "collect receipt" — proof that
///         a wallet owns a specific work in the Creavault registry.
///         The token URI points to the same metadata as the registry,
///         so OpenSea / Zora / Rainbow render it natively.
/// @dev    Only the ContentRegistry can mint. We deliberately do not
///         implement Permit, Burn, or Approval-for-all batching to
///         keep the surface tiny and auditable.
contract CreavaultNFT {
    // ─────────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────────

    string  public constant name   = "Creavault Collect Receipt";
    string  public constant symbol = "CVLT";

    address public immutable owner;        // deployer (will set registry)
    address public registry;               // ContentRegistry; only minter
    uint256 public nextTokenId;

    mapping(uint256 tokenId => address) private _ownerOf;
    mapping(uint256 tokenId => uint256) public workIdOf;
    mapping(uint256 tokenId => string)  private _tokenURI;
    mapping(address => uint256) private _balanceOf;
    mapping(uint256 => address) private _approved;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // ─────────────────────────────────────────────────────────────
    // Events (ERC-721 standard)
    // ─────────────────────────────────────────────────────────────

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed ownerAddr, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed ownerAddr, address indexed operator, bool approved);
    event RegistrySet(address indexed registry);

    // ─────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────

    error NotRegistry();
    error NotOwnerOrApproved();
    error ZeroAddress();
    error NonexistentToken();
    error AlreadyInitialized();

    // ─────────────────────────────────────────────────────────────
    // Init
    // ─────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    /// @notice One-shot wiring after both contracts are deployed.
    function setRegistry(address _registry) external {
        if (msg.sender != owner) revert NotRegistry();
        if (registry != address(0)) revert AlreadyInitialized();
        registry = _registry;
        emit RegistrySet(_registry);
    }

    // ─────────────────────────────────────────────────────────────
    // Mint (registry-only)
    // ─────────────────────────────────────────────────────────────

    function mintReceipt(address to, uint256 workId, string calldata uri)
        external
        returns (uint256 tokenId)
    {
        if (msg.sender != registry) revert NotRegistry();
        if (to == address(0)) revert ZeroAddress();

        unchecked {
            tokenId = ++nextTokenId;
            _balanceOf[to] += 1;
        }
        _ownerOf[tokenId] = to;
        workIdOf[tokenId] = workId;
        _tokenURI[tokenId] = uri;
        emit Transfer(address(0), to, tokenId);
    }

    // ─────────────────────────────────────────────────────────────
    // ERC-721 reads
    // ─────────────────────────────────────────────────────────────

    function balanceOf(address a) external view returns (uint256) {
        if (a == address(0)) revert ZeroAddress();
        return _balanceOf[a];
    }

    function ownerOf(uint256 tokenId) public view returns (address o) {
        o = _ownerOf[tokenId];
        if (o == address(0)) revert NonexistentToken();
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        if (_ownerOf[tokenId] == address(0)) revert NonexistentToken();
        return _tokenURI[tokenId];
    }

    // ─────────────────────────────────────────────────────────────
    // ERC-721 transfers
    // ─────────────────────────────────────────────────────────────

    function approve(address to, uint256 tokenId) external {
        address o = ownerOf(tokenId);
        if (msg.sender != o && !_operatorApprovals[o][msg.sender]) revert NotOwnerOrApproved();
        _approved[tokenId] = to;
        emit Approval(o, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        if (_ownerOf[tokenId] == address(0)) revert NonexistentToken();
        return _approved[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address o, address operator) external view returns (bool) {
        return _operatorApprovals[o][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        address o = ownerOf(tokenId);
        if (from != o) revert NotOwnerOrApproved();
        if (to == address(0)) revert ZeroAddress();
        if (
            msg.sender != o &&
            _approved[tokenId] != msg.sender &&
            !_operatorApprovals[o][msg.sender]
        ) revert NotOwnerOrApproved();

        delete _approved[tokenId];
        unchecked {
            _balanceOf[from] -= 1;
            _balanceOf[to]   += 1;
        }
        _ownerOf[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        transferFrom(from, to, tokenId);
        // Note: full ERC721Receiver check omitted to keep this minimal.
        // Production deployment should add the onERC721Received callback.
    }

    // ─────────────────────────────────────────────────────────────
    // ERC-165
    // ─────────────────────────────────────────────────────────────

    function supportsInterface(bytes4 id) external pure returns (bool) {
        return
            id == 0x01ffc9a7 || // ERC-165
            id == 0x80ac58cd || // ERC-721
            id == 0x5b5e139f;   // ERC-721 metadata
    }
}
