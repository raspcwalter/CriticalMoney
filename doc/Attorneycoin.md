# Attorneycoin (ATC) — Contract Documentation

## Overview
Attorneycoin (`ATC`) is a simple ERC-20-like token contract implemented in Solidity 0.8.20. It provides basic token functionality (balance tracking, transfers, allowances) plus two minting paths:

- `mintToUser()` — a user-facing mint function intended to top up a user's balance up to a daily per-user limit.
- `adminMint(uint256)` — an admin-only mint function that allows the contract admin to mint arbitrary amounts to the admin address.

The contract is minimal and does not fully import or implement the full OpenZeppelin ERC-20 implementation; it provides the common ERC-20 functions and events itself.

## Source
File: `src/Attorneycoin.sol`
Solidity pragma: `^0.8.20`

## Token Metadata
- name: "Attorneycoin"
- symbol: "ATC"
- decimals: `6`
- initial totalSupply: `1_000_000 * 10**decimals` assigned to the admin (deployer) in the constructor

## Inheritance and Imports
- Imports `@openzeppelin/contracts/interfaces/IERC20.sol` but the contract does not explicitly inherit from or implement `IERC20`. It implements compatible public functions and events.

## State Variables
- `address public admin` — the admin (deployer) account with special privileges.
- `uint256 public totalSupply` — the total token supply.
- `mapping(address => uint256) private _balances` — account balances.
- `mapping(address => mapping(address => uint256)) private _allowances` — allowances for `transferFrom`.
- `mapping(address => uint256) public userMintedAmount` — used in the contract's `mintToUser()` logic (see notes/breaking behavior below).

## Events
- `Transfer(address indexed _from, address indexed _to, uint256 _value)` — emitted on transfers and minting (from `address(0)`).
- `Approval(address indexed _owner, address indexed _spender, uint256 _value)` — emitted when `approve` is called.
- `Mint(address indexed _to, uint256 _value)` — emitted when tokens are minted.

## Modifiers
- `onlyAdmin` — restricts function calls to the `admin` address. Reverts with "Only admin" when caller is not admin.

## Constructor
- Sets `admin = msg.sender`.
- Sets `totalSupply = 1_000_000 * 10**decimals` (i.e., 1,000,000 × 10^6) and assigns it to `_balances[admin]`.

## Public / External Functions (API)
All function signatures and behaviors are shown below with notes.

### balanceOf(address _owner) -> (uint256)
- Visibility: `public view`
- Returns the token balance for `_owner` from the `_balances` mapping.

### transfer(address _to, uint256 _value) -> (bool)
- Visibility: `public`
- Behavior:
  - Requires `msg.sender` balance >= `_value`.
  - Subtracts `_value` from sender, adds to `_to`.
  - Emits `Transfer(msg.sender, _to, _value)`.
  - Returns `true` on success.

### approve(address _spender, uint256 _value) -> (bool)
- Visibility: `public`
- Behavior:
  - Sets `_allowances[msg.sender][_spender] = _value`.
  - Emits `Approval(msg.sender, _spender, _value)`.
  - Returns `true` on success.
- NOTE: No `increaseAllowance`/`decreaseAllowance` helpers are present.

### allowance(address _owner, address _spender) -> (uint256)
- Visibility: `public view`
- Returns current allowance for `_spender` by `_owner` from `_allowances`.

### transferFrom(address _from, address _to, uint256 _value) -> (bool)
- Visibility: `public`
- Behavior:
  - Requires `_balances[_from] >= _value`.
  - Requires `_allowances[_from][msg.sender] >= _value`.
  - Subtracts `_value` from `_balances[_from]` and from `_allowances[_from][msg.sender]`.
  - Adds `_value` to `_balances[_to]`.
  - Emits `Transfer(_from, _to, _value)`.
  - Returns `true` on success.

### mintToUser() -> (void)
- Visibility: `external`
- Intention: allow users to mint tokens for themselves up to a daily per-user limit.
- Behavior observed in code:
  - Sets `userMintLimit = 10 * 10 ** 6` (i.e., 10 × 10^6 units, considering `decimals = 6` this likely means 10 ATC if decimals=6 — verify units).
  - If `(block.timestamp - userMintedAmount[msg.sender]) > 1 days`, it resets `userMintLimit` and sets `userMintedAmount[msg.sender] = 0`.
  - Requires `userMintedAmount[msg.sender] < 1 days` with error "User mint deadline reached".
  - Computes `uint256 minted = userMintLimit - _balances[msg.sender];`
  - Requires `userMintLimit > _balances[msg.sender]` with error "Your balance can't be more than the mint limit".
  - Adds `minted` to `_balances[msg.sender]` and to `totalSupply`.
  - Sets `userMintedAmount[msg.sender] = block.timestamp`.
  - Emits `Mint(msg.sender, minted)` and `Transfer(address(0), msg.sender, minted)`.

- IMPORTANT: See "Known issues & recommended fixes" below — the current implementation contains logic that appears inconsistent/buggy (mapping `userMintedAmount` is used both as a timestamp and as an amount in checks, the deadline check is likely incorrect, and `minted` is computed relative to current balance which may be surprising).

### adminMint(uint256 minted) -> (void)
- Visibility: `external` (protected by `onlyAdmin`)
- Behavior:
  - Increases `_balances[admin]` by `minted` and increases `totalSupply` by `minted`.
  - Emits `Mint(admin, minted)` and `Transfer(address(0), admin, minted)`.

## Gas & Safety Notes
- Solidity 0.8.x provides automatic overflow/underflow checks, which is good.
- The contract does not use OpenZeppelin's audited ERC-20 implementation; while the functions are typical, reusing audited implementations is recommended to avoid subtle bugs.
- The `mintToUser()` logic contains suspicious timestamp/amount mixing — see the bug section below.
- No ownership transfer or admin renounce function is present; admin is permanently set to deployer unless contract modified.
- `approve` directly sets allowance without checks: ERC-20 race-condition mitigation (increase/decrease helpers) is not provided.

## Known issues & recommended fixes (important)
The `mintToUser()` function has logic that looks incorrect and can lead to unexpected behavior. Specific problems:

1. Mixing semantics of `userMintedAmount`:
   - The contract declares `mapping(address => uint256) public userMintedAmount;` but uses it both in timestamp arithmetic (`block.timestamp - userMintedAmount[msg.sender]`) and also compares it to `1 days` (`userMintedAmount[msg.sender] < 1 days`). This is inconsistent.
   - Recommendation: separate concerns. Use `mapping(address => uint256) public lastMintTimestamp;` to store the timestamp of the last mint, and if you need to track how much a user has minted during a period, use another mapping like `mapping(address => uint256) public mintedThisPeriod;`.

2. The `require(userMintedAmount[msg.sender] < 1 days, "User mint deadline reached");` check is almost certainly wrong. It compares a timestamp to `1 days`, which will normally be a much larger number than `1 days` (seconds since epoch), so the require will likely revert for users who have any non-zero stored timestamp. This likely prevents minting after the first call.
   - Recommendation: replace with a check on `block.timestamp - lastMintTimestamp[msg.sender] >= 1 days` to allow once-per-day behavior, or track cumulative minted amounts per day and reset them when a day elapses.

3. `uint256 minted = userMintLimit - _balances[msg.sender];` mints enough tokens to bring the user's balance up to the limit. This means a user with a balance below the limit receives the difference. That's an unusual pattern but might be intended. However, if `_balances[msg.sender]` is unexpectedly large, that line would underflow (but underflow protection will revert). It's safer to compute `minted = userMintLimit > _balances[msg.sender] ? userMintLimit - _balances[msg.sender] : 0` and guard earlier.

4. No explicit maximum total supply cap. Admin can mint arbitrarily via `adminMint` increasing `totalSupply` without limit.

5. `userMintLimit` is set locally per-call (not a contract variable) which is fine, but the code resets `userMintedAmount[msg.sender] = 0` when a day elapsed — mixing timestamp/amount semantics again.

Suggested corrected approach (outline):
- Create `mapping(address => uint256) public lastMintAt;` and `mapping(address => uint256) public mintedToday;`.
- Create a `uint256 public userMintLimit = 10 * 10**6;` contract-level constant (or immutable) so it can be referenced and updated.
- On `mintToUser()`:
  - If `block.timestamp - lastMintAt[msg.sender] >= 1 days` then set `mintedToday[msg.sender] = 0` and `lastMintAt[msg.sender] = block.timestamp`.
  - Compute `uint256 available = userMintLimit > mintedToday[msg.sender] ? userMintLimit - mintedToday[msg.sender] : 0;` then `mintAmount = min(available, userMintLimit - _balances[msg.sender])` if you intend to limit by balance.
  - Update `mintedToday[msg.sender] += mintAmount;` and proceed.

## Example usage (ethers.js)
Note: replace `CONTRACT_ADDRESS` and `ABI` accordingly.

1) Read balance:
```js
const balance = await contract.balanceOf(userAddress);
```

2) Standard transfer:
```js
await contract.connect(signer).transfer(recipientAddress, amount);
```

3) User mint (callable by any user):
```js
await contract.connect(userSigner).mintToUser();
```

4) Admin mint (only admin):
```js
await contract.connect(adminSigner).adminMint(amount);
```

## Tests to add (recommended)
- Happy path: constructor sets initial supply and admin balance correctly.
- ERC-20 basics: transfer, approve, allowance, transferFrom with positive and negative cases.
- `mintToUser()` behavior:
  - When user balance < limit -> minting tops up to limit.
  - When user balance >= limit -> revert with expected message.
  - Verify daily reset behavior across 1 day boundary (using block timestamp manipulation in tests).
- `adminMint()` access control: only admin allowed.
- Edge cases: extremely large mint arguments to `adminMint`, reentrancy is not a concern here (no external calls), but verify invariants for `totalSupply`.

## Security considerations
- Consider using OpenZeppelin's `ERC20` and `Ownable` contracts to reduce risk.
- Consider adding events or limits for adminMint to improve transparency.
- If `mintToUser()` is intended for a real economic use-case, clearly define and implement rate-limiting and per-user accounting.

## Summary
`Attorneycoin` is a compact token contract providing basic token operations plus a user mint and an admin mint. The contract contains a likely-buggy implementation in `mintToUser()` where a single mapping `userMintedAmount` is used both as a timestamp and as a counter, and a `require` appears to compare a timestamp to `1 days`. I recommend fixing the minting logic as described above and adding/using audited OpenZeppelin building blocks where possible.

---

If you want, I can:
- Apply a minimal fix to `mintToUser()` (suggested implementation) and add NatSpec comments to `src/Attorneycoin.sol`.
- Or simply add inline NatSpec comments without logic changes.

Tell me which you prefer and I'll proceed (I can implement the safe fix and run quick static checks/tests if you want).