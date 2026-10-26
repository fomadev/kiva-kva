// Checks the snippets file: valid JSON, one unique prefix each, and bodies
// whose placeholders are balanced.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.join(__dirname, "..", "..");

interface Snippet {
  prefix: string;
  body: string[];
  description: string;
}

const snippets: Record<string, Snippet> = JSON.parse(fs.readFileSync(path.join(root, "snippets", "kva.json"), "utf8"));

test("every snippet has a prefix, a body and a description", () => {
  for (const [name, s] of Object.entries(snippets)) {
    assert.ok(s.prefix, `${name}: prefix`);
    assert.ok(Array.isArray(s.body) && s.body.length > 0, `${name}: body`);
    assert.ok(s.description, `${name}: description`);
  }
});

test("prefixes are unique", () => {
  const prefixes = Object.values(snippets).map((s) => s.prefix);
  assert.equal(new Set(prefixes).size, prefixes.length);
});

test("placeholders are balanced", () => {
  for (const [name, s] of Object.entries(snippets)) {
    const body = s.body.join("\n");
    // Count ${ against the } that close them, ignoring the braces of JSON
    // written inside a placeholder default (there should be none).
    let depth = 0;
    for (let i = 0; i < body.length; i++) {
      if (body[i] === "$" && body[i + 1] === "{") {
        depth++;
        i++;
      } else if (body[i] === "}" && depth > 0) {
        depth--;
      }
    }
    assert.equal(depth, 0, `${name}: unclosed placeholder`);
  }
});

test("the language configuration and grammar are valid JSON", () => {
  for (const file of ["language-configuration.json", "syntaxes/kva.tmLanguage.json", "package.json"]) {
    assert.doesNotThrow(() => JSON.parse(fs.readFileSync(path.join(root, file), "utf8")), file);
  }
});
