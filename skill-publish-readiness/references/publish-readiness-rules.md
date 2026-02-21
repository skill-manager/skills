# Publish Readiness Rules

This reference mirrors the publish behavior in this workspace:

## Required

- `SKILL.md` must exist.
- `name` should be lowercase slug format: `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- `SKILL.md` must be included in publish payload.

## Included Paths

Publish scanning includes:

- `SKILL.md`
- `agents/**`
- `scripts/**`
- `references/**`
- `assets/**`

## Limits

- Max file size used in the checker script default: `5 * 1024 * 1024` bytes.

## Final Target Path Formula

Each file is written in the registry PR under:

```text
${skillRootDir}/${skillName}/${file.path}
```

Example:

```text
skills/skill-publish-readiness/SKILL.md
skills/skill-publish-readiness/scripts/check_publish_readiness.ts
```
