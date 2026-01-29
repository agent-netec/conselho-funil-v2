# ADR 005: Pre-flight Check & Environment Sanitization

**Status**: Accepted  
**Date**: 2026-01-29  
**Author**: Athos (Arch)

## Context
In CI/CD environments and local developer machines, residual environment variables (specifically `HTTP_PROXY`, `HTTPS_PROXY`) can cause unpredictable behavior in AI agents and build tools. These variables might lead to failed connections, data leakage through unauthorized proxies, or bypass of security controls.

## Decision
We will implement a mandatory **Pre-flight Check** protocol for all automated workflows and agent executions.

### 1. Proxy Sanitization
- Every CI/CD job must start with a sanitization step that unsets `HTTP_PROXY`, `HTTPS_PROXY`, and `no_proxy`.
- The script `_netecmt/scripts/clear-proxy.ps1` is the source of truth for local sanitization.

### 2. Pre-flight Validation
Before proceeding with the main task, the environment must be validated for:
- Absence of proxy variables.
- Presence of mandatory workspace rules (`.cursor/rules`).
- Connectivity to core services (Firebase, Pinecone) without intermediaries.

## Consequences
- **Positive**: Increased security and predictability of builds and agent actions.
- **Negative**: Slight increase in job startup time (negligible).
- **Compliance**: Any workflow failing the Pre-flight Check must be aborted immediately.

## References
- `_netecmt/contracts/infrastructure.md`
- `_netecmt/core/contract-map.yaml`
