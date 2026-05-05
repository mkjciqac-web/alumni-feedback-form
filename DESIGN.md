# Design Brief

## Tone & Purpose
Academic institution admin system for alumni feedback collection. Feeling: institutional trust (credible, refined) + modern clarity (accessible, guided). Form for alumni; dashboard for staff analyzing insights.

## Palette
| Purpose | OKLCH | Usage |
| --- | --- | --- |
| Primary (Academic Blue) | 0.55 0.21 255 | Headers, CTAs, focus states, progress |
| Secondary (Warm Neutral) | 0.92 0.08 71 | Subtle warm accent for secondary actions |
| Accent (Teal) | 0.65 0.12 184 | Data highlights, success, form emphasis |
| Neutral (Light) | 0.98 0 0 | Background, cards |
| Neutral (Gray) | 0.94 0.02 0 | Muted UI, disabled states |
| Destructive (Red) | 0.57 0.27 25 | Warnings, errors, delete actions |

## Typography
| Role | Font | Usage |
| --- | --- | --- |
| Display | General Sans | Headers (h1–h3), form titles, admin panel headings |
| Body | DM Sans | Form labels, body copy, table content, descriptions |
| Mono | JetBrains Mono | Data tables (email, IDs), admin configs, code-like content |

## Shape Language
- Border radius: 8px (cards, inputs, buttons)
- Shadows: minimal (shadow-sm), elevation via background tint not lift
- Borders: 1px solid neutral, accent for focus states
- Spacing: 8px baseline (tight density for form guidance, admin data clarity)

## Structural Zones
| Zone | Treatment |
| --- | --- |
| Header | `bg-primary text-white`, 1px border-b, centered nav/user menu |
| Form Step | `bg-card rounded-lg border`, centered 600px max-width, progress bar above |
| Progress Indicator | Linear bar, accent-filled to current step, 4px height |
| Admin Sidebar | `bg-sidebar`, full height, `border-r`, active item with `bg-sidebar-primary` |
| Admin Main | `bg-background`, padding grid, data tables with `data-row` hover state |
| Data Table | Rows with `border-b`, hover: `bg-muted/40`, semantic color coding (accent for active, red for flags) |

## Spacing & Rhythm
- Form vertical: 32px between sections, 16px within fieldsets
- Admin grid: 24px column gap, 16px row gap
- Compact data: 12px row padding, 8px cell padding
- Breathing room above CTAs: 24px margin-top

## Motion
- Interactive: `transition-smooth` (0.3s cubic-bezier) on hover/focus
- Progress bar: 0.4s ease for fill animation
- Form step transitions: fade in/out, 0.2s
- No decorative animations; all motion serves UX clarity

## Component Patterns
- Buttons: solid primary, outlined secondary, ghost for low-priority
- Inputs: border on focus (accent ring), placeholder gray, error state red outline
- Cards: shadow-sm, rounded-lg, subtle border, elevated via background tint in dark mode
- Form validation: inline error text (red foreground), visual feedback on input
- Likert scale: button group, accent highlight for selected, hover state gray
- Tables: header row `font-semibold`, data rows semantic color (green success, red flag, blue info)
- Progress indicator: 4-step visual bar, text label below

## Differentiation
Editorial hierarchy via **zone background variation**, not just text weight. Each structural area intentionally distinct: header blue, card white/slightly gray, sidebar off-white. Alumni form feels **guided and reassuring** (generous spacing, single-column clarity). Admin dashboard feels **data-dense** (tight rows, semantic color coding, high-contrast headers). Progress bar as visual affordance during form completion.

## Constraints
- No full-page gradients; depth via composition and layering
- No decorative blurs or glassmorphism; clarity prioritized
- Accent color used sparingly: active states, success indicators, data highlights only
- High contrast required for form labels and table headers (AA+ compliance)
- Responsive: form stacks mobile-first, admin sidebar collapses below 768px

