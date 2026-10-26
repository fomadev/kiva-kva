// Tokenizes real KivaDB lines with the grammar, through the same TextMate
// engine as VS Code, and checks the scopes given to each piece.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as oniguruma from "vscode-oniguruma";
import * as textmate from "vscode-textmate";

const root = path.join(__dirname, "..", "..");

async function loadGrammar(): Promise<textmate.IGrammar> {
  const wasm = fs.readFileSync(path.join(root, "node_modules", "vscode-oniguruma", "release", "onig.wasm"));
  await oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
  const registry = new textmate.Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (sources) => new oniguruma.OnigScanner(sources),
      createOnigString: (s) => new oniguruma.OnigString(s),
    }),
    // source.lua comes with VS Code; an empty stand-in leaves the Lua code unhighlighted here.
    loadGrammar: async (scope) =>
      scope === "source.kva"
        ? textmate.parseRawGrammar(fs.readFileSync(path.join(root, "syntaxes", "kva.tmLanguage.json"), "utf8"), "kva.tmLanguage.json")
        : scope === "source.lua"
          ? textmate.parseRawGrammar(JSON.stringify({ scopeName: "source.lua", patterns: [] }), "lua.json")
          : null,
  });
  const grammar = await registry.loadGrammar("source.kva");
  if (!grammar) throw new Error("grammar not loaded");
  return grammar;
}

/** Each piece of the lines with its innermost scope: [["set", "keyword.control.command.kva"], ...]. */
async function tokens(text: string): Promise<[string, string][]> {
  const grammar = await loadGrammar();
  let stack = textmate.INITIAL;
  const out: [string, string][] = [];
  for (const line of text.split("\n")) {
    const r = grammar.tokenizeLine(line, stack);
    for (const t of r.tokens) {
      const piece = line.slice(t.startIndex, t.endIndex);
      if (piece.trim()) out.push([piece.trim(), t.scopes[t.scopes.length - 1]]);
    }
    stack = r.ruleStack;
  }
  return out;
}

function scopeOf(toks: [string, string][], piece: string): string | undefined {
  return toks.find(([p]) => p === piece)?.[1];
}

test("comments start with # or --", async () => {
  const t = await tokens("# the shop\n-- imported today\nset a 1");
  assert.equal(t[0][1], "comment.line.number-sign.kva");
  assert.equal(t[1][1], "comment.line.double-dash.kva");
  assert.equal(scopeOf(t, "set"), "keyword.control.command.kva");
});

test("a command, a key, a string and a TTL", async () => {
  const t = await tokens('set session:abc123 "amani" ttl 3600');
  assert.equal(scopeOf(t, "set"), "keyword.control.command.kva");
  assert.equal(scopeOf(t, "session:abc123"), "variable.other.key.kva");
  assert.equal(scopeOf(t, '"'), "punctuation.definition.string.begin.kva");
  assert.equal(scopeOf(t, "amani"), "string.quoted.double.kva");
  assert.equal(scopeOf(t, "ttl"), "keyword.other.kva");
  assert.equal(scopeOf(t, "3600"), "constant.numeric.kva");
});

test("numbers inside keys are part of the key", async () => {
  const t = await tokens("get client:42 and commande:2026-10-22:0017");
  assert.equal(scopeOf(t, "client:42"), "variable.other.key.kva");
  assert.equal(scopeOf(t, "commande:2026-10-22:0017"), "variable.other.key.kva");
  assert.equal(scopeOf(t, "42"), undefined);
});

test("queries: patterns, comparisons, and / or / not", async () => {
  const t = await tokens('get where client:*.age > 30 and (vip = true or not ville = "Goma") limit 5');
  assert.equal(scopeOf(t, "where"), "keyword.other.kva");
  assert.equal(scopeOf(t, "client:*.age"), "variable.other.pattern.kva");
  assert.equal(scopeOf(t, ">"), "keyword.operator.comparison.kva");
  assert.equal(scopeOf(t, "or"), "keyword.other.kva");
  assert.equal(scopeOf(t, "not"), "keyword.other.kva");
  assert.equal(scopeOf(t, "true"), "constant.language.kva");
  assert.equal(scopeOf(t, "limit"), "keyword.other.kva");
});

test("vectors: metrics, HNSW options", async () => {
  const t = await tokens("create vector index on doc: (embedding) using hnsw metric cosine quantize sq8");
  assert.equal(scopeOf(t, "create"), "keyword.control.command.kva");
  assert.equal(scopeOf(t, "hnsw"), "support.constant.kva");
  assert.equal(scopeOf(t, "cosine"), "support.constant.kva");
  assert.equal(scopeOf(t, "sq8"), "support.constant.kva");
  assert.equal(scopeOf(t, "using"), "keyword.other.kva");
});

test("JSON documents over several lines", async () => {
  const t = await tokens('set user:1 {\n  "name": "Fordi",\n  "age": 22,\n  "tags": ["a", null]\n}');
  assert.equal(scopeOf(t, '"name"'), "support.type.property-name.json.kva");
  assert.equal(scopeOf(t, "Fordi"), "string.quoted.double.kva");
  assert.equal(scopeOf(t, "22"), "constant.numeric.kva");
  assert.equal(scopeOf(t, "null"), "constant.language.kva");
  // A field name that is a command word is not taken for a command.
  const u = await tokens('set x {\n  "set": 1\n}');
  assert.equal(scopeOf(u, '"set"'), "support.type.property-name.json.kva");
});

test("type prefixes, bytes and backtick keys", async () => {
  const t = await tokens("set number poids 70 and logo 0x89504E47 and `get` b64:SGVsbG8=");
  assert.equal(scopeOf(t, "number"), "storage.type.kva");
  assert.equal(scopeOf(t, "0x89504E47"), "constant.numeric.hex.kva");
  assert.equal(scopeOf(t, "`get`"), "variable.other.key.quoted.kva");
  assert.equal(scopeOf(t, "b64:SGVsbG8="), "constant.other.base64.kva");
});

test("print interpolation", async () => {
  const t = await tokens('print "Total ${prix * 2} FC"');
  assert.equal(scopeOf(t, "${"), "punctuation.section.interpolation.begin.kva");
  assert.equal(scopeOf(t, "prix"), "variable.other.kva");
});

test("eval embeds Lua code", async () => {
  const t = await tokens("eval 'return kiva.get(ARGV[1])' compte:amani");
  assert.equal(scopeOf(t, "eval"), "keyword.control.command.kva");
  assert.equal(scopeOf(t, "return kiva.get(ARGV[1])"), "meta.embedded.block.lua");
  assert.equal(scopeOf(t, "compte:amani"), "variable.other.key.kva");
});

test("upper case commands are recognized", async () => {
  const t = await tokens('SET Pays "RDC"');
  assert.equal(scopeOf(t, "SET"), "keyword.control.command.kva");
});
