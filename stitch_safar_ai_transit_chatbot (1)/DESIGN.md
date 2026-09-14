---
name: Safar Transit AI
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#484757'
  on-tertiary: '#ffffff'
  tertiary-container: '#605e6f'
  on-tertiary-container: '#dcd9ed'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#e4e0f5'
  tertiary-fixed-dim: '#c7c4d8'
  on-tertiary-fixed: '#1b1a29'
  on-tertiary-fixed-variant: '#464555'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes a fluid, serene, and intelligent environment for AI-assisted urban transit and multimodal journey planning. The aesthetic merges soft pastel glassmorphism with high-utility wayfinding cues.

### Personality & Tone
- **Atmospheric & Calming:** Soft violet and sky-blue gradients minimize commuter stress, offering clarity during delay alerts or route transitions.
- **Precision-Driven:** Frosted glassy surfaces house crisp, authoritative data tiers (timetables, platform numbers, live vehicle locations).
- **Proactive & Friendly:** Conversational bubbles, dynamic itinerary previews, and pill-shaped elements invite low-effort interaction.

### Aesthetic Execution
- **Frosted Glass (Glassmorphism):** High-diffusion translucent panels (`backdrop-filter: blur(16px)`) floating over ambient periwinkle and soft lavender gradients.
- **Refined Contrast:** Deep indigo accents and vibrant royal blue active states cut through delicate pastel layers to maintain high legibility and clear action hierarchies.
- **Soft Pill Topography:** Organic curves, fully rounded triggers, and expansive card radii convey ease and forward motion.

## Colors

The palette balances ethereal pastel washes with targeted functional highlights to support real-time transit interaction.

### Surface & Ambient Layers
- **Atmospheric Base:** Layered gradient shifting from `#F8FAFC` through `#EDE9FE` (soft violet) to `#E0E7FF` (soft periwinkle blue).
- **Glass Panel Surface:** Semi-transparent crisp white `rgba(255, 255, 255, 0.70)` with an upper rim highlight of `rgba(255, 255, 255, 0.85)`.
- **Raised Glass Overlay:** `rgba(255, 255, 255, 0.88)` for dropdowns, tooltips, and floating itinerary cards.

### Accents & State Logic
- **Primary Indigo (`#4F46E5`):** Bot conversational accents, transit line identification, primary navigation anchors, and deep interactive states (`#4338CA` on hover).
- **Secondary Royal Blue (`#2563EB`):** Dedicated to user chat bubbles, active route paths, live GPS tracking indicators, and focused inputs.
- **Tertiary Soft Violet (`#EDE9FE`):** Resting pill chips, inbound bot bubble backgrounds, system tags, and gentle hover highlights.
- **Neutral Foreground Slate (`#0F172A`):** Deep charcoal slate for headers and data labels, paired with `#475569` for secondary timestamps, platform metadata, and placeholder text.

## Typography

The typographic hierarchy combines the welcoming, geometric form of **Plus Jakarta Sans** for headlines and interactive wayfinding labels with the legibility of **Inter** for dense transit feeds and conversational chat streams.

### Scaling & Readability Rules
- **Display and Title Treatments:** Plus Jakarta Sans provides friendly geometry to navigation headers, arrival banners, and AI greeting moments. Tight letter spacing (`-0.01em` to `-0.02em`) preserves tightness on large viewport titles.
- **Conversational Parsing:** Inter provides uniform character rendering for body text, chat dialogue, and transit instructions across variable line lengths.
- **Wayfinding & Metadata:** `label-sm` is reserved for platform indicators, live schedule delays, and transfer badges. Rendered in full uppercase with `0.04em` tracking to prevent optical clutter on frosted backgrounds.

## Layout & Spacing

The layout is built around a split-view dynamic canvas: an interactive transit map and live status visualizer alongside a dedicated, persistent conversational stream.

### Grid & Structure
- **Desktop (1024px+):** A 12-column fluid grid. The AI interaction rail occupies 5 columns (min-width 420px, max-width 520px), leaving 7 columns for route previews, live vehicle telematics, and spatial mapping. Outer canvas margin sits at `2rem` with a `1.5rem` internal gutter.
- **Tablet (768px - 1023px):** Collapsible split view or vertical split (chat pinned to a floating bottom drawer spanning 45vh).
- **Mobile (<768px):** Single-column stacked stream. Conversational input anchored firmly to the viewport base with safe-area padding; transit card overlays dynamically float over the top edge of the map.

### Rhythm & Alignment
Component padding relies on `space-md` (1rem) for message bubbles and compact card interiors, scaling up to `space-lg` (1.5rem) and `space-xl` (2.5rem) for parent glass stage containers.

## Elevation & Depth

Visual hierarchy uses frosted glass refraction combined with ambient, tinted drop shadows to create soft, floating planes rather than rigid, opaque slabs.

### Surface Tiers & Backdrop Blurs
- **Level 0 (Canvas Base):** Ambient gradient backdrop blending `#F8FAFC`, `#EDE9FE`, and `#E0E7FF` without blur filters.
- **Level 1 (Dock & Glass Containers):** `background: rgba(255, 255, 255, 0.70)`, `backdrop-filter: blur(16px)`, surrounded by a subtle border stroke of `1px solid rgba(255, 255, 255, 0.60)`.
- **Level 2 (Chat Bubbles & Micro-Cards):** Bot response containers sit on `rgba(255, 255, 255, 0.85)` with a subtle inner shadow `inset 0 1px 1px rgba(255, 255, 255, 0.90)` to yield a smooth glass rim.
- **Level 3 (Modals, Overlays, Floats):** Floating route sheets and elevated inputs use `background: rgba(255, 255, 255, 0.92)`, `backdrop-filter: blur(24px)`.

### Ambient Tinted Shadows
- **Resting Surface:** `0 10px 30px -5px rgba(79, 70, 229, 0.06), 0 4px 6px -2px rgba(15, 23, 42, 0.03)`. The purple-indigo tint anchors translucent panels organically into the ambient wash.
- **Elevated Interactive Float:** `0 20px 40px -10px rgba(37, 99, 235, 0.12), 0 8px 12px -4px rgba(79, 70, 229, 0.05)`.

## Shapes

The design system adopts a pill-shaped curvature profile (`roundedness: 3`). Soft, continuous contours evoke aerodynamic transit vehicles and smooth journeys.

### Application Specs
- **Pills (`9999px`):** All interactive triggers, CTA buttons, filter chips, prompt suggestion tags, and floating chat prompt bars.
- **Base Cards & Container Panes (`rounded-xl` / `3rem` to `2rem`):** Outer chat windows, transit overview boards, and modal sheets use generous `2rem` to `3rem` radii to create distinct, cushion-like glass containers.
- **Conversational Bubbles:** User chat bubbles are pill-styled with an asymmetrical `1.25rem` radius on the originating bottom corner.

## Components

### Buttons
- **Primary CTA:** Pill-shaped (`rounded-full`), solid `#4F46E5` background, text in pure white. Hover transitions smoothly to `#4338CA` with an ambient glow (`box-shadow: 0 8px 20px -4px rgba(79, 70, 229, 0.35)`).
- **Secondary Glass Trigger:** Translucent pill (`rgba(255, 255, 255, 0.75)`), `1px solid rgba(255, 255, 255, 0.80)`, text in deep indigo (`#4F46E5`). Active states darken slightly to `rgba(237, 233, 254, 0.70)`.

### Chat Bubbles & Prompts
- **User Bubble:** Solid vibrant royal blue (`#2563EB`) with crisp white body copy. Border radius `1.25rem` with the bottom-right tail tightened to `0.375rem`.
- **Bot Bubble:** Semi-transparent frosted white (`rgba(255, 255, 255, 0.75)`) with subtle indigo border `1px solid rgba(237, 233, 254, 0.80)`. Slate text (`#0F172A`) with deep indigo route emphasis.
- **Suggested Action Chips:** Resting in `#EDE9FE` with `#4F46E5` text, shifting to full royal blue background with white text on hover.

### Inputs & Floating Action Rail
- **Prompt Bar:** Centered floating glass pod (`rgba(255, 255, 255, 0.85)`), full pill radius, inner soft blur, flanked by micro-actions (voice input, mode toggle) and a circular royal blue send button. Focus ring displays an ethereal `0 0 0 3px rgba(79, 70, 229, 0.20)`.

### Transit Cards & Timetables
- **Live Journey Card:** XL rounded container with micro-segmented progress lines indicating stops. Platform badges utilize high-contrast pill tags (e.g., solid `#4F46E5` with white bold lettering). Delay warnings apply soft amber translucency (`rgba(245, 158, 11, 0.12)`) with deep amber text.

### Iconography
- Smooth line icons (2px stroke weight, rounded caps and joins). Line glyphs for metro, bus, rail, walking, and transfers use dual-tone fills with matching periwinkle-indigo accents.