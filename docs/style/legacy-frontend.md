# Legacy React (`app/webpacker/`)

**Applies to:** any `.jsx` / `.js` file under `app/webpacker/`, and reviews of diffs that touch one.
Not `next-frontend/`, whose rules are the opposite.

Part of the [WCA style guide](../STYLE_GUIDE.md); §1–§2 there (immutability, no magic values, naming)
still apply on top of this.

`app/webpacker/` is on Semantic UI and **has no React Compiler**.

- You *do* need `useCallback` / `useMemo` here to keep references stable.
- **No custom CSS here either.** No `style={{ marginBottom: ... }}`, no `className`s that SemUI
  doesn't define — the framework has props for spacing and layout. The one researched exception is
  horizontal table overflow (`overflowX`), which SemUI genuinely doesn't support.
- Use Semantic UI dot-notation (`Table.Header`, `Table.HeaderCell`) — it removes a pile of imports.
- Use our own hooks: `useInputState` / `useInputUpdater` wrap `useState` so the setter can be passed
  straight to a SemUI `Input`'s `onChange`. `useLoadedData` returns response `headers`, which carry
  total-count information for pagination (see `IncidentsLog/index.jsx`).
- Use `fetchJsonOrError` as-is. It has error handling built into its name; don't wrap it in your own.
- Build URLs with the helpers in `lib/requests/routes.js.erb` (`competitionUrl(...)`), not string
  concatenation.
- `mutationFn` must not close over component state. Pass the values in as parameters — it keeps
  renders stable.
- `useMutation` has `onError` alongside `onSuccess`. Use it rather than hand-rolling error handling.
- Beware `onSuccess` argument shadowing: `onSuccess={setSuccess}` passes the *server response* as the
  new state. Write `() => setSuccess(true)` if that's what you mean.
- Use `Message` components for user-facing errors — not bare `className`s that don't exist in SemUI.
- Prefer early returns for loading states (`if (isFetching) return <Loader />`) so `data` is
  implicitly defined afterwards, then a ternary for the empty-vs-populated case.
- Use `<Ref>` when you need to attach a ref to a SemUI component that doesn't forward one. Don't add
  a wrapper `<div>` to hold the ref, and don't hand-roll a replacement for a component we already
  have — wrap the existing one.
