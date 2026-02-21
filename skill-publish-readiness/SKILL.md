---
name: skill-publish-readiness
description: Validate a skill folder before publish by checking required files, naming rules, size limits, and final registry target paths.
---

# Skill Publish Readiness

## Overview

Use this skill before publishing a skill to the registry.
It validates the local folder against publish-time rules and prints the exact final file paths that the registry PR will write.

## When To Use This Skill

- You are about to run `enskill publish` and want a pre-flight check.
- You want to verify `SKILL.md` frontmatter and slug format.
- You need to inspect final target paths under `skills/<skill-name>/...`.
- You are debugging a publish failure caused by invalid naming or oversized files.

## Quick Start

Run from this skill folder:

```bash
tsx scripts/check_publish_readiness.ts --skill-dir .
```

Run against another skill folder:

```bash
tsx scripts/check_publish_readiness.ts --skill-dir /absolute/path/to/skill
```

## Workflow

### 1. Validate local input

- Ensure `SKILL.md` exists.
- Parse frontmatter and resolve `name`.
- Enforce slug pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$`.

### 2. Validate publish files

- Include `SKILL.md`.
- Include files under `agents/`, `scripts/`, `references/`, and `assets/`.
- Reject files above the max file size threshold.

### 3. Preview final PR paths

Print all paths using the same formula as the registry helper:

```text
${skillRootDir}/${skillName}/${file.path}
```

Default `skillRootDir` is `skills`.

### 4. Decide

- Exit code `0`: ready to publish.
- Exit code `1`: blocking issues found.

## Resources

- `scripts/check_publish_readiness.ts`
- `references/publish-readiness-rules.md`
- `assets/readiness-report-template.md`
