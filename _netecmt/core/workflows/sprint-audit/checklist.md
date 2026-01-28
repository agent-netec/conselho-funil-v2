# Sprint Audit Checklist

## Preparation
- [ ] Git repository is accessible
- [ ] Commit range is determined (explicit or auto)
- [ ] `_netecmt/core/contract-map.yaml` is valid and loaded

## Analysis
- [ ] All changed files mapped to their respective lanes
- [ ] `CONTRACT_DRIFT` checked for every modified lane
- [ ] Boundary violations (unmapped files) identified
- [ ] Changes in `_netecmt/contracts/**` verified against lane logic

## Reporting
- [ ] Report generated in `_netecmt/reports/`
- [ ] Status (PASS/FAIL) clearly indicated
- [ ] Action items provided for System Integrator (Kai)

## Integration
- [ ] Workflow halts on critical drift to alert Integrator
