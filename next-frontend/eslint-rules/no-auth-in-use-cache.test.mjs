import { RuleTester } from "eslint";
import parser from "@typescript-eslint/parser";
import { describe, it } from "vitest";
import rule from "./no-auth-in-use-cache.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
const tester = new RuleTester({ languageOptions: { parser } });
const error = (name) => ({ messageId: "noAuth", data: { name } });

tester.run("no-auth-in-use-cache", rule, {
  valid: [
    // Unauthenticated client inside a cache.
    'async function f() { "use cache"; return serverClient.GET("/x"); }',
    // Authenticated client outside any cache.
    "async function f() { const s = await getSession(); return serverClientWithToken(s.accessToken); }",
    // Private caches are per-user.
    'async function f() { "use cache: private"; return getSession(); }',
    // A directive-looking string that isn't the first statement is not a directive.
    'async function f() { await x(); "use cache"; return getSession(); }',
    // Property names that merely match.
    'async function f() { "use cache"; return { getSession: 1 }.getSession; }',
  ],
  invalid: [
    {
      code: 'async function f(t) { "use cache"; return serverClientWithToken(t).GET("/x"); }',
      errors: [error("serverClientWithToken")],
    },
    {
      code: 'const f = async () => { "use cache: remote"; return getSession(); };',
      errors: [error("getSession")],
    },
    {
      code: 'async function f(t) { "use cache"; const g = () => authenticatedClient(t); return g(); }',
      errors: [error("authenticatedClient")],
    },
    {
      code: '"use cache";\nexport async function f() { return getSession(); }',
      errors: [error("getSession")],
    },
  ],
});
