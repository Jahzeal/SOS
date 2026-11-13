# NoxGuarda UI guide

One visual style for the signed-in app. Read this before building or changing a screen.

Scope: everything under `/dashboard`, plus sign-in. Marketing pages, the admin area and printed
documents (receipts, invoices, the templates preview) follow their own rules and are not covered.

## 1. Tokens

Defined in `tailwind.config.js` (colours, radius, fonts) and `src/app/globals.css` (page background, focus ring).

| What | Use | Notes |
| --- | --- | --- |
| Accent | `accent-*` | Teal. Primary buttons, links, active menu item, selected state, focus ring. The only accent. |
| Neutral | `slate-*` | Text, borders, surfaces. |
| Success | `success-*` | Emerald. "In stock", "paid", "saved". |
| Warning | `warning-*` | Amber. "Expiring", "needs attention". |
| Danger | `danger-*` | Rose. Errors, "stolen", destructive actions. |

Do not use `blue-*`, `indigo-*`, `teal-*`, `emerald-*`, `amber-*` or `rose-*` directly on app screens. Use the token name. No hex colours.

**Text sizes** (Tailwind's own classes, nothing smaller than 12px):

| Class | Size | Use |
| --- | --- | --- |
| `text-xs` | 12px | Labels, table text, hints, badges |
| `text-sm` | 14px | Body text, inputs, buttons |
| `text-base` | 16px | Card and modal titles |
| `text-lg` / `text-xl` | 18 / 20px | Section headings, key numbers |
| `text-2xl sm:text-3xl` | 24 / 30px | Page title (one per page, an `<h1>`) |

**Corners**

| Class | Size | Use |
| --- | --- | --- |
| `rounded-control` | 10px | Buttons, inputs, selects, small panels, alerts |
| `rounded-card` | 16px | Cards, table containers, dropdown menus (same as `rounded-2xl`) |
| `rounded-modal` | 20px | Dialogs |
| `rounded-full` | | Avatars, pills, dots |

**Fonts**: `font-sans` (Plus Jakarta Sans) for everything; `font-mono` for IMEI, serial numbers and codes.
`font-space` is the logo wordmark only. `font-editorial` is the marketing headline only.

**Shadows**: `shadow-subtle` on controls and cards, `shadow-2xl` on menus and dialogs.

## 2. Dark mode

Dark mode applies on `/dashboard` routes only.

Write light-mode classes and stop there. `src/app/dark-fallback.css` gives every neutral and tinted
class a dark equivalent (`bg-white` becomes slate-900, `text-slate-900` becomes near-white,
`bg-accent-50` becomes a dark teal tint, and so on). Add a `dark:` class only where that default
looks wrong; an explicit `dark:` class always wins.

- The file is generated. Change `scripts/gen-dark-fallback.mjs`, then run `node scripts/gen-dark-fallback.mjs`.
- Anything inside an element with the class `print-doc` is left alone. Receipts and invoices carry
  it so paper stays white. Add it to any new printed document.
- `bg-white` on a `rounded-full` element (switch knobs, avatars) is not changed.

## 3. Which component for what

All in `src/components/ui`.

| Need | Use |
| --- | --- |
| Any button | `Button` from `Button.tsx` |
| Text, email, number, password field | `TextInput` (alias `Input`) from `Input.tsx` |
| Dropdown | `Select` (alias of `SelectInput`), options as `<option>` children or the `options` prop |
| Multi-line text | `Textarea` |
| Search box | `SearchInput` (pass `shortcutHint=""` unless Ctrl+K really works there) |
| Tick box / radio with a label | `Checkbox`, `Radio` |
| A label around a custom control | `Field` (alias of `FieldWrapper`) |
| Card | `Card`, or a `div` with `bg-white border border-slate-200 rounded-card shadow-subtle` |
| Status chip | `Badge` |
| Table | `TableWrap`, `Table`, `THead`, `TBody`, `Tr`, `Th`, `Td` from `DataTable.tsx`. `DataTable` is the ready-made one with search and paging. |
| Nothing to show | `EmptyState` |
| Dialog | `Modal` from `Modal.tsx` |
| Yes/no question | `confirmDialog()` from `src/lib/feedback.ts` |
| "Saved" / "Failed" message | `notify()` from `src/lib/feedback.ts` |
| Inline notice on the page | `Alert` |
| Loading placeholder | `Skeleton` |

**Button variants**

| Variant | Use |
| --- | --- |
| `primary` | The main action. One per view where possible. |
| `secondary` | Other actions: Export, Cancel, View. |
| `ghost` | Quiet actions and icon buttons in rows and headers. |
| `link` | Text-only action inside a sentence or card footer. |
| `destructive` | Confirming something harmful (in a dialog). |
| `dangerOutline` | A risky action offered on the page: Flag Stolen. |
| `ghostDanger` | Quiet until hovered, then red: Sign Out, remove row. |

Sizes: `sm`, `md` (default), `lg`, `icon` (square, one icon, always pass `aria-label`).
Put icons in `leftIcon` / `rightIcon`, and use `isLoading` for the spinner.
Do not restyle a Button's colours with `className`; pick a variant. `className` is for layout only (`w-full`, `mt-2`, `sm:w-auto`).

**Fields**: pass `label` and the component links the label to the input for you (`htmlFor`/`id`).
Use `helperText` for hints and `errorMessage` for errors; both are announced to screen readers.
A field with no visible label needs `aria-label`.

**Things that stay as plain `<button>`**: menu rows (sidebar, dropdown items), segmented toggles and
filter pills, selectable tiles (payment method), the floating help button. Give them `type="button"`,
`rounded-control`, accent colours for the selected state, and `aria-pressed` or `aria-expanded`.

## 4. Recipe: converting a page

Takes one short session per page. Do one page at a time.

1. **Rename colours.** In the page file, replace `blue-N`, `indigo-N`, `teal-N` with `accent-N`;
   `emerald-N`/`green-N` with `success-N`; `rose-N`/`red-N` with `danger-N`; `amber-N` with `warning-N`.
   Replace `rounded-3xl` with `rounded-2xl`. Then look at charts and legends: two series must not end up the same colour.
2. **Buttons.** Replace each raw `<button>` with `Button`. Choose the variant from the table above.
   Delete colour classes passed through `className`. Icon-only buttons get `size="icon"` and an `aria-label`.
   Keep `type="submit"` where it was, and keep the `onClick` exactly as it is.
3. **Fields.** Replace each `<label>` + `<input>` / `<select>` / `<textarea>` pair with `TextInput` / `Select` / `Textarea`,
   moving the label text into `label`, the hint into `helperText`, and a left icon into `leftIcon`.
   Keep `value`, `onChange`, `required`, `disabled`, `placeholder`, `type` unchanged. Search boxes become `SearchInput`.
4. **Tables.** Swap `<table>/<thead>/<tbody>/<tr>/<th>/<td>` for the table building blocks. Use `align="right"` instead of `text-right`.
5. **Dialogs.** Replace a hand-built `fixed inset-0` overlay with `Modal` (`isOpen`, `onClose`, `title`, `description`, `footer`).
   Pass `dismissible={false}` while a save is running.
6. **Empty states.** Replace "icon + two lines of grey text" with `EmptyState`, keeping the wording.
7. **Remove `dark:` classes you no longer need**, or leave them; both work.
8. **Do not change** wording, what any control does, or anything inside a `print-doc`.
9. **Check.** `npx tsc --noEmit`, then open the page at phone and desktop width in light and dark.
   The local `.env` talks to the live API: look, do not submit forms.

To find what is left on a page:

```bash
grep -cE "<button|<input|<select|<textarea|<table" "src/app/(dashboard)/dashboard/<page>/page.tsx"
```

## 5. Status

**Converted**

- `app/login/page.tsx`
- `app/(dashboard)/layout.tsx` and `components/Sidebar.tsx` (sidebar collapses on desktop)
- `dashboard/page.tsx`
- `dashboard/inventory/page.tsx`
- `dashboard/records/page.tsx`
- `dashboard/sales/new/page.tsx`
- `dashboard/customers/page.tsx`
- `dashboard/settings/page.tsx`

**Not yet converted** (they work and follow dark mode through the fallback, but still mix colours and hand-built controls)

- `dashboard/analytics`
- `dashboard/checkout`
- `dashboard/invoices`, `dashboard/invoices/new`
- `dashboard/laptops`
- `dashboard/quotes`, `dashboard/quotes/new`, `dashboard/quotes/[id]`
- `dashboard/receipts`
- `dashboard/records/[id]`
- `dashboard/register`
- `dashboard/repairs`
- `dashboard/reports`
- `dashboard/sales/invoices`, `sales/invoices/new`, `sales/invoices/[id]/edit`, `sales/invoices/[id]/pay`
- `dashboard/sales/receipts`
- `dashboard/subscription`
- `dashboard/verify`, `dashboard/verification/register`, `dashboard/verification/verify`
- `onboarding`, `forgot-password`, `reset-password`
- Shared pieces used inside the dashboard: `components/search/GlobalSearchModal.tsx`,
  `components/subscription/*`, `components/sales/EmailReceiptModal.tsx`,
  `components/billing/PaystackCheckoutModal.tsx`, `components/PwaInstallButton.tsx`,
  `components/theme/ThemeToggle.tsx`

**Deliberately left alone**: marketing pages (`app/page.tsx`, `pricing`, `features`, `laptops`,
`report-stolen`, `privacy`, `terms`), the admin area, `components/receipt`, `components/invoice`,
`dashboard/templates`.
