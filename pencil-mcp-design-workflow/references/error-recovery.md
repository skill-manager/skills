# Error Recovery Playbook

## Element not found
Symptoms:
- batch_design references an ID that no longer exists
- Override path is wrong in an instance

Fix:
1) get_editor_state
2) batch_get with broader search to rediscover target nodes
3) If instances: batch_get(resolveInstances: true), then retry with correct descendant paths

## Batch rollback pain
Symptoms:
- One failed op reverts the whole batch

Fix:
- Reduce batch size to 1–5 ops to isolate the failing op
- Re-apply the batch as multiple smaller batches grouped by intent

## Schema mismatch / validation error
Fix:
1) tools/list to confirm required fields/types
2) Adjust payload
3) Retry with minimal batch

## Visual regressions (spacing/constraints)
Fix:
- Re-fetch affected nodes and inspect constraints
- Revert the specific property changes that caused drift
- Re-apply with tighter, more explicit constraint ops
