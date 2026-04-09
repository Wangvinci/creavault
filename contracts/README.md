# Creavault Contracts

Minimal, audit-friendly contracts powering the on-chain creator vault.

## Files

| File | Purpose |
|------|---------|
| `src/ContentRegistry.sol` | Source of truth for every work. Handles registration, pricing, and atomic split payouts on collect. |
| `src/CreavaultNFT.sol` | Tiny ERC-721 minted as a "collect receipt" — proof-of-purchase that surfaces in any wallet/marketplace. |

There is intentionally **no** standalone `PaymentSplitter` contract. Splits are
encoded once at registration time and paid out inline inside
`ContentRegistry.collect()`. This saves a deploy, a hop, and ~30k gas per sale,
at the cost of supporting only fixed splits (no dynamic re-balancing). For
collaborator changes, the creator re-registers a new version of the work.

## Architecture

```
                     ┌──────────────────────────┐
                     │      ContentRegistry     │
 register(work) ───▶ │  ─────────────────────   │
                     │  storage: works, splits  │
 collect(workId) ──▶ │  pays creator + collabs  │
                     │  pays protocol fee       │ ───▶ Treasury (DAO)
                     │  calls receipts.mint()   │
                     └──────────┬───────────────┘
                                │
                                ▼
                     ┌──────────────────────────┐
                     │       CreavaultNFT       │
                     │  ERC-721 receipts        │
                     │  registry-only minter    │
                     └──────────────────────────┘
```

## Trust assumptions

- **Treasury is a multisig**, not an EOA. Initially the team multisig; later
  handed to the DAO via `setTreasury()`.
- **Protocol fee is capped at 10%** in code. Cannot be raised beyond that even
  by treasury. Day-one fee is 2.5% (250 bps), and 0% for the first 100 creators.
- **The contract never custodies funds beyond a single transaction.** Buy →
  forward → mint, all in one call. There is no withdraw function because there
  is nothing to withdraw.
- **Creators can update price**, but cannot revoke or alter splits — buyers
  can trust the split they saw at mint time.

## Deployment plan

| Chain | Status | Notes |
|-------|--------|-------|
| Base Sepolia | Testnet first | Smoke-test mint + collect end-to-end |
| Base | Mainnet target | Primary chain — Coinbase ecosystem, low gas |
| Optimism | V2 | Once Base flow proven |
| Solana | V2 | Separate Anchor program — different repo |

### Order of operations

```bash
# 1. deploy receipts (no constructor args)
forge create CreavaultNFT

# 2. deploy registry, passing the receipts address + treasury + 250 bps
forge create ContentRegistry \
  --constructor-args $RECEIPTS $TREASURY 250

# 3. wire receipts → registry (one-shot, irreversible)
cast send $RECEIPTS "setRegistry(address)" $REGISTRY
```

After step 3, `setRegistry` is locked forever. The receipts contract can only
be minted by the registry from that point on.

## What's deliberately not here (yet)

- **Subscription / streaming payments** — V2, likely via Superfluid CFA
- **EIP-2612 permit** for gasless USDC collects — V2
- **Token-gated unlock** (Lit Protocol) — handled off-chain at the storage layer
- **Governance / $CREA token** — separate repo when Phase 1 begins
- **Solana program** — separate Anchor workspace

## Testing & audit

- Unit tests will live in `contracts/test/` (Foundry) once Foundry is installed.
- Pre-mainnet audit by Spearbit or Cantina before any real funds touch it.
- Until then: testnet only, with a clear "experimental" badge in the UI.
