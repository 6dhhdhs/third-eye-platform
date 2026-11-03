---
name: Third Eye Pedagogical Studio
colors:
  surface: '#f6faff'
  surface-dim: '#c6ddf0'
  surface-bright: '#f6faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ebf5ff'
  surface-container: '#dff0ff'
  surface-container-high: '#d4ebff'
  surface-container-highest: '#cee6f9'
  on-surface: '#051e2c'
  on-surface-variant: '#42474c'
  inverse-surface: '#1d3341'
  inverse-on-surface: '#e5f2ff'
  outline: '#72787d'
  outline-variant: '#c2c7cd'
  surface-tint: '#426278'
  primary: '#426278'
  on-primary: '#ffffff'
  primary-container: '#8fafc8'
  on-primary-container: '#224358'
  inverse-primary: '#aacbe4'
  secondary: '#4c6172'
  on-secondary: '#ffffff'
  secondary-container: '#cce2f6'
  on-secondary-container: '#506576'
  tertiary: '#2c6954'
  on-tertiary: '#ffffff'
  tertiary-container: '#7ab79e'
  on-tertiary-container: '#004935'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c8e6ff'
  primary-fixed-dim: '#aacbe4'
  on-primary-fixed: '#001e2f'
  on-primary-fixed-variant: '#2a4a60'
  secondary-fixed: '#cfe5f9'
  secondary-fixed-dim: '#b3c9dd'
  on-secondary-fixed: '#061e2c'
  on-secondary-fixed-variant: '#344959'
  tertiary-fixed: '#b1f0d5'
  tertiary-fixed-dim: '#95d3b9'
  on-tertiary-fixed: '#002116'
  on-tertiary-fixed-variant: '#0d513d'
  background: '#f6faff'
  on-background: '#051e2c'
  surface-variant: '#cee6f9'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a focused, calm, and intellectually reassuring environment tailored for pre-service teachers and pedagogical training mentors. Bridging analytical AI diagnostics with human-centric education, the emotional tone is disciplined yet empathetic, clear, and unburdened by cognitive noise.

The visual style merges Modern Academic Minimalism with Tactile Analytical Clarity. It relies on pristine white canvases, soft architectural blueprint fills, crisp atmospheric borders, and purposeful typography. Interfaces avoid loud synthetic gradients or over-saturated gamified badges, choosing instead an institutional, quiet-tech authority reminiscent of high-end clinical and cognitive research software.

## Colors

The palette is engineered for prolonged ergonomic review of micro-teaching video recordings, AI rubrics, and diagnostic reports:

- **Canvas & Surfaces**: The base workspace uses pure white (`#FFFFFF`) to ensure pristine readability. Auxiliary surfaces, sidebar modules, and track rails step down into low-saturation mist tones: Subsurface Tint (`#EDF3F8`) and Canvas Neutral (`#F7FAFC`).
- **Brand Primary & Accents**: Low-saturation slate blue (`#8FAFC8`) serves as the core interactive pivot—highlighting selected timeline segments, analytical chart series, primary actions, and focused states.
- **Structural Lines**: Subtle structural borders use slate hairline (`#DAE5ED`), maintaining structural separation without visual heaviness.
- **Typography & Neutrals**: Primary textual elements, data metrics, and headings use deep slate indigo (`#253B4A`). Secondary meta-information, labels, and muted cues use medium slate grey (`#526778`).
- **Functional Semantics**: Feedback validation and rubric mastery are marked by botanical green (`#3C7862`), while critical diagnostic warnings, lesson anomalies, or destructive controls use deep muted crimson (`#A84646`).

## Typography

Typography relies on `Plus Jakarta Sans` across all hierarchical roles. Its clean geometry combined with subtle humanist curvature balances didactic clarity with digital warmth, supporting dense data displays such as lesson evaluation rubrics and observation timelines.

- **Numerics & Analytics**: Analytical metrics, timestamps, and confidence scores utilize tabular lining figures (`font-variant-numeric: tabular-nums`) to preserve column verticality in evaluation matrices.
- **Hierarchy & Tracking**: Body content remains open with default tracking, whereas micro-labels (`label-sm`, `label-md`) adopt slightly widened tracking (`+0.02em`) to maximize scanning efficiency in video timeline tags and parameter cards.

## Layout & Spacing

The layout structure employs a 12-column adaptive workspace grid for the desktop training hub and analytical split-screen console:

- **Desktop (1280px+)**: 12 columns with `2rem` external canvas margins and `1.25rem` gutters. Micro-teaching sessions feature a 7:5 ratio split: 7 columns for synchronized multimodal playback (video, blackboard analysis, gaze-tracking heatmaps) and 5 columns for AI diagnosis, transcript feedback, and rubrics.
- **Tablet (768px - 1279px)**: 8 columns with `1.5rem` margins and `1rem` gutters. Secondary evaluation panels dock into collapsible bottom drawers or tabbed views beneath the main media player.
- **Mobile (Under 768px)**: Single-column linear flow with `1rem` canvas padding and `0.75rem` component spacing. Timeline tracks compress into prioritized segment summaries.
- **Layout Rhythm**: Component internal padding follows explicit increments: `space-sm` (8px) for control inner spacing, `space-md` (12px) for list items, and `space-lg` (20px) for analytical card enclosures.

## Elevation & Depth

Visual hierarchy favors clean surface separation over aggressive drop shadows:

- **Base Level (Canvas)**: Background surface (`#FFFFFF` or `#F7FAFC`) remains non-elevated, framed by architectural 1px hairline borders (`#DAE5ED`).
- **Elevated Surfaces (Cards & Modules)**: Cards use pure white backgrounds (`#FFFFFF`) with a 1px border (`#DAE5ED`) paired with a diffused ambient shadow: `0 4px 16px -2px rgba(37, 59, 74, 0.04), 0 2px 6px -1px rgba(37, 59, 74, 0.02)`.
- **Floating Controls (Timeline Scrubbers & Dropdowns)**: Interactive contextual overlays, tooltips, and floating controls elevate with `0 8px 24px -4px rgba(37, 59, 74, 0.08), 0 3px 8px -2px rgba(37, 59, 74, 0.04)` over a border of `#DAE5ED`.
- **Glass Tinting**: Video overlay badges and floating action banners utilize a subtle translucent wash (`rgba(255, 255, 255, 0.88)` with `backdrop-filter: blur(8px)`) to keep underlying pedagogical video recordings legible.

## Shapes

The design system applies a disciplined two-tiered curvature model:

- **Structural Cards & Panels**: Fixed at `16px` radius (`rounded-lg` / `rounded-2xl` equivalent in typical frameworks). This softens large modular surfaces, evaluation dashboards, and video containers.
- **Controls & Micro-Elements**: Fixed at `10px` radius for input fields, buttons, dropdown triggers, and interactive rubric toggles, striking a balance between accessible touch targets and structural stability.
- **Chips & Status Tags**: Use `10px` radius or full pill profiles (`9999px`) for micro-indicators such as AI tag highlights or speaker identity badges.

## Components

### Buttons
- **Primary Action**: Solid `#8FAFC8` fill, `#FFFFFF` bold text, `10px` radius, padding `10px 18px`. Hover shifts to `#7A9BB4` with active compression at `scale(0.98)`.
- **Secondary / Ghost**: Background `#EDF3F8`, text `#253B4A`, border `1px solid #DAE5ED`, `10px` radius. Hover state lightens background to `#F7FAFC`.
- **Destructive**: Background `#FFFFFF`, text `#A84646`, border `1px solid #A84646`. Hover transitions to background `rgba(168, 70, 70, 0.06)`.

### Form Controls & Inputs
- **Text Fields**: Background `#FFFFFF`, border `1px solid #DAE5ED`, radius `10px`, padding `10px 14px`, text `#253B4A`. Placeholder set to `#526778` with 60% opacity. Focused state transitions border to `#8FAFC8` with a soft ring glow: `0 0 0 3px rgba(143, 175, 200, 0.25)`.
- **Checkboxes & Radios**: `18px` structural frame, `1px solid #DAE5ED`, `4px` radius for checkboxes, circular for radios. Checked state fills with `#8FAFC8` featuring pure white checkmark icons.

### Pedagogical Cards
- Base background `#FFFFFF`, border `1px solid #DAE5ED`, radius `16px`, internal padding `20px`. Header incorporates an explicit divider in `#EDF3F8` with section actions (e.g., download transcript, export feedback rubric) right-aligned.

### Chips & Evaluation Tags
- **Competency Chips**: Background `#EDF3F8`, text `#526778`, border `1px solid #DAE5ED`, radius `10px`, padding `4px 10px`.
- **Success / Mastery**: Background `rgba(60, 120, 98, 0.1)`, text `#3C7862`, border `1px solid rgba(60, 120, 98, 0.2)`.
- **Alert / Remediation**: Background `rgba(168, 70, 70, 0.08)`, text `#A84646`, border `1px solid rgba(168, 70, 70, 0.2)`.

### Domain-Specific Components
- **Pedagogical Video Timeline Marker**: Micro-bar nodes directly mounted on the playback track. Blue (`#8FAFC8`) marks pedagogical inflection points, green (`#3C7862`) flags high student interaction intervals, and crimson (`#A84646`) notes speech cadence deviations or board visibility interruptions.
- **Rubric Competency Matrix**: Accordion rows displaying 5-point competency bars with subtle grey background tracks (`#EDF3F8`) and proportional progress meters in `#8FAFC8`.