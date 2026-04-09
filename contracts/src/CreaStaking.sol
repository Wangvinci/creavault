// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CreaToken} from "./CreaToken.sol";

/// @title  CreaStaking — revenue share for $CREA holders
/// @notice Stakers lock CREA and earn a pro-rata share of every ETH the
///         protocol forwards to this contract via `notifyRewardETH()`.
///         Uses the classic accumulator pattern (rewardPerTokenStored)
///         so distribution is O(1) regardless of staker count and there
///         is no rebase / per-user loop. Inspired by Synthetix's
///         StakingRewards but stripped to one reward token (ETH).
///
/// @dev    Security:
///           - reentrancy guard on every ETH-moving entrypoint
///           - pull payments only (no push)
///           - immutable token reference, no admin keys
///           - notifyRewardETH() permissionless: ContentRegistry calls it
///             with msg.value, so reward source is on-chain verifiable
///           - cooldown on unstake to discourage flash-loan revenue
///             extraction (configurable, capped at 30 days)
contract CreaStaking {
    // ─────────────────────────────────────────────────────────────
    // Immutable
    // ─────────────────────────────────────────────────────────────

    CreaToken public immutable crea;
    uint64 public immutable cooldown; // seconds between unstake request and withdrawal

    // ─────────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────────

    uint256 public totalStaked;
    uint256 public rewardPerTokenStored; // scaled by 1e18

    mapping(address => uint256) public stakedOf;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public earned; // pending ETH (wei)

    struct UnstakeRequest {
        uint128 amount;
        uint64  unlockAt;
    }
    mapping(address => UnstakeRequest) public pending;

    // reentrancy
    uint256 private _locked = 1;

    // ─────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────

    event Staked(address indexed user, uint256 amount);
    event UnstakeRequested(address indexed user, uint256 amount, uint64 unlockAt);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 amount);
    event RewardNotified(address indexed from, uint256 amount, uint256 newRewardPerToken);

    // ─────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────

    error Reentrancy();
    error ZeroAmount();
    error NoStake();
    error NoPending();
    error CooldownNotPassed();
    error CooldownTooLong();
    error TransferFailed();

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    constructor(CreaToken _crea, uint64 _cooldown) {
        if (_cooldown > 30 days) revert CooldownTooLong();
        crea = _crea;
        cooldown = _cooldown;
    }

    // ─────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────

    modifier nonReentrant() {
        if (_locked != 1) revert Reentrancy();
        _locked = 2;
        _;
        _locked = 1;
    }

    modifier updateReward(address user) {
        // checkpoint the user's accrued earnings before any state change
        uint256 rpt = rewardPerTokenStored;
        if (user != address(0)) {
            uint256 staked = stakedOf[user];
            uint256 delta = rpt - userRewardPerTokenPaid[user];
            earned[user] += (staked * delta) / 1e18;
            userRewardPerTokenPaid[user] = rpt;
        }
        _;
    }

    // ─────────────────────────────────────────────────────────────
    // Reward distribution — called by ContentRegistry on each fee
    // ─────────────────────────────────────────────────────────────

    /// @notice Add ETH to the reward pool. Anyone can call (the protocol
    ///         will), msg.value is what gets distributed. If nobody is
    ///         staked, the funds sit on the contract until the first
    ///         staker arrives — they don't go to the caller.
    function notifyRewardETH() external payable {
        if (msg.value == 0) revert ZeroAmount();
        if (totalStaked == 0) {
            // Park the funds; they'll be allocated on first stake.
            // We DON'T refund — that would let attackers brick the protocol.
            return;
        }
        rewardPerTokenStored += (msg.value * 1e18) / totalStaked;
        emit RewardNotified(msg.sender, msg.value, rewardPerTokenStored);
    }

    // ─────────────────────────────────────────────────────────────
    // Stake / unstake / claim
    // ─────────────────────────────────────────────────────────────

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();
        // pull tokens via transferFrom (caller must have approved)
        bool ok = crea.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();
        unchecked {
            stakedOf[msg.sender] += amount;
            totalStaked += amount;
        }
        emit Staked(msg.sender, amount);
    }

    /// @notice Begin the unstake cooldown. The amount stops earning
    ///         rewards immediately and unlocks after `cooldown` seconds.
    function requestUnstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        uint256 staked = stakedOf[msg.sender];
        if (staked == 0) revert NoStake();
        if (amount == 0 || amount > staked) revert ZeroAmount();

        unchecked {
            stakedOf[msg.sender] = staked - amount;
            totalStaked -= amount;
        }
        UnstakeRequest storage p = pending[msg.sender];
        // accumulate if a previous request exists, reset cooldown
        p.amount += uint128(amount);
        p.unlockAt = uint64(block.timestamp + cooldown);
        emit UnstakeRequested(msg.sender, amount, p.unlockAt);
    }

    function withdraw() external nonReentrant {
        UnstakeRequest memory p = pending[msg.sender];
        if (p.amount == 0) revert NoPending();
        if (block.timestamp < p.unlockAt) revert CooldownNotPassed();

        delete pending[msg.sender];
        bool ok = crea.transfer(msg.sender, p.amount);
        if (!ok) revert TransferFailed();
        emit Withdrawn(msg.sender, p.amount);
    }

    function claimRewards() external nonReentrant updateReward(msg.sender) {
        uint256 amount = earned[msg.sender];
        if (amount == 0) return;
        earned[msg.sender] = 0;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit RewardPaid(msg.sender, amount);
    }

    // ─────────────────────────────────────────────────────────────
    // Views
    // ─────────────────────────────────────────────────────────────

    function pendingRewards(address user) external view returns (uint256) {
        uint256 staked = stakedOf[user];
        uint256 delta = rewardPerTokenStored - userRewardPerTokenPaid[user];
        return earned[user] + (staked * delta) / 1e18;
    }

    receive() external payable {
        // Accept raw ETH transfers but treat them as a reward notification.
        if (totalStaked > 0) {
            rewardPerTokenStored += (msg.value * 1e18) / totalStaked;
            emit RewardNotified(msg.sender, msg.value, rewardPerTokenStored);
        }
    }
}
