# Changelog

Every version of the extension, newest first. A version tag `v<version>` publishes the section of that version as the GitHub release notes, so add the section before tagging.

## 1.0.0 - 2026-10-26

### Added

* The `kva` language for KivaDB command files (`.kva`), with the KivaDB icon.
* Syntax highlighting: commands, clause keywords (`where`, `and`, `or`, `not`, `ttl`, `limit`...), keys and key patterns (`client:42`, `user:*.address.city`), strings, numbers, `true` / `false` / `null`, type prefixes, bytes (`0x...`, `b64:...`), metrics and index kinds, JSON documents over several lines, `${...}` in `print`, and the Lua code of `eval '...'`.
* Editing rules: `#` comments (Ctrl+/), brackets and quotes closed automatically, indentation inside documents, `# region` / `# endregion` folding.
* Snippets for documents, queries, aggregates, indexes, transactions, vector search, HNSW tuning, the semantic cache, Lua, triggers, users and workspaces.
