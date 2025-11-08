# LendingPool Contract Documentation

## Overview

`LendingPool` is a core component of the Critical Money protocol that manages the lending and investment aspects of the system. It inherits from `DataStorage` and handles USDC deposits, withdrawals, and reward distribution for investors who provide liquidity to fund silver-backed loans.

## Key Features

1. **Deposit Management**
   - USDC deposits from investors
   - Principal tracking
   - Investor registry

2. **Withdrawal Handling**
   - Principal withdrawals
   - Reward claims
   - Balance verification

3. **Reward Distribution**
   - Automatic reward calculation
   - Pro-rata distribution
   - Pending reward tracking

## Contract Dependencies

```solidity
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./DataStorage.sol";
```

- Uses OpenZeppelin's IERC20 interface for USDC interactions
- Implements ReentrancyGuard for security
- Inherits from DataStorage for data persistence

## State Variables

### Inherited Storage
```solidity
// From DataStorage
mapping(address => UserData) public userBalances;    // User principals
mapping(address => bool) public isInvestor;         // Investor status
mapping(address => uint256) public rewards;         // Pending rewards
uint256 public pendingRewards;                      // Undistributed rewards
address[] public investors;                         // Investor list
```

### Contract-Specific Storage
```solidity
IERC20 public immutable USDC;      // USDC token contract
uint256 public totalDeposits;      // Total USDC in pool
```

## Core Functions

### Deposit Management

```solidity
function deposit(uint256 amount) external
```
- Accepts USDC deposits from investors
- Updates user principal
- Tracks total deposits
- Registers new investors

Parameters:
- `amount`: USDC amount to deposit (in wei)

Events:
- `Deposit(address indexed user, uint256 amount)`

### Withdrawal Functions

```solidity
function withdraw(uint256 amount) external
```
- Allows principal withdrawal
- Verifies available balance
- Updates user data
- Transfers USDC

Parameters:
- `amount`: USDC amount to withdraw (in wei)

Events:
- `Withdrawal(address indexed user, uint256 amount)`

### Reward Management

```solidity
function claimRewards() external
```
- Claims available rewards
- Updates reward balances
- Transfers USDC rewards

Events:
- `RewardsClaimed(address indexed user, uint256 amount)`

## Core Logic

### Deposit Flow

1. **Input Validation**
   ```solidity
   require(amount > 0, "Amount must be greater than 0");
   ```

2. **Token Transfer**
   ```solidity
   USDC.transferFrom(msg.sender, address(this), amount);
   ```

3. **State Updates**
   ```solidity
   userBalances[msg.sender].principal += amount;
   totalDeposits += amount;
   ```

4. **Investor Registration**
   ```solidity
   if (!isInvestor[msg.sender]) {
       isInvestor[msg.sender] = true;
       investors.push(msg.sender);
   }
   ```

### Withdrawal Flow

1. **Balance Check**
   ```solidity
   require(amount <= userBalances[msg.sender].principal, "Insufficient balance");
   ```

2. **State Updates**
   ```solidity
   userBalances[msg.sender].principal -= amount;
   totalDeposits -= amount;
   ```

3. **Token Transfer**
   ```solidity
   USDC.transfer(msg.sender, amount);
   ```

### Reward Distribution

1. **Reward Calculation**
   ```solidity
   uint256 share = (userBalance * pendingRewards) / totalDeposits;
   ```

2. **Reward Assignment**
   ```solidity
   rewards[investor] += share;
   pendingRewards -= share;
   ```

## Security Considerations

### Reentrancy Protection
```solidity
modifier nonReentrant() {
    require(!locked, "No re-entrancy");
    locked = true;
    _;
    locked = false;
}
```
- Applied to all external functions
- Prevents recursive calls
- Protects state consistency

### Input Validation
```solidity
require(amount > 0, "Invalid amount");
require(amount <= userBalances[msg.sender].principal, "Insufficient balance");
```
- Non-zero amounts
- Balance verification
- Overflow protection

### Access Control
```solidity
modifier onlyPledgee() {
    require(msg.sender == pledgee, "Not authorized");
    _;
}
```
- Admin functions restricted
- Investor verification
- Operation authorization

## Gas Optimization

1. **State Updates**
   - Batch updates when possible
   - Minimize storage writes
   - Use memory for calculations

2. **Loop Handling**
   - Bounded iterations
   - Gas-efficient patterns
   - Break large operations

3. **Event Optimization**
   - Indexed parameters
   - Minimal event data
   - Strategic event placement

## Error Handling

### Common Errors
```solidity
error InsufficientBalance(uint256 requested, uint256 available);
error InvalidAmount();
error Unauthorized();
```

### Recovery Mechanisms
1. **Transaction Failure**
   - State reversal
   - Clean error messages
   - Event logging

2. **Balance Reconciliation**
   - Manual admin functions
   - Emergency withdrawal
   - State verification

## Integration Guidelines

### Contract Interaction

```solidity
// Deposit Example
USDC.approve(lendingPool, amount);
lendingPool.deposit(amount);

// Withdrawal Example
uint256 balance = userBalances[user].principal;
lendingPool.withdraw(amount);

// Reward Claim
uint256 pending = rewards[user];
lendingPool.claimRewards();
```

### Event Monitoring

```solidity
event Deposit(address indexed user, uint256 amount);
event Withdrawal(address indexed user, uint256 amount);
event RewardsClaimed(address indexed user, uint256 amount);
```

Monitor these events for:
- User activity tracking
- Balance updates
- Reward distribution

## Testing Strategy

### Unit Tests

1. **Deposit Testing**
   - Valid amounts
   - Token transfers
   - State updates
   - Event emission

2. **Withdrawal Testing**
   - Balance checks
   - Token transfers
   - State updates
   - Error cases

3. **Reward Testing**
   - Distribution accuracy
   - Claim process
   - Zero cases

### Integration Tests

1. **Contract Interaction**
   - PledgePlatform integration
   - Token handling
   - State consistency

2. **End-to-End Flow**
   - Deposit to withdrawal
   - Reward distribution
   - Multiple users

### Invariant Tests

1. **Balance Invariants**
   - Total deposits = sum of principals
   - User balance ≤ total deposits
   - Reward consistency

2. **State Invariants**
   - Investor list validity
   - Reward allocation
   - Token balance matching

## Deployment Considerations

1. **Prerequisites**
   - USDC contract address
   - Admin wallet setup
   - Gas estimation

2. **Configuration**
   - Constructor parameters
   - Initial state setup
   - Admin transfer

3. **Verification**
   - Contract verification
   - Initial state check
   - Function testing