# $CREA Tokenomics

A scarcity-anchored utility + governance token for the Creavault protocol,
modeled after BNB's "fixed cap, recurring burn, value floor" structure.

## Core principles

| Principle | Mechanism |
|-----------|-----------|
| **Scarcity is real** | Hard cap of 100M, minted ONCE at deploy. The token contract has no `mint()` function. |
| **Value floor** | Burning halts forever at 20M total supply (an 80% max burn). This guarantees a permanent circulating base, like BNB's 100M floor. |
| **Revenue, not promises** | Every dollar of protocol revenue routes through one of two paths: a buyback-and-burn (deflationary) or direct distribution to stakers (yield-bearing). No emissions. No farming. No "ecosystem incentives" inflation. |
| **Boring code is safe code** | No owner. No pauser. No upgradeability. No blocklist. No mint. The treasury can ONLY burn, and only within hard-coded rate limits. |

## Supply

| Bucket | % | Tokens | Vesting |
|--------|---|--------|---------|
| Creator + community rewards | 35% | 35,000,000 | 4-yr linear, no cliff |
| Team | 20% | 20,000,000 | 4-yr linear, 1-yr cliff |
| Investors | 15% | 15,000,000 | 3-yr linear, 1-yr cliff |
| Treasury / DAO | 15% | 15,000,000 | unlocked, multisig-held |
| Liquidity | 10% | 10,000,000 | locked LP, 2-yr |
| Airdrop (early users) | 5% | 5,000,000 | 50% TGE / 50% over 6mo |
| **Total** | **100%** | **100,000,000** | — |

All vesting handled by **off-the-shelf** Sablier streams (audited), not custom
contracts. The token itself stays minimal.

## Value mechanics

### 1. Buyback-and-burn (deflationary engine)

```
user buys content
       │
       ▼
ContentRegistry takes 2.5% fee in ETH
       │
       ▼
Treasury receives ETH
       │
       ▼ (weekly automation, multisig + bot)
Treasury market-buys CREA on Uniswap
       │
       ▼
Treasury calls CreaToken.burnFromTreasury(amount)
       │
       ▼
CREA permanently removed from circulating supply
```

**Rate limit**: `MAX_BURN_PER_EPOCH = 5,000,000 CREA / 365 days` (5% of initial
supply per year max). Hard-coded — even a compromised treasury cannot exceed
this. At max rate, the burn floor is reached in ~16 years.

**Floor**: `FLOOR_SUPPLY = 20,000,000 CREA`. Burn function reverts when crossing.

### 2. Staking revenue share

```
user buys content
       │
       ▼
ContentRegistry takes 2.5% fee
       │
       ▼ (split decided per-quarter by DAO vote)
Treasury splits incoming ETH:
   ├─ X% → buyback-and-burn (above)
   └─ Y% → CreaStaking.notifyRewardETH{value: ...}()
                     │
                     ▼
   Stakers earn ETH pro-rata to their staked CREA, in real time,
   via the Synthetix-style accumulator pattern.
```

**No emissions.** Stakers earn **ETH** (real revenue), not freshly-minted CREA.
There is no inflation reward.

**Cooldown**: `requestUnstake()` → wait 7 days → `withdraw()`. Discourages
flash-loan revenue extraction.

### 3. Utility

- 10–20% discount on Creavault content purchases when paying with CREA
- Listing priority for staked creators (curation weight ∝ stake)
- Governance voting weight = balance + staked balance

## Security

| Attack vector | Mitigation |
|---------------|-----------|
| Mint attack | `mint()` does not exist. Supply is set in the constructor and immutable thereafter. |
| Admin rugpull | No `owner`, no `Ownable`, no `AccessControl`. The token has zero administrative functions. |
| Pausing / freezing | No pause, no blocklist, no `transfer` hook that can revert based on address. |
| Upgrade rugpull | Not a proxy. Bytecode is final on deploy. |
| Treasury rugpull | Treasury can ONLY burn its own balance, and only within `MAX_BURN_PER_EPOCH`. It cannot transfer, mint, or otherwise drain. |
| Flash-loan revenue extraction | 7-day unstake cooldown means a flash-loaned stake can never claim distributed rewards. |
| Reentrancy | `nonReentrant` on every staking entrypoint that moves ETH. Pull-payment pattern only. |
| Signature replay (permit) | Standard EIP-2612 nonces + deadline. Domain separator pinned at deploy. |
| Front-running notifyReward | `notifyRewardETH` is permissionless but the reward goes to the *current* staker pool. There is no atomic "stake → notify → claim" because the cooldown blocks it. |
| Self-destruct grief | No `selfdestruct` anywhere. |
| Missing receive() | `CreaStaking` has `receive()` that treats raw ETH as `notifyRewardETH`, so funds cannot be lost. The token contract has no `receive()`, so accidental ETH sends to the token revert. |

## Audit plan before mainnet

1. Internal review + slither + 4naly3er static analysis
2. Foundry invariant tests (supply monotonic-non-increasing, no orphan ETH, etc.)
3. External audit by **Spearbit** or **Cantina** (2 reviewers, 2 weeks)
4. Code4rena contest (1 week, $50k pool)
5. Bug bounty on Immunefi: $250k cap, indefinite

**No mainnet token until all five complete.** Testnet only until then.

## What's intentionally NOT here

- Rebasing (confuses users, breaks integrations)
- Tax on transfer (creates invisible slippage, breaks DEX integrations)
- Reflection (gimmicky, accounting nightmare, irrelevant to value)
- Liquidity mining emissions (just inflation in disguise)
- Veteam tokens (cleanly vested via Sablier instead)
- Multi-chain bridges (V2 — bridges are the #1 source of crypto exploits)
