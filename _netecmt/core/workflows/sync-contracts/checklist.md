# Sync-Contracts Checklist

## Input Validation
- [ ] Valid `audit-report.json` loaded
- [ ] Lane-to-Contract mapping verified via `contract-map.yaml`

## Execution
- [ ] Implementation files analyzed for behavioral changes
- [ ] Contract update reflects ALL detected changes
- [ ] Existing contract formatting/structure preserved
- [ ] No regression introduced in contract stubs/interfaces

## Verification
- [ ] Post-sync audit runs successfully
- [ ] No `CONTRACT_DRIFT` reported for handled lanes
- [ ] Final report updated with sync results
