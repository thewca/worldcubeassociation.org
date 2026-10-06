/*
 * Enforces logical props like `ps` and `me` instead of physical props like `pl`
 * and `mr` in Chakra for better right-to-left (RTL) support.
 *
 * File is entirely AI-generated and should be treated as a black box, with
 * unit tests in ./prefer-logical-properties.test.mjs. It catches common physical
 * props (e.g. padding, margin) but is not exhaustive; add additional `replacements`
 * as needed.
 */

const replacements = {
  ml: "ms",
  mr: "me",
  pl: "ps",
  pr: "pe",
  marginLeft: "marginStart",
  marginRight: "marginEnd",
  paddingLeft: "paddingStart",
  paddingRight: "paddingEnd",
  left: "insetStart",
  right: "insetEnd",
  borderLeft: "borderStart",
  borderRight: "borderEnd",
};

// These already-logical names are only used to detect conflicting declarations.
const aliases = {
  ms: "marginStart",
  me: "marginEnd",
  ps: "paddingStart",
  pe: "paddingEnd",
  marginInlineStart: "marginStart",
  marginInlineEnd: "marginEnd",
  paddingInlineStart: "paddingStart",
  paddingInlineEnd: "paddingEnd",
  insetInlineStart: "insetStart",
  insetInlineEnd: "insetEnd",
  borderInlineStart: "borderStart",
  borderInlineEnd: "borderEnd",
};
const lookup = (map, key) => (Object.hasOwn(map, key) ? map[key] : undefined);
const canonical = (name) => {
  const logical = lookup(replacements, name) ?? name;
  return lookup(aliases, logical) ?? logical;
};
const keyOf = (node) => (node.type === "JSXAttribute" ? node.name : node.key);
const nameOf = (node) =>
  node.computed && node.key.type !== "Literal"
    ? undefined
    : (keyOf(node)?.name ?? keyOf(node)?.value);

const preferLogicalProperties = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer logical start/end style properties for RTL support",
    },
    fixable: "code",
    schema: [],
    messages: {
      preferLogical:
        'Use "{{replacement}}" instead of "{{name}}" to support right-to-left (RTL) layouts.',
    },
  },
  create(context) {
    const source = context.sourceCode;
    // Resolve imports rather than guessing from prop or component names.
    function importInfo(node, scope = source.getScope(node)) {
      if (node.type.endsWith("MemberExpression") && !node.computed) {
        const info = importInfo(node.object, scope);
        return info?.name === "*"
          ? { ...info, name: node.property.name }
          : info;
      }
      if (!["Identifier", "JSXIdentifier"].includes(node.type)) return;
      const variable = scope.set.get(node.name);
      if (!variable) return scope.upper && importInfo(node, scope.upper);
      const definition = variable.defs[0];
      if (
        definition?.type !== "ImportBinding" ||
        definition.parent.importKind === "type" ||
        definition.node.importKind === "type"
      )
        return;
      return {
        module: definition.parent.source.value,
        name:
          definition.node.type === "ImportNamespaceSpecifier"
            ? "*"
            : (definition.node.imported?.name ?? "default"),
      };
    }
    const isComponent = (node) =>
      importInfo(node)?.module === "@chakra-ui/react";

    // Follow style objects passed to JSX, including same-file const bindings.
    // Plain data objects and destructuring patterns are outside this rule.
    function styleContext(node, seen = new Set()) {
      if (!node || seen.has(node)) return false;
      const nextSeen = new Set([...seen, node]);
      if (node.type === "JSXAttribute")
        return (
          isComponent(node.parent.name) &&
          (node.name.name === "css" || node.name.name.startsWith("_")) &&
          "style"
        );
      if (node.type === "JSXSpreadAttribute")
        return isComponent(node.parent.name) && "spread";
      if (node.type === "CallExpression") {
        const helper = importInfo(node.callee);
        return (
          helper?.module === "@chakra-ui/react" &&
          ["defineStyle", "defineGlobalStyles"].includes(helper.name) &&
          "style"
        );
      }
      if (node.type === "MemberExpression") return false;
      if (node.type === "VariableDeclarator") {
        if (node.parent.kind !== "const") return false;
        const uses = source
          .getDeclaredVariables(node)
          .flatMap((variable) =>
            variable.references
              .filter((reference) => reference.identifier !== node.id)
              .map((reference) => styleContext(reference.identifier, nextSeen)),
          );
        // A shared object may also supply unrelated data or non-Chakra props.
        if (uses.some((usage) => !usage)) return false;
        return uses.includes("spread") ? "spread" : uses.find(Boolean);
      }
      return styleContext(node.parent, nextSeen);
    }

    function report(node, name, replacement, fix) {
      context.report({
        node,
        messageId: "preferLogical",
        data: { name, replacement },
        fix,
      });
    }

    function checkProperty(node, siblings, allowFix = true) {
      const name = nameOf(node);
      const replacement = lookup(replacements, name);
      if (!replacement) return;
      const key = keyOf(node);
      // Spreads may supply an overriding logical prop; leave those cases for review.
      const conflict =
        !allowFix ||
        siblings.some(
          (sibling) =>
            sibling !== node &&
            (sibling.type.includes("Spread") ||
              canonical(nameOf(sibling)) === canonical(name)),
        );
      report(
        key,
        name,
        replacement,
        conflict
          ? undefined
          : (fixer) => {
              const text = source.getText(key);
              const newKey =
                key.type === "Literal"
                  ? `${text[0]}${replacement}${text[0]}`
                  : replacement;
              return fixer.replaceText(
                key,
                node.shorthand ? `${newKey}: ${text}` : newKey,
              );
            },
      );
    }

    function checkAlignment(node) {
      if (!node) return;
      if (node.type === "Literal" && ["left", "right"].includes(node.value)) {
        const replacement = node.value === "left" ? "start" : "end";
        report(node, node.value, replacement, (fixer) => {
          const quote = source.getText(node)[0];
          return fixer.replaceText(node, `${quote}${replacement}${quote}`);
        });
      } else if (node.type === "ObjectExpression") {
        node.properties.forEach((property) => checkAlignment(property.value));
      } else if (node.type === "ArrayExpression") {
        node.elements.forEach(checkAlignment);
      } else if (node.type === "ConditionalExpression") {
        checkAlignment(node.consequent);
        checkAlignment(node.alternate);
      } else if (node.type.startsWith("TS") && node.expression) {
        checkAlignment(node.expression);
      }
    }

    return {
      JSXAttribute(node) {
        if (!isComponent(node.parent.name)) return;
        checkProperty(node, node.parent.attributes);
        if (nameOf(node) === "textAlign")
          checkAlignment(node.value?.expression ?? node.value);
      },
      Property(node) {
        if (node.parent.type !== "ObjectExpression") return;
        const usage = styleContext(node);
        if (!usage) return;
        checkProperty(node, node.parent.properties, usage !== "spread");
        if (nameOf(node) === "textAlign") checkAlignment(node.value);
      },
    };
  },
};

export default preferLogicalProperties;
