# 🪙 SpaceCoin Rewards Setup Guide

## Overview
The SpaceCoin reward system consists of two smart contracts:
1. **SpaceToken (ERC20)** - The SPACE token that players earn
2. **SpaceShooterGame** - The game logic that awards tokens

**Important**: These contracts must be linked together for rewards to work!

---

## 🚨 The Issue
When players submit high scores, the `SpaceShooterGame` contract tries to call `SpaceToken.rewardPlayer()` to mint tokens. However, this function has an `onlyGame` modifier that **only allows calls from the authorized game contract**.

Without linking them, you'll see this error:
```
Error: execution reverted: "Not game contract"
```

---

## ✅ Solution: One-Time Setup

### Step 1: Deploy Contracts (If not already deployed)

Deploy in this order using Remix:

1. **Deploy SpaceToken**
   ```solidity
   constructor parameters:
   - walletAddress: YOUR_WALLET_ADDRESS
   ```
   📋 Copy deployed address: `0xAfa22964ACCe901DeBb5ec4a9c7E6d1F1159f673`

2. **Deploy SpaceShooterGame**
   ```solidity
   constructor parameters:
   - tokenAddress: SPACE_TOKEN_ADDRESS_FROM_STEP_1
   ```
   📋 Copy deployed address: `0x4851214E850C29a6670bC2971019428089334F74`

3. **Update** `/web3-space-shooter/frontend/src/contracts/addresses.js`:
   ```javascript
   8119: {
     SpaceShooterGame: "0x4851214E850C29a6670bC2971019428089334F74",
     SpaceToken: "0xAfa22964ACCe901DeBb5ec4a9c7E6d1F1159f673",
     deployedAt: "2026-02-17"
   }
   ```

---

### Step 2: Link SpaceToken to SpaceShooterGame ⚡

**Using the UI (Recommended)**:

1. **Connect wallet** as the contract owner/deployer
2. **Open wallet dropdown** (click your wallet badge)
3. You should see a warning button: **"⚠️ Link SPACE Token to Game"**
4. **Click the button** and confirm the transaction
5. Wait for confirmation
6. ✅ Done! Rewards will now work!

**Using Remix (Alternative)**:

1. Open SpaceToken contract in Remix
2. **Call function**: `setGameContract`
   - `_game`: `0x4851214E850C29a6670bC2971019428089334F74` (game contract address)
3. **Send transaction** and confirm
4. ✅ Done!

**Using Ethers.js (For Developers)**:

```javascript
const spaceToken = new ethers.Contract(
  SPACE_TOKEN_ADDRESS,
  SpaceTokenABI,
  signer
);

const tx = await spaceToken.setGameContract(GAME_CONTRACT_ADDRESS);
await tx.wait();
console.log("Setup complete!");
```

---

## 🔍 How to Verify Setup

### Option 1: Using the UI
The wallet dropdown will:
- Show ✅ green status if setup is complete
- Show ⚠️ warning button if setup is needed

### Option 2: Using Remix
1. Load SpaceToken contract at deployed address
2. Call `gameContract()` view function
3. Should return: `0x4851214E850C29a6670bC2971019428089334F74`
4. If it returns `0x0000000000000000000000000000000000000000` → Need to run setup!

---

## 🎮 How Rewards Work (After Setup)

1. **Player plays game** and achieves high score
2. **Player submits score** via "Submit Score" button
   - Pays 0.001 SHM fee
   - Calls `SpaceShooterGame.submitScore()`
3. **Game contract checks** if score is higher than previous
4. If yes, **Game contract calls** `SpaceToken.rewardPlayer()`
   - Mints new SPACE tokens
   - Rewards: `score * 0.001 SPACE`
   - Example: Score 500 = 0.5 SPACE tokens
5. **Tokens appear** in player's wallet automatically

---

## 📊 Reward Formula

```javascript
Reward (SPACE) = Score * 0.001

Examples:
- Score 100   → 0.1 SPACE
- Score 500   → 0.5 SPACE
- Score 1000  → 1.0 SPACE
- Score 5000  → 5.0 SPACE
- Score 10000 → 10.0 SPACE
```

**Contract Code** (line 108 in BlockterGame.sol):
```solidity
uint256 rewardAmount = score * 1e15; // score * 0.001 tokens
token.rewardPlayer(msg.sender, rewardAmount);
```

---

## 🐛 Troubleshooting

### Error: "Not game contract"
**Cause**: SpaceToken.setGameContract() was never called
**Fix**: Follow Step 2 above

### Error: "Max supply reached"
**Cause**: Hit 100,000,000 SPACE token cap
**Fix**: This is intentional. Token has max supply limit.

### Rewards not showing in wallet
**Cause**: MetaMask doesn't auto-detect new tokens
**Fix**:
1. Open MetaMask
2. Click "Import Tokens"
3. Paste SpaceToken address: `0xAfa22964ACCe901DeBb5ec4a9c7E6d1F1159f673`
4. Symbol: SPACE
5. Decimals: 18

Or wallet will prompt to add token when you first connect!

### Transaction fails: "Fee required"
**Cause**: Not sending 0.001 ETH with submitScore
**Fix**: Game automatically sends correct fee, check wallet has balance

---

## 🎯 Quick Reference

| Network | Shardeum EVM Testnet (Mezame) |
|---------|-------------------------------|
| Chain ID | 8119 (0x1FB7) |
| Block Explorer | https://explorer-mezame.shardeum.org |
| SpaceToken | 0xAfa22964ACCe901DeBb5ec4a9c7E6d1F1159f673 |
| SpaceShooterGame | 0x4851214E850C29a6670bC2971019428089334F74 |
| NFTSpaceship | Not yet deployed |
| Submission Fee | 0.001 SHM |
| Min Score | 100 |

---

## 🔐 Security Notes

- **Only the contract owner** can call `setGameContract()`
- This should only be called **once** after initial deployment
- Changing it later could break existing game logic
- The game contract is the **only address** that can mint new SPACE tokens
- Players cannot directly mint tokens, only earn through gameplay

---

## 📝 Smart Contract Functions

### SpaceToken.sol
```solidity
// Owner only - called once during setup
function setGameContract(address _game) external onlyOwner

// Game only - called automatically when player gets high score
function rewardPlayer(address player, uint256 amount) external onlyGame

// View function - check current setup
function gameContract() external view returns (address)
```

### SpaceShooterGame.sol
```solidity
// Player callable - submit score and get rewards
function submitScore(uint256 score) external payable

// View function - check player's high score
function highScores(address player) external view returns (uint256)
```

---

## ✅ Checklist

Setup complete when all these are true:
- [ ] SpaceToken contract deployed
- [ ] SpaceShooterGame contract deployed
- [ ] Contract addresses updated in addresses.js
- [ ] **setGameContract() called successfully**
- [ ] gameContract() returns correct address
- [ ] Player can submit score without "Not game contract" error
- [ ] Player receives SPACE tokens after submitting high score
- [ ] Token balance shows in wallet

---

## 🎉 Success!

Once setup is complete:
- ✅ Players can earn SPACE tokens by playing
- ✅ Rewards automatically mint on new high scores
- ✅ Leaderboard tracks all scores in Firebase
- ✅ Token balance updates in real-time

**Have fun gaming and earning! 🚀**
