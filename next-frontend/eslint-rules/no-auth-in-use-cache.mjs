/*
 * A shared `"use cache"` entry is served to every visitor, so anything fetched
 * with a user's credentials inside one leaks to everyone else.
 * `"use cache: private"` is exempt because its entries are never shared.
 */

const forbidden = new Set([
  "serverClientWithToken",
  "authenticatedClient",
  "getSession",
]);

const isSharedCacheDirective = (statement) =>
  typeof statement.directive === "string" &&
  statement.directive.startsWith("use cache") &&
  statement.directive !== "use cache: private";

const hasSharedCacheDirective = (body) =>
  Array.isArray(body) && body.some(isSharedCacheDirective);

const isFunction = (node) =>
  [
    "FunctionDeclaration",
    "FunctionExpression",
    "ArrowFunctionExpression",
  ].includes(node.type);

const noAuthInUseCache = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow authenticated API access inside shared caches",
    },
    schema: [],
    messages: {
      noAuth:
        '"{{name}}" must not be used inside a shared "use cache" scope: the cached result would be served to every user.',
    },
  },
  create(context) {
    const source = context.sourceCode;

    const insideSharedCache = (node) =>
      source
        .getAncestors(node)
        .some(
          (ancestor) =>
            (ancestor.type === "Program" &&
              hasSharedCacheDirective(ancestor.body)) ||
            (isFunction(ancestor) &&
              hasSharedCacheDirective(ancestor.body?.body)),
        );

    return {
      Identifier(node) {
        if (!forbidden.has(node.name)) return;

        const { parent } = node;
        const isPropertyName =
          (parent.type === "MemberExpression" &&
            parent.property === node &&
            !parent.computed) ||
          (parent.type === "Property" &&
            parent.key === node &&
            !parent.shorthand);
        if (isPropertyName || parent.type.startsWith("Import")) return;

        if (insideSharedCache(node)) {
          context.report({
            node,
            messageId: "noAuth",
            data: { name: node.name },
          });
        }
      },
    };
  },
};

export default noAuthInUseCache;
