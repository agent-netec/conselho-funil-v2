# Contract: Infrastructure & CI/CD Lane

## 1. Objectives
Ensure a clean, secure, and predictable environment for agent execution and system builds.

## 2. Environment Governance
All CI/CD pipelines and local execution environments must adhere to the following security protocols:

### 2.1 Proxy Sanitization (Pre-flight)
- **Rule**: `HTTP_PROXY`, `HTTPS_PROXY`, and `ALL_PROXY` environment variables must be explicitly unset or cleared before any build or agent execution starts.
- **Reasoning**: Prevent leakage of internal routing information and ensure agents do not attempt to route traffic through unauthorized gateways that might intercept sensitive data.
- **Implementation**: 
  - GitHub Workflows: Use a dedicated step to unset variables.
  - Local Scripts: Use `_netecmt/scripts/clear-proxy.ps1`.

## 3. Pre-flight Checks
Before any automated task (Build, Test, Deploy, or Agent Execution), the system must validate:
1. **Environment Cleanliness**: No residual proxy settings.
2. **Secret Availability**: All required keys in `auth-secrets-spec.md` are present.
3. **Workspace Integrity**: No uncommitted changes in critical `_netecmt` paths unless in a specific execution branch.

## 4. Boundary Rules
- **Access**: Agents in this lane can modify `.github/workflows/**` and `.cursor/rules/**`.
- **Constraint**: Infrastructure changes must be audited by `Dandara (QA)` before merging to `master`.

---
*Status: Drafted by Athos (Arch)*
