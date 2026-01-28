# Contract: NETECMT Core Lane

## 1. Objectives
Define the interaction boundary between the Workflow Engine and the Agent Personas.

## 2. Shared Data Structures (Interfaces)
```yaml
WorkflowContext:
  story_key: string
  story_pack_path: string
  execution_mode: "execution" | "audit" | "auto-healing"
  
AgentPrompt:
  role: string
  precision_context: string[] # Paths to pack files
```

## 3. Boundary Rules
- **Access**: Agents in this lane can read `_netecmt/core/**`.
- **Constraint**: Agents must NOT attempt to modify `_netecmt/bmb/workflows` without a Bridge Contract.

## 4. Required Stubs
- `load_precision_context(story_key)`
- `validate_lane_boundary(file_path)`

---
*Status: Approved by Kai*
