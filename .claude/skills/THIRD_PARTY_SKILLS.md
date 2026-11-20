# Third-party agent skills (vendored)

Project-level Claude Code skills installed 2026-11-20. Each folder is copied unmodified from its upstream repository at the commit below, with the upstream licence file added where the skill folder had none. Do not edit vendored skills; update by re-copying from upstream.

| Folder | Source | Commit | Licence |
|---|---|---|---|
| frontend-design | github.com/anthropics/skills · skills/frontend-design | e4bb5d9 | Apache-2.0 |
| ui-ux-pro-max | github.com/nextlevelbuilder/ui-ux-pro-max-skill · .claude/skills/ui-ux-pro-max | 2de1134 | MIT |
| vercel-react-best-practices | github.com/vercel-labs/agent-skills · skills/react-best-practices (folder renamed to match its `name`) | 1a2c79d | MIT |
| impeccable | github.com/pbakaus/impeccable · .claude/skills/impeccable | b49177d | Apache-2.0 |
| differential-review | github.com/trailofbits/skills · plugins/differential-review/skills/differential-review | 149d7b2 | CC BY-SA 4.0 (Trail of Bits) |
| supply-chain-risk-auditor | github.com/trailofbits/skills · plugins/supply-chain-risk-auditor/skills/supply-chain-risk-auditor | 149d7b2 | CC BY-SA 4.0 (Trail of Bits) |

Security review notes (2026-11-20):
- **impeccable**: `scripts/impeccable` launcher runs a native engine binary; if absent it downloads one on first run and verifies it against the SHA-256 list in `scripts/engine-checksums.txt` before executing. `live` mode injects a localhost script into the dev page. Treat its "permission to design" instructions as subordinate to DEC-14 (owner approves design before build).
- **ui-ux-pro-max**: local Python search scripts over bundled CSV data; no network calls except Google Fonts links in generated previews.
- **supply-chain-risk-auditor**: Python scripts (run via `uv`) that query public package registries for dependency risk data.
- **frontend-design, vercel-react-best-practices, differential-review**: instructions/reference files only.

Not vendored (plugins — install per developer with Claude Code `/plugin`): Superpowers (needs its SessionStart hook), Trail of Bits `insecure-defaults` (command/workflow plugin, no SKILL.md).
