# XAGPrice Contract Documentation

## Overview

`XAGPrice` is a critical oracle contract in the Critical Money protocol that provides the current price of silver (XAG) in USD. This price feed is essential for calculating loan amounts and repayment values in the pledge system.

## Core Features

1. **Price Oracle Integration**
   - Interface with Chainlink price feeds
   - Real-time XAG/USD price updates
   - Price validation and safety checks

2. **Price Scaling**
   - Raw price normalization
   - Decimal handling
   - Precision management

## Contract Dependencies

```solidity
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
```

The contract uses Chainlink's AggregatorV3Interface for reliable price data.

## Key Components

### State Variables

```solidity
/// @notice Chainlink Price Feed interface for XAG/USD
AggregatorV3Interface private immutable priceFeed;

/// @notice Address of the admin who can update settings
address public admin;

/// @notice Staleness threshold for price data (in seconds)
uint256 public constant STALENESS_PERIOD = 86400; // 24 hours
```

### Constructor

```solidity
constructor(address _priceFeed) {
    priceFeed = AggregatorV3Interface(_priceFeed);
    admin = msg.sender;
}
```

Parameters:
- `_priceFeed`: Address of the Chainlink XAG/USD price feed

### Core Functions

#### Get Updated Price
```solidity
function getXAGPriceUpdated() external view returns (uint256)
```
- Returns the current XAG/USD price
- Includes staleness checks
- Normalizes decimals
- Reverts if price is stale or invalid

#### Raw Price Access
```solidity
function getLatestPrice() internal view returns (uint256, uint256)
```
- Internal function for raw price access
- Returns price and timestamp
- No validation applied
- Used by other contract functions

## Price Feed Details

### Data Format
- Input: Chainlink XAG/USD price feed
- Output: 18 decimal fixed-point number
- Scaling: Raw price * (10 ** decimals)

### Validation Rules
1. **Staleness Check**
   ```solidity
   require(timestamp + STALENESS_PERIOD >= block.timestamp, "Stale price");
   ```

2. **Zero Price Check**
   ```solidity
   require(price > 0, "Invalid price");
   ```

3. **Decimal Normalization**
   ```solidity
   uint256 decimals = priceFeed.decimals();
   return price * (10 ** (18 - decimals));
   ```

## Security Considerations

### Price Manipulation Protection
- Chainlink's decentralized oracle network
- Multiple price feed validators
- Median price selection

### Staleness Protection
- 24-hour maximum age
- Automatic staleness checks
- Revert on stale data

### Admin Controls
- Limited admin functions
- No price override capability
- Transparent price sources

## Integration Guidelines

### Using the Price Feed

```solidity
// Get current XAG price
uint256 price = xagPrice.getXAGPriceUpdated();

// Calculate USDC amount for silver quantity
uint256 usdcAmount = (silverQuantity * price) / 1e18;
```

### Error Handling

```solidity
try xagPrice.getXAGPriceUpdated() returns (uint256 price) {
    // Use price
} catch Error(string memory reason) {
    // Handle price feed errors
}
```

### Price Scaling

```solidity
// Price is returned with 18 decimals
// Scale down by 14 for USDC (6 decimals) calculations
uint256 usdcPrice = (price * amount) / 1e14;
```

## Testing Strategy

### Unit Tests

1. **Price Updates**
   - Fresh price retrieval
   - Decimal handling
   - Scaling verification

2. **Validation**
   - Staleness checks
   - Zero price handling
   - Invalid feed responses

3. **Error Cases**
   - Feed disconnection
   - Admin functions
   - Recovery scenarios

### Integration Tests

1. **Protocol Integration**
   - PledgePlatform interaction
   - Price calculation accuracy
   - Error propagation

2. **System Tests**
   - Multi-contract scenarios
   - Edge case handling
   - Recovery procedures

## Deployment Considerations

### Prerequisites
1. **Chainlink Requirements**
   - Active XAG/USD price feed
   - Feed reliability verification
   - Network support confirmation

2. **Configuration**
   - Price feed address
   - Admin wallet setup
   - Gas estimation

### Verification Steps
1. **Post-Deployment**
   - Price feed connection
   - Decimal handling
   - Admin access

2. **Monitoring Setup**
   - Price update tracking
   - Staleness monitoring
   - Error alerting

## Best Practices

### Price Usage
1. **Always check return values**
2. **Handle potential reverts**
3. **Consider price staleness**
4. **Verify decimal scaling**

### Integration
1. **Use try-catch for safety**
2. **Cache prices when appropriate**
3. **Monitor price feed health**
4. **Plan for feed outages**

## Maintenance Notes

### Regular Tasks
1. **Monitor price feed health**
2. **Verify staleness period**
3. **Check admin access**
4. **Review error logs**

### Emergency Procedures
1. **Price feed failure response**
2. **Admin intervention process**
3. **System recovery steps**
4. **Communication protocol**