# PledgePlatform Contract Documentation

## Overview

`PledgePlatform` is the main business logic contract in the Critical Money protocol. It coordinates the creation and management of silver-backed loans by interfacing with the Silver token, XAG price oracle, and USDC lending pool.

## Inheritance

- Inherits from `Silver` (ERC-20 token)
- Inherits from `DataStorage` (storage layer)

## External Dependencies

Interface | Purpose | Key Functions
----------|---------|---------------
`ISilver` | Silver token operations | `mint`, `changeWhitelist`
`IXAGPrice` | Price oracle | `getXAGPriceUpdated`
`ILendingPool` | USDC liquidity | `borrow`, `updateReserve`
`IERC20` | USDC token | `transfer`, `transferFrom`, `approve`

## State Variables

```solidity
ISilver public silver;        // Silver token contract
IXAGPrice public xagPrice;    // Price oracle
ILendingPool public lendingPool; // Lending pool
IERC20 private immutable usdcAddress; // USDC token
address constant usdcToken;   // USDC contract address
```

## Constructor

```solidity
constructor(address _silver, address _xagPrice, address _lendingPool)
```

Initializes the contract with required external contract addresses:
- Sets deployer as `pledgee`
- Links Silver token contract
- Links XAG price oracle
- Links lending pool
- Sets up USDC interface

## Core Functions

### pledgeRegistry

```solidity
function pledgeRegistry(
    address _pledgor,
    uint256 amount,
    uint256 spread
) external onlyPledgee
```

Creates a new silver-backed loan with the following steps:
1. Validates amount > 0
2. Whitelists pledgor for Silver token
3. Fetches current XAG/USD price
4. Creates Pledge record:
   - 365-day term
   - Stores ounce amount and price
   - Sets initial redemption status
5. Updates pledgor's pledge list
6. Mints Silver tokens to pledgor
7. Calculates USDC amount (price * amount / 1e14)
8. Initiates USDC loan via lending pool

### amortizePledge

```solidity
function amortizePledge(
    uint256 amount,
    uint256 pledgeId
) external virtual returns (uint256)
```

Handles loan repayments:
1. Verifies caller is pledge owner
2. Calculates total debt (ounces * price / 1e14)
3. Tracks payment progress
4. Validates payment amount
5. Transfers USDC:
   - From user to contract
   - Contract approves itself
   - Contract to lending pool
6. Updates lending pool reserve
7. Updates payment tracking
8. Sets redemption approval if fully paid
9. Returns total amount paid

### View Functions

```solidity
function getPledgeById(uint256 pledgeId) 
    external view returns (Pledge memory)

function getPledgorById(address pledgor) 
    external view returns (uint256[] memory)
```

Query functions to access pledge data and user pledge lists.

## Access Control

The contract uses the `onlyPledgee` modifier to restrict sensitive operations:
```solidity
modifier onlyPledgee {
    require(msg.sender == pledgee, "You're not the pledgee");
    _;
}
```

## Events

Events are inherited from `DataStorage` contract.

## Integration Points

### Silver Token Integration
- Whitelisting pledgors
- Minting tokens on pledge creation
- Token represents pledged silver

### Price Oracle Integration
- Fetches XAG/USD price for pledge creation
- Price stored with pledge for repayment calculation

### Lending Pool Integration
- Provides USDC loans to pledgors
- Receives repayments
- Updates reserves

## Security Considerations

1. Access Control
   - Only pledgee can create pledges
   - Only pledge owner can make payments
   - Silver token whitelist protection

2. Value Calculations
   - Fixed point math with 1e14 scaling
   - No overflow protection needed (Solidity ≥0.8.0)
   - Price oracle trust required

3. Token Transfers
   - Double transfer in amortizePledge
   - Self-approval pattern in amortizePledge
   - Consider direct transfer to pool

4. State Management
   - Sequential agreementId
   - Pledge immutability after creation
   - Payment tracking per user/pledge

## Common Integration Flows

### Creating a New Pledge

```javascript
// 1. Pledgee creates pledge
await pledgePlatform.pledgeRegistry(
    borrowerAddress,
    silverOunces,
    spreadPercent
);

// 2. Borrower receives:
// - Silver tokens (silverOunces amount)
// - USDC loan ((silverOunces * xagPrice) / 1e14)
```

### Making a Payment

```javascript
// 1. Borrower approves USDC
await usdc.approve(pledgePlatform.address, paymentAmount);

// 2. Borrower makes payment
await pledgePlatform.amortizePledge(
    paymentAmount,
    pledgeId
);
```

## Gas Optimization Notes

1. State Updates
   - Single storage write for payment tracking
   - Minimal state updates in pledge creation
   - Consider batched operations for multiple pledges

2. Mapping Access
   - Efficient use of mappings for lookups
   - No array iterations in core functions
   - Storage pointers for pledge access

## Testing Guide

Key test scenarios should cover:

1. Pledge Creation
   - Valid/invalid amounts
   - Price oracle integration
   - Token minting verification
   - USDC loan initiation

2. Payments
   - Partial payments
   - Overpayment protection
   - Redemption status updates
   - Reserve updates

3. Access Control
   - Pledgee restrictions
   - Borrower restrictions
   - Payment authorization

4. Edge Cases
   - Zero amounts
   - Max values
   - Price precision
   - Payment calculations