// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CreavaultNFT} from "./CreavaultNFT.sol";

/// @title  ContentRegistry
/// @notice Single source of truth for every work minted on Creavault.
///         Stores the immutable IPFS/Arweave pointer, the creator,
///         the price, and the royalty split. Sale proceeds flow
///         straight to the creator (and any collaborators) — the
///         contract never custodies funds beyond a single tx.
/// @dev    Designed to be deployed once per chain. Frontend reads
///         events via The Graph; on-chain reads are kept minimal.
contract ContentRegistry {
    // ─────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────

    enum ContentKind {
        Music,
        Video,
        Writing,
        Podcast,
        Film
    }

    struct Work {
        address creator;        // owner of the upload
        ContentKind kind;       // category for indexing/UI
        uint96  priceWei;       // 0 == free / tip-only
        uint16  royaltyBps;     // EIP-2981 secondary royalty (max 2000 = 20%)
        uint64  createdAt;      // block.timestamp at registration
        bytes32 cidHash;        // keccak256(cid) for cheap on-chain lookup
        string  cid;            // ipfs://… or ar://…
        string  metaURI;        // json metadata pointer
    }

    struct Split {
        address payable recipient;
        uint16 bps; // basis points; sum across all splits must == 10_000
    }

    // ─────────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────────

    /// @notice ERC-721 contract that mints "collect receipts"
    CreavaultNFT public immutable receipts;

    /// @notice protocol treasury (DAO multisig)
    address payable public treasury;

    /// @notice protocol fee in basis points (e.g. 250 = 2.5%)
    uint16 public protocolFeeBps;

    /// @notice next workId — monotonically increasing
    uint256 public nextWorkId;

    mapping(uint256 workId => Work) private _works;
    mapping(uint256 workId => Split[]) private _splits;
    mapping(bytes32 cidHash => uint256 workId) public workIdByCid;

    // ─────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────

    event WorkRegistered(
        uint256 indexed workId,
        address indexed creator,
        ContentKind indexed kind,
        string cid,
        uint96 priceWei,
        uint16 royaltyBps
    );

    event WorkCollected(
        uint256 indexed workId,
        address indexed collector,
        uint256 receiptId,
        uint96 pricePaid,
        uint96 protocolFee
    );

    event PriceUpdated(uint256 indexed workId, uint96 newPriceWei);
    event TreasuryUpdated(address newTreasury);
    event ProtocolFeeUpdated(uint16 newFeeBps);

    // ─────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────

    error NotCreator();
    error AlreadyRegistered();
    error InvalidSplits();
    error RoyaltyTooHigh();
    error WrongPayment();
    error TransferFailed();
    error UnknownWork();
    error Unauthorized();

    // ─────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────

    modifier onlyTreasury() {
        if (msg.sender != treasury) revert Unauthorized();
        _;
    }

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    constructor(
        CreavaultNFT _receipts,
        address payable _treasury,
        uint16 _protocolFeeBps
    ) {
        receipts = _receipts;
        treasury = _treasury;
        protocolFeeBps = _protocolFeeBps;
    }

    // ─────────────────────────────────────────────────────────────
    // Creator: register a new work
    // ─────────────────────────────────────────────────────────────

    /// @notice Register a freshly uploaded work. The first split entry
    ///         is the creator and must always be present. Additional
    ///         entries can encode collaborators (producers, labels…).
    function register(
        ContentKind kind,
        string calldata cid,
        string calldata metaURI,
        uint96 priceWei,
        uint16 royaltyBps,
        Split[] calldata splits
    ) external returns (uint256 workId) {
        if (royaltyBps > 2000) revert RoyaltyTooHigh();
        bytes32 cidHash = keccak256(bytes(cid));
        if (workIdByCid[cidHash] != 0) revert AlreadyRegistered();

        // validate splits
        uint256 len = splits.length;
        if (len == 0 || splits[0].recipient != msg.sender) revert InvalidSplits();
        uint256 sum;
        for (uint256 i = 0; i < len; ++i) {
            sum += splits[i].bps;
            _splits[nextWorkId + 1].push(splits[i]);
        }
        if (sum != 10_000) revert InvalidSplits();

        unchecked {
            workId = ++nextWorkId;
        }

        _works[workId] = Work({
            creator: msg.sender,
            kind: kind,
            priceWei: priceWei,
            royaltyBps: royaltyBps,
            createdAt: uint64(block.timestamp),
            cidHash: cidHash,
            cid: cid,
            metaURI: metaURI
        });
        workIdByCid[cidHash] = workId;

        emit WorkRegistered(workId, msg.sender, kind, cid, priceWei, royaltyBps);
    }

    // ─────────────────────────────────────────────────────────────
    // Collector: buy a receipt
    // ─────────────────────────────────────────────────────────────

    /// @notice Pay the listed price; contract mints an ERC-721 receipt
    ///         to the buyer and forwards funds to creator+splits in the
    ///         same transaction. Reverts on overpayment to keep refunds
    ///         off the contract.
    function collect(uint256 workId) external payable returns (uint256 receiptId) {
        Work storage w = _works[workId];
        if (w.creator == address(0)) revert UnknownWork();
        if (msg.value != w.priceWei) revert WrongPayment();

        // protocol cut
        uint96 fee = uint96((uint256(w.priceWei) * protocolFeeBps) / 10_000);
        uint96 net = w.priceWei - fee;

        if (fee > 0) _safeSend(treasury, fee);

        // distribute net to splits in one pass
        Split[] storage s = _splits[workId];
        uint256 paid;
        uint256 lastIdx = s.length - 1;
        for (uint256 i = 0; i < lastIdx; ++i) {
            uint256 share = (uint256(net) * s[i].bps) / 10_000;
            paid += share;
            _safeSend(s[i].recipient, share);
        }
        // give the remainder to the last recipient to avoid dust
        _safeSend(s[lastIdx].recipient, uint256(net) - paid);

        receiptId = receipts.mintReceipt(msg.sender, workId, w.metaURI);
        emit WorkCollected(workId, msg.sender, receiptId, w.priceWei, fee);
    }

    // ─────────────────────────────────────────────────────────────
    // Creator admin
    // ─────────────────────────────────────────────────────────────

    function setPrice(uint256 workId, uint96 newPriceWei) external {
        Work storage w = _works[workId];
        if (w.creator != msg.sender) revert NotCreator();
        w.priceWei = newPriceWei;
        emit PriceUpdated(workId, newPriceWei);
    }

    // ─────────────────────────────────────────────────────────────
    // Treasury admin (later: handed to DAO)
    // ─────────────────────────────────────────────────────────────

    function setTreasury(address payable newTreasury) external onlyTreasury {
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    function setProtocolFee(uint16 newFeeBps) external onlyTreasury {
        require(newFeeBps <= 1000, "fee>10%"); // hard ceiling
        protocolFeeBps = newFeeBps;
        emit ProtocolFeeUpdated(newFeeBps);
    }

    // ─────────────────────────────────────────────────────────────
    // EIP-2981 royaltyInfo (called by marketplaces)
    // ─────────────────────────────────────────────────────────────

    function royaltyInfo(uint256 workId, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount)
    {
        Work storage w = _works[workId];
        if (w.creator == address(0)) revert UnknownWork();
        receiver = w.creator;
        royaltyAmount = (salePrice * w.royaltyBps) / 10_000;
    }

    // ─────────────────────────────────────────────────────────────
    // Views
    // ─────────────────────────────────────────────────────────────

    function workOf(uint256 workId) external view returns (Work memory) {
        return _works[workId];
    }

    function splitsOf(uint256 workId) external view returns (Split[] memory) {
        return _splits[workId];
    }

    // ─────────────────────────────────────────────────────────────
    // Internal
    // ─────────────────────────────────────────────────────────────

    function _safeSend(address to, uint256 amount) private {
        if (amount == 0) return;
        (bool ok, ) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
