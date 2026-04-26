# Corrupt Backup Git History Recovery

Source repository inspected:
`../drg-realtime-dashboard-corrupt-backup`

Recovery date:
`2026-04-25`

## Summary

The backup repository is partially corrupted. Normal `git log` operations fail because the object store and at least one ref are damaged, but the reflog files are still readable and preserve the recent local commit messages and branch movements.

Verified issues:

- `.git/objects/pack/pack-a8316305fb4004e64e3b3fb7135f24cc21be3aae.idx` is corrupt or truncated
- `.git/objects/59/bad843d29ccb105c1ebb20d15f817d546f1558` is empty
- `.git/objects/2a/a11ac84bbe8c3a2c920115e2f292d693e37aef` is empty
- `.git/refs/heads/main` appears empty or invalid

## Recovered Commit Timeline

Times below are in local time (`America/Chicago`, `CDT`) based on reflog timestamps.

| Time | Commit | Message |
| --- | --- | --- |
| 2026-04-24 21:22:39 CDT | `59bad843d29ccb105c1ebb20d15f817d546f1558` | `feat: add program access utility` |
| 2026-04-24 21:31:47 CDT | `ced135085a38b06ecc24a33ab36a492b15db1f91` | `refactor: reorganize program overview layout into tabs for better organization` |
| 2026-04-24 22:29:49 CDT | `ea670c88e19b05df8777a27c23847a60cfafd768` | `feat: implement context-aware back navigation across program, deliverable, and document pages` |

## Recovered Branch / HEAD Movements

The following sequence was recovered from `.git/logs/HEAD` and `.git/logs/refs/heads/allison-work`.

| Time | Event |
| --- | --- |
| 2026-04-24 20:00:16 CDT | Repository cloned from `https://github.com/allisonhelling/drg-realtime-dashboard.git` |
| 2026-04-24 21:21:59 CDT | Checkout from `main` to `allison-work` |
| 2026-04-24 21:22:39 CDT | Commit `59bad843d29ccb105c1ebb20d15f817d546f1558` created on `allison-work` |
| 2026-04-24 21:22:51 CDT | Checkout from `allison-work` to `main` |
| 2026-04-24 21:22:59 CDT | Checkout from `main` to `allison-work` |
| 2026-04-24 21:31:47 CDT | Commit `ced135085a38b06ecc24a33ab36a492b15db1f91` created on `allison-work` |
| 2026-04-24 22:29:49 CDT | Commit `ea670c88e19b05df8777a27c23847a60cfafd768` created on `allison-work` |

## Recovered Ref State

- `allison-work` points to `ea670c88e19b05df8777a27c23847a60cfafd768`
- `main` could not be resolved from the local ref file during recovery
- The pre-branch starting point seen in the reflog was `f06c5b69c5a33a1856df342f5ee34f2acc44bc67`

## Raw Reflog Sources

Primary files used for recovery:

- `../drg-realtime-dashboard-corrupt-backup/.git/logs/HEAD`
- `../drg-realtime-dashboard-corrupt-backup/.git/logs/refs/heads/allison-work`
- `../drg-realtime-dashboard-corrupt-backup/.git/COMMIT_EDITMSG`
