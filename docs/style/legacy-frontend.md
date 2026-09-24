# Legacy React (`app/webpacker/`)

**Applies to:** any `.jsx` / `.js` file under `app/webpacker/`.

_NOTE_: You should **not** be creating any new files (let alone whole features) under the legacy
Webpacker frontend. Touching existing files is acceptable when fixing bugs or augmenting existing
features with functionality that is deemed _immediately necessary_.

Before you dive deep into your work in Shakapacker, double-check that you are _really_ sure what you're doing!!

`app/webpacker/` is on Semantic UI (SemUI for short) and **has no React Compiler**. This means that
you *do* need `useCallback` / `useMemo` here to keep references stable.


- **No custom CSS.** No `style={{ marginBottom: ... }}`, no `className`s that SemUI
  doesn't define — the framework has props for spacing and layout.
  - If your component doesn't have the specific layout props that you need, wrap it
    inside of a `<Segment basic>` or use `<Divider>` to space it out.
  - Exception 1: Horizontal table overflow (`overflowX`), which SemUI genuinely doesn't support.
    You will need to wrap the `<Table>` in your own `<div>` with a corresponding `style` tag
  - Exception 2: In some rare cases, the CSS classes used by SemUI can conflict with the even older
    parts of our frontend still running on Bootstrap 3. By now, the Shakapacker frontend is mature enough
    that we have caught most of these conflicts, but in the extremely unlikely event that you ever run
    into a bug that doesn't come forward even after half an hour of debugging, please reach out via Slack
    rather than banging your head against the wall. Chances are that it's an ultra-subtle CSS classname conflict.
- Use Semantic UI dot-notation (`Table.Header`, `Table.HeaderCell`) instead of manually importing
  all of `TableHeader`, `TableHeaderCell` and `TableFooter` separately.
- Use our own hooks for common use cases:
  1. `useInputState` / `useInputUpdater` wrap `useState` so the setter can be passed
  straight to a SemUI `Input`'s `onChange` (which follows different signature conventions
  than a vanilla `onChange`). Similar hooks exist for `useCheckboxState` etc.
  2. `useLoadedData` returns response `headers`, which carry total-count information for pagination
  (see `IncidentsLog/index.jsx`). Ideally, you should be using Tanstack Query instead of `useLoadedData`
  in the first place.
- Use `fetchJsonOrError` as-is. It has error handling built into its name; don't wrap it in your own.
- Build URLs with the helpers in `lib/requests/routes.js.erb` (`competitionUrl(...)`), not string
  concatenation.
- `mutationFn` must not close over component state. Pass the values in as parameters — it keeps renders stable.
- `useMutation` has `onError` alongside `onSuccess`. Use it rather than hand-rolling error handling.
- Beware `onSuccess` argument shadowing: `onSuccess={setSuccess}` passes the *server response* as the
  new state. Write `() => setSuccess(true)` if that's what you mean.
- Use `Message` components for user-facing errors — not bare `className`s that don't exist in SemUI.
- Prefer early returns for loading states (`if (isFetching) return <Loader />`) so `data` is
  implicitly defined afterwards. This is better than a ternary for the empty-vs-populated case.
- Use `<Ref>` when you need to attach a ref to a SemUI component that doesn't forward one. Don't add
  a wrapper `<div>` to hold the ref, and don't hand-roll a replacement for a component we already
  have — wrap the existing one.
