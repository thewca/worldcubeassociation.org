# Next.js frontend

**Applies to:** the new frontend under the `/next-frontend` folder.

We're using App Router with React Compiler enabled. It means that files in the folder imply the routes,
and within each file for a page you don't have to worry about `useMemo` or `useCallback` at all.

## 1 Server components by default

If a page or component can be an `async` server component, it must be. Fetching the BetterAuth session,
computing derived values, and awaiting API calls all work server-side.

When one interactive widget forces client rendering (a dropdown, a toggle), extract *that widget*
into its own `"use client"` component and leave the rest of the tree server-rendered. Don't mark a
whole page as client because of a single control button.

Where you must use `"use client"` for a non-obvious reason (e.g. passing icon functions from server
to client throws a hard error under Next 16), say so in a comment.

## 2 Types come from the schema

Never hand-declare a type that describes API data. Derive it:

```ts
type StatColumns = Pick<components["schemas"]["LiveResult"], "best" | "average" | "global_pos">;
```

Use `Pick`, `Partial`, and `Omit` on the generated OpenAPI types so a spec refactor breaks the build
instead of silently drifting. The same applies to Payload types — regenerate them
(`yarn types:payload`) rather than editing `src/types/payload.ts`.

- **No `as` casts.** If you need one, the type is wrong somewhere — say what you tried in the PR.
- **No `!` non-null assertions.** Restructure so the value can't be undefined (hoist the lookup
  above an early return; React Compiler means you no longer need `useCallback`, so the
  "hooks before early return" constraint is looser than you think).
- Prefer `undefined` over `null` for optional values, and let `useState<number>()` infer.
- Use library-provided types (`TFunction` from i18next, Next's `instrumentation` types) instead of
  writing your own structural equivalents. Spend five minutes in the library's source before
  you spend ten minutes to painstakingly mimic a 20-line interface.
- Type a wrapper from the component it wraps: intersect your own props with
  `ComponentPropsWithoutRef<typeof Icon>` so the wrapper accepts everything the wrapped component
  does.
  - Anything returned by Chakra's `createIcon` essentially _is_ an `Icon` component
    and does not need to be wrapped within `<Icon>{...}</Icon>` again.
- Pass real types across props. A boolean prop receives `true`, not `"true"`.
- Use `as const` for lookup objects that should narrow.

## 3 Data fetching with Tanstack Query

- We rely on `openapi-typescript` as a bridge between the OpenAPI types and Tanstack Query.
  Pull `api.queryOptions(...)` once and spread it, rather than nesting `useQuery` calls — `api.useQuery`
  is itself a thin wrapper around `useQuery`.
- **Don't use `enabled: false`** to freeze a query into a dumb prop container. If you have the data
  already, pass `initialData`.
  - Reshape with `select` if the shape doesn't match.
- Let the query client hold the state. `queryClient.setQueryData(key, (old) => next(old))` supports
  updater functions exactly like `useState` — use it instead of mirroring server state into an actual
  React `useState` while manually syncing the two.
- `setQueryData` on a key that doesn't exist is a no-op, so you rarely need to check for presence first.
- `isPending` is only true for the *initial* fetch. Use `isFetching` if you care about subsequent refetches
  and invalidations.
- If you just refetched, don't also patch the cache by hand — the refetch already brought the truth.
- Prefer `setQueryData` from a mutation's response over `invalidateQueries` when the server already
  told you the new state (it usually does). This saves a network round trip.
- Don't fetch data incidentally deep in a helper "because it's cached anyway". Fetch it explicitly
  where it's needed, so the next developer can find and reuse it.
- Keep `lazyMount` on dialogs, tabs, and accordions. Without it every panel's queries fire on page
  load — including the "list every Delegate region in the database" request behind a tab the user
  never opened.
- Give toasts stable IDs to prevent duplicates across re-renders.

## 4 Component structure

- **Nothing complex inside JSX.** Inline arrow callbacks are fine only for trivial one-liners
  (`onClick={() => setOpen(true)}`) and boolean comparisons. Anything with an `if`, a `map` that
  reshapes data, or more than one statement moves to a named const in the component preamble.
- **Nothing complex inside `if (...)` either.** Assign the call's result to a named variable and test
  the variable — the name is necessary to tell the next reader what the condition means.
- Extract a dialog or a repeated block into its own component file once it's more than incidental.
- Prefer `children` over a `text?: string | ReactNode` prop with `typeof` checks. `children` handles
  strings natively.
  - You can even consider child callbacks: React resolves everything passed in between the opening and
    closing tags as `children` and allows pretty much any type. So you can do something like:
    `<WrapperRow>{(wrappedItem) => whatToDoWithIt(wrappedItem)}</WrapperRow>`
- Put context providers as high in the tree as they can reasonably go. A provider that toasts should
  render its own `Toaster` rather than requiring consumers to remember one.
- Be consistent about how a context is consumed: either every child reads it internally, or every
  child receives props. Don't mix within one feature.
- `useEffect` is for synchronizing with systems outside React (a websocket, a timer) and **must**
  return a cleanup function. Anything else needs justification.
  - Read https://react.dev/learn/you-might-not-need-an-effect if you want to learn more. We are really,
    really allergic to `useEffect` and every existing one is the conclusion of a very lengthy debate.
  - `useLayoutEffect` needs an even better justification — there's essentially one in the entire codebase.
- Wrap `useEffectEvent` inside the hook that owns the effect. Per the React docs, Effect Events must
  never be passed to other components or hooks.
- Everything user-visible goes through i18n. Server components use `const { t } = await getT();`.
  - You will see lots of hard-coded English strings in the existing code. They come from Alpha builds
    or even earlier proof-of-concept designs. Feel free to properly localize them if you have a moment.

## 5 Other important conventions

- Use Luxon `DateTime`, not JS `Date`. Reconsider once wide-spread `Temporal` support has landed; see the
  [MSN docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal)
  for updates.
- Parse dates before sorting them. Never sort date strings with `localeCompare`.
- Icons come from our own pack or Lucide. Don't introduce a new react-icons family.
