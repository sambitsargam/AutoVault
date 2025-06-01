# AutoVault

An AI‐driven DeFi vault on the XDC Network that leverages **Civic Auth** for embedded wallet KYC and integrates the **USDC.e bridge** for seamless asset support. AutoVault automatically selects, compounds, and rebalances USDC.e yield strategies using a GPT‐powered advisor. Users deposit USDC.e to mint vUSDC.e shares; an autonomous agent fetches real‐time APYs, consults OpenAI to pick the safest, highest‐return strategy, and calls `harvest()`—all without manual intervention.


## Table of Contents

1. [Project Overview](#project-overview)  
2. [Architecture](#architecture)  
3. [Features](#features)  
4. [Prize Alignment (Bounties Applied)](#prize-alignment-bounties-applied)  
5. [Contact](#contact)  


## Project Overview

**AutoVault** automates yield optimization on the XDC Network. Users deposit USDC.e into a vault contract and receive vUSDC.e shares. Behind the scenes:

- Three strategy contracts each report a real-time APY and implement a harvest function.  
- A continuously running agent fetches those APYs hourly.  
- An AI Advisor (using a tailored GPT prompt) weighs APY, liquidity, risk, and lock-up terms, returning a structured recommendation.  
- The agent executes the recommended harvest on-chain, compounding yield without manual steps.  
- A user-facing dashboard displays TVL, strategy APYs, AI reasoning, and enables deposit/withdraw via MetaMask on XDC Mainnet.


## Architecture

```
           ┌────────────────────┐
           │  React Frontend    │
           │ (TVL, APYs, UI)    │
           └─────────┬──────────┘
                     │
                     ▼
           ┌────────────────────┐
           │   Vault Contract   │
           │     (vUSDC.e)      │
           └─────────┬──────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌────────────────┐        ┌────────────────┐
│  Strategy A    │        │  Strategy B    │
│ (AlphaYield)   │        │ (BetaBoost)    │
└────────────────┘        └────────────────┘
        │                         │
        └──────┬─────────┬────────┘
               │         │
               ▼         ▼
         ┌────────────────────┐
         │  Strategy C        │
         │ (GammaGrowth)      │
         └─────────┬──────────┘
                   │
                   ▼
         ┌────────────────────┐
         │ Rebalance Agent    │
         │  (Node.js Script)  │
         └─────────┬──────────┘
                   │
                   ▼
         ┌────────────────────┐
         │   AI Advisor       │
         │ (Express + GPT)    │
         └────────────────────┘
```


- **React Frontend**: Displays TVL, APYs, recommended strategy, user shares/value, and deposit/withdraw controls.  
- **Vault Contract**: Holds deposited USDC.e, issues vUSDC.e shares, and exposes a `harvest()` function.  
- **Strategy Modules**: Each contract reports a static or dynamic APY via `apy()` and provides a `harvestYield()` endpoint.  
- **AI Advisor**: An Express‐based service wrapping OpenAI, receiving on-chain APYs and returning a JSON recommendation.  
- **Rebalance Agent**: A Node.js script that fetches on-chain APYs, calls the AI Advisor, and executes `harvest()` on the vault with the chosen strategy.

## Features

- **Autonomous Yield Selection**  
  • GPT‐driven decision-making based on APY, risk, liquidity, and lock-up considerations.  
  • Structured reasoning visible to users via hoverable tooltips.  

- **On-Chain Harvesting**  
  • Vault contract aggregates and compounds yield periodically without manual triggers.  
  • Users earn continuously without actively monitoring pools.

- **vUSDC.e Shares**  
  • Each deposit mints ERC-20 share tokens representing user stake.  
  • Share value updates in real time as harvests accrue.

- **Dashboard UX**  
  • Real-time TVL and APY comparison across strategies.  
  • “Connect Wallet” flow for XDC Mainnet via MetaMask.  
  • Dark/light theme toggle for accessibility.  
  • Display of user’s vUSDC.e balance and its USDC.e equivalent.

- **AI Reasoning Tooltips**  
  • Hoverable info icon next to the recommended strategy reveals the AI’s detailed rationale.  

## Prize Alignment (Bounties Applied)

- **Main RWAi Multi-Agent System**  
  • Demonstrates an end-to-end AI-driven RWA yield manager on XDC integrating Solidity, Node.js, and GPT.  

- **USDC.e Bridge Integration Bounty**  
  • Full USDC.e support on XDC Mainnet for real TVL; live deposits and withdrawals of bridged assets.  

- **PolyTrade Onboarding Bounty**  
  • Modular strategy framework easily adaptable to PolyTrade’s RWA distribution protocols.  

- **Civic Auth Wallet Integration Bounty**  
  • Extendable to embed Civic KYC and secure wallets in the interface for compliant onboarding.  

## Contact

- **Twitter**: [@sambitsargam](https://twitter.com/sambitsargam)  
