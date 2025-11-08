# DataStorage Contract Documentation

## Overview

`DataStorage` is the foundational storage contract for the Critical Money protocol. It provides structured data storage for pledges, user balances, and reward tracking, serving as the shared data layer between `PledgePlatform` and `LendingPool`.

## Core Data Structures

### Pledge

```solidity
struct Pledge {
    address pledgor;           // Address that owns the pledge
    uint256 quantityInOunces;  // Amount of silver pledged
    uint256 pledgeDate;        // Timestamp of pledge creation
    uint256 redemptionDate;    // When pledge becomes redeemable
    uint256 agreementId;       // Unique identifier
    bool redemptionApproved;   // Payment completion status
    uint256 ouncePrice;        // XAG/USD price at creation
}
```

The Pledge struct tracks all information about a silver-backed loan:
- Owner and quantity information
- Temporal data (creation and redemption dates)
- Status tracking (redemption approval)
- Price data for repayment calculation

### UserData

```solidity
struct UserData {
    address user;     // User address (matches mapping key)
    uint256 principal; // Amount of USDC deposited
}
```

Tracks user participation in the lending pool:
- User identification
- Principal amount tracking

## State Variables

### Core Storage

```solidity
address public pledgee;              // Admin address
uint256 public agreementId = 1;      // Pledge counter
uint256 public pendingRewards;       // Undistributed rewards
```

### Pledge Management

```solidity
mapping(uint256 => Pledge) public pledges;           // All pledges
mapping(address => uint256[]) public idByPledgor;    // User's pledges
```

### User & Reward Tracking

```solidity
mapping(address => uint256) public reserve;          // USDC reserves
mapping(address => UserData) public userBalances;    // User principals
mapping(address => bool) public isInvestor;         // Investor status
mapping(address => uint256) public rewards;         // Pending rewards
```

### Payment Tracking

```solidity
mapping(address => uint256) public redemptions;      // Redemption counts
mapping(address => mapping(uint256 => uint256)) public paymentsMade; // Payment tracking
```

### Investor Management

```solidity
address[] public investors;  // List of all investors
```

## Storage Layout

The contract uses a careful storage layout to manage different aspects of the system:

1. **Global State**
   - pledgee (slot 0)
   - agreementId (slot 1)
   - pendingRewards (slot 2)

2. **Pledge Data**
   - pledges mapping (slot keccak256(3))
   - idByPledgor mapping (slot keccak256(4))

3. **User Data**
   - reserve mapping (slot keccak256(5))
   - userBalances mapping (slot keccak256(6))
   - isInvestor mapping (slot keccak256(7))
   - rewards mapping (slot keccak256(8))

4. **Payment Data**
   - redemptions mapping (slot keccak256(9))
   - paymentsMade mapping (slot keccak256(10))

5. **Dynamic Storage**
   - investors array (slot keccak256(11))

## Constructor

```solidity
constructor() {
    pledgee = msg.sender;  // Sets deployer as admin
}
```

## Inheritance Notes

This contract is designed to be inherited by both `PledgePlatform` and `LendingPool`:

```solidity
contract PledgePlatform is DataStorage { ... }
contract LendingPool is DataStorage { ... }
```

Key considerations:
- Both contracts share the same storage layout
- State variables accessible to both contracts
- No access control on storage variables
- Careful coordination required between contracts

## Data Access Patterns

### Pledge Access
```solidity
// Get pledge by ID
Pledge storage pledge = pledges[pledgeId];

// Get user's pledges
uint256[] storage userPledges = idByPledgor[userAddress];
```

### User Data Access
```solidity
// Get user's principal
UserData storage userData = userBalances[userAddress];

// Check investor status
bool isUserInvestor = isInvestor[userAddress];
```

### Payment Tracking
```solidity
// Get payments made for a pledge
uint256 paid = paymentsMade[userAddress][pledgeId];

// Get total redemptions
uint256 userRedemptions = redemptions[userAddress];
```

## Security Considerations

1. **Storage Layout**
   - Fixed layout for upgradeable patterns
   - No storage gaps provided
   - Consider adding gaps for future upgrades

2. **Access Control**
   - No internal access control
   - Implementing contracts must handle permissions
   - Consider adding access modifiers

3. **Data Validation**
   - No built-in value validation
   - Implementing contracts must validate
   - Consider adding require statements

4. **Storage Collision**
   - Shared storage between contracts
   - Careful coordination needed
   - Document storage slots clearly

## Gas Optimization

1. **Packing**
   - Pledge struct fields ordered for packing
   - Consider uint128 for some fields
   - Review bool placement

2. **Mapping Access**
   - Direct mapping access preferred
   - Minimal array usage
   - Consider pagination for arrays

3. **Storage vs Memory**
   - Use storage pointers when possible
   - Memory for return values
   - Balance gas and usability

## Integration Guidelines

### Reading Data

```solidity
// Get pledge data
Pledge memory pledge = pledges[pledgeId];
require(pledge.pledgor != address(0), "Pledge not found");

// Get user's principal
UserData memory userData = userBalances[user];
require(userData.user != address(0), "User not found");
```

### Updating Data

```solidity
// Update pledge
pledges[pledgeId].redemptionApproved = true;

// Update user balance
userBalances[user].principal += amount;
```

### Tracking Payments

```solidity
// Record payment
paymentsMade[user][pledgeId] += amount;

// Check payment status
uint256 paid = paymentsMade[user][pledgeId];
bool isComplete = paid >= totalRequired;
```

## Testing Considerations

1. **Storage Tests**
   - Verify storage slots
   - Check struct packing
   - Test mapping interactions

2. **Data Integrity**
   - Pledge creation/retrieval
   - User data updates
   - Payment tracking accuracy

3. **Edge Cases**
   - Zero address handling
   - Maximum values
   - Array limits

4. **Access Patterns**
   - Multiple contract access
   - Storage collision checks
   - Permission scenarios