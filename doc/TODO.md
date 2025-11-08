# Project TODO (Tracked)

This file summarizes the current tracked tasks for the Critical Money project. The canonical task list is managed by the repository todo manager (use the tool for programmatic updates).

## Outstanding Tasks

1. [x] Use uRWA package
   - ID: 1
   - Status: completed
   - Description: Replace the local implementation of uRWA with the official EIP package. Update imports, adapt contracts that depend on uRWA, run and fix tests, and verify storage/layout compatibility.

2. [x] Update Pledgor to use Critical Money project
   - ID: 2
   - Status: completed
   - Description: Replace the local Pledgor copy with the centralized Critical Money project (https://github.com/raspcwalter/cMoney_prehack). Update imports, dependencies and remappings, run full tests, and prepare a changelog for deployment.

  **Integration note (issue discovered):** The installed `cMoney_prehack` package contains nested libraries under `lib/cMoney_prehack/contracts/lib/` (for example: `chainlink`, `openzeppelin-contracts`, `uRWA`, and others). These nested copies duplicate dependencies and can cause remapping conflicts, larger repo size, and confusing import paths.

  Recommended follow-up: clean the nested libs after integration by moving required dependencies to the top-level `lib/`, updating `remappings.txt`, and removing unnecessary nested folders. See Task 2.1b below.

 - [x] Task 2.1a — Create integration branch & backup
    - Status: completed
    - Create a feature branch `integrate/cmoney-upstream`, commit or stash local changes, and make a backup (git bundle or archive) before installing the upstream package. This avoids accidental local data loss during integration.

 - [ ] Task 2.1b — Clean nested libs in cMoney_prehack
    - Move required dependency folders from `lib/cMoney_prehack/contracts/lib/` to the repository's top-level `lib/` (or install them separately), update `remappings.txt` accordingly, and remove the remaining nested folders to avoid duplication. Verify imports and run `forge test` after cleanup.

3. [ ] Expand mineral price feeds
   - ID: 3
   - Status: not-started
   - Description: Add support for price feeds for other minerals/metals (e.g., XAU, XPT). Integrate additional oracles, update loan calculation logic and documentation, and create integration tests.

4. [x] Remove Silver inheritance from PledgePlatform
   - ID: 4
   - Status: completed
   - Description: PledgePlatform should not inherit from the Silver token contract. Change PledgePlatform to interact with Silver via an interface (e.g., ISilver), remove token logic from the platform, adjust inheritance, update imports/tests, and verify storage layout and access control remain correct.

## Notes
