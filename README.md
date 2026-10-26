# KivaDB Language (.kva)

Syntax highlighting, editing rules and snippets for **KivaDB** command files (`.kva`), by [FomaDev](https://github.com/fomadev).

[KivaDB](https://github.com/fomadev/kiva-db) is a typed key-value, document and vector database in a single executable. A `.kva` file holds KivaDB commands, written as in its shell, and runs with `kivadb run file.kva`.

## Features

**Highlighting** of everything the KivaDB language has:

```kva
# Data of the shop
set produit:001 {
  "nom": "Riz 25kg",
  "prix": 45000,
  "stock": 30
}
set session:abc "amani" ttl 3600 if not exists
get where client:*.age > 30 and (ville = "Goma" or vip = true) limit 10
avg client:*.solde group by ville
create vector index on doc: (embedding) using hnsw metric cosine quantize sq8
eval 'return kiva.incr(ARGV[1])' visites
```

* commands and clause keywords, in any case;
* keys and key patterns (`client:42`, `user:*.address.city`), backtick keys (`` `get` ``);
* strings, numbers, `true` / `false` / `null`, type prefixes (`number`, `object`...), bytes (`0x...`, `b64:...`);
* JSON documents, over several lines;
* `${...}` inside the strings of `print`;
* the code of `eval '...'`, highlighted as Lua.

**Editing**: `#` comments with Ctrl+/ (KivaDB also reads `--` comments), brackets and quotes closed automatically, indentation inside documents, `# region` / `# endregion` folding.

**Snippets**: type a prefix and press Tab.

| Prefix | Inserts |
| :--- | :--- |
| `set`, `setttl`, `setnx`, `setdoc` | A key, with a TTL, only if missing, a JSON document |
| `jsonset`, `jsonincr`, `jsonappend` | Change a field, a number or an array in place |
| `where`, `whereand`, `groupby`, `explain` | Queries and aggregates |
| `index`, `vindex`, `hnsw`, `tune` | Secondary and vector indexes |
| `similar` | Similarity search, with a filter |
| `semlookup`, `semstore` | The semantic cache |
| `begin`, `savepoint` | Transactions |
| `eval`, `trigger`, `user`, `workspace`, `region` | Lua, triggers, accounts, workspaces, folding |

## Companion extensions

* **KivaDB Runner** (`fomadev.kiva-runner`): run a `.kva` file from the editor.
* **KivaDB Tools** (`fomadev.kiva-tools`): completion, hovers, and a live connection to a KivaDB server.
* **KivaDB Formatter** (`fomadev.kva-formatter`): Format Document and problems for `.kva` files.

## Development

```bash
npm install
npm test          # tokenizes sample lines with the grammar, checks the snippets
npx vsce package  # builds kiva-kva-<version>.vsix
```

**Releasing.** Add a `## <version>` section to `CHANGELOG.md`, set the same `version` in `package.json`, commit, then:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The `Release` workflow tests the extension, packages it and publishes a GitHub release with the `.vsix` and the notes of that version. Publishing on the Marketplace is manual: download the `.vsix` from the release, then upload it at <https://marketplace.visualstudio.com/manage/publishers/fomadev>.

## License

[Fordima Public License (FPL)](LICENSE).
