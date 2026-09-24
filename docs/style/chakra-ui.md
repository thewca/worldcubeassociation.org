# Chakra UI and styling

**Applies to:** the design (UI and UX) of the new frontend under the `/next-frontend` folder.

This also partially applies to general work in the Next frontend, especially if you expect to submit
many PRs on the Next website (even when it's not about design in the stricter sense).

Chakra v3 is the component library _and_ our design system. We fully embrace the framework,
which has one important consequence: **Absolutely zero** hand-written CSS.

## 1 Mobile first

Design for the smallest screen first and widen from there. Competitors read this site on a phone, in
a venue, on bad WiFi — that's the common case, not the edge case. Retrofitting a desktop layout to
mobile afterwards is where our layout bugs come from, so treat mobile as a starting constraint rather
than a polish step.

- Write responsive props smallest-first: `w={{ base: "full", md: "50%" }}`. Never a fixed desktop
  value with a mobile override bolted on after review.
- **Never leave `base` unspecified** in a responsive prop — it's the case most of our users get.
- Prefer components that reflow on their own (`SimpleGrid` with `columnCount`, `Stack` that
  switches direction) over breakpoint branching that you need to maintain by hand.
- Look at a narrow viewport before you open the PR. Tables, dialogs and toolbars are the usual
  casualties.

## 2 Style props and the theme, not raw CSS

### No `style={{ ... }}`.

Nearly everything has a Chakra prop equivalent — `fontWeight`, `position`, `w`, `h`. Use it.

### No hex colors or ad-hoc palettes in components

Colors belong in `src/theme.ts`, referenced through `colorPalette` and semantic tokens
(`bg`, `colorPalette.border`). If a set of styles varies by a known set of values,
define a **recipe variant** in the theme and select it by value.

### No arbitrary numbers

Use tokens (`sm`, `xl`, `2xl`, `full`) over `44`, `100%`, `w="100%"`.

### Use `textStyle`

We define `h1`–`h3`, `s1`, `s2` already, please use them rather than picking font sizes and weights by hand.

Don't force `textTransform` when the `textStyle` already decides it. If really necessary, make a good case for
introducing a new shared `textStyle` in `theme.ts`.

### Other
- In our own theme you don't need Chakra's `--var` indirection — pass the palette colour directly.
- Chakra ships `fade-in` / `fade-out` keyframes and animation style props out of the box. Check
  before writing custom keyframes or a self-toggling boolean.

## 3 Use the component that exists

Before hand-rolling layout, check Chakra for: `SimpleGrid` (with optional `column-span`), `Stack`/`HStack`
(with `justifyContent="space-between"` instead of a `Spacer`), `List`, `Table.ColumnGroup`, `Float`,
`Status`, `Pagination`, `LinkOverlay`, `StatGroup`, `CheckboxGroup`.

- A mapped list of `Text` elements is a code smell — wrap it in the component that says what it is.
- Use `asChild` to merge wrappers instead of nesting redundant DOM nodes.
- Use compound dot-notation consistently (`Popover.Trigger`, not an imported `PopoverTrigger`).
- Prefer the component's own `disabled` prop over simulating a disabled look with color overrides.
- Use the responsive shorthands where they fit: `mdOnly`, `hideBelow`, `hideFrom` (see
  [§7.1](#71-mobile-first) for the `base`-first rule itself).
- Don't apply a fix at a lower level than the problem. Changing `IconDisplay` to constrain every icon
  everywhere, or teaching `Markdown.tsx` a global `maxWidth`, is too blunt — fix it at the call site
  or add a prop that can be passed down.
