# Design System Update Template

## 1. Brand & Theme Strategy

- **Design Name/Codename**: “Rangam Enterprise Light v0.1”
- **Core Philosophy**: Enterprise-clean, high readability, minimal glow, brand-forward (orange/navy), calm confidence

## 2. Color Palette

### 2.1 Brand Colors (Light Mode)

**Primary Brand Color** (Orange): #C75000

Use for: highlights, icons, small accents, focus states, active nav item, “helper” buttons

Avoid using as the default CTA fill everywhere (keeps brand classy)

**Primary Action Color** (Navy): #0E2A4B

Use for: main CTA buttons (“Personalize Experience”), top-level emphasis

**Secondary Brand Color** (Blue): #376497

Use for: links, secondary interactive emphasis (optional)

Orange in UI is commonly represented as #FFA500 in generic palettes, but Rangam’s orange should remain distinct and deeper than “pure orange” to feel premium.

### 2.2 Neutrals (Light Mode)

**Background** #FFFFFF (Pure White)
Surface / Card: #FFFFFF
Surface Alt: #FBFAF8 (for subtle panel separation)
Border / Divider: #E6E2DC
Border Strong: #D6D1C9

Text Primary: #0B1220
Text Secondary: #354152
Text Muted: #6B7280

### 2.3 Semantic Colors

**Success** #138A36
**Warning** #B45309
**Error** #B42318
**Info** #2563EB

### 2.4 Interaction Colors

**Focus Ring (Brand)**: rgba(199, 80, 0, 0.35)
**Hover Fill (Neutral)**: rgba(14, 42, 75, 0.06)
**Active Fill (Neutral)**: rgba(14, 42, 75, 0.10)

**Disabled Text**: rgba(11, 18, 32, 0.35)
**Disabled Surface**: rgba(11, 18, 32, 0.05)

## 3. Typography

### 3.1 Font Families

**Headings**: Outfit (or closest available)
**Body/UI**: Inter (or closest available)

### 3.2 Type Scale

**H1 (Page Title)**: 32px / 600
**H2 (Section Title)**: 20px / 600
**Body**: 16px / 400
**Small**: 14px / 400
**Caption/Helper**: 12–13px / 400
**Label**: 14px / 500

### 3.3 Line Height

**Body**: 1.5
**Headings**: 1.2–1.3
**Inputs**: 1.4

## 4. Layout & Spacing

### 4.1 Grid / Spacing Scale

**8px scale recommended:**

8 / 16 / 24 / 32 / 40 / 48

### 4.2 Containers

**Max Width (Forms)**: ~1100px
**Card Padding**: 24–32px
**Section Gap**: 24–32px
**Field Gap**: 14–18px

## 5. Shape, Borders, and Elevation

### 5.1 Border Radius

**Card Radius**: 16px
**Input Radius**: 12px
**Button Radius**: 999px (pill)
**Modal Radius**: 18px

### 5.2 Borders

**Default**: 1px solid #E6E2DC
**Focus**: 1px solid rgba(199, 80, 0, 0.65) (optional)

### 5.3 Shadows

**Light mode should be soft and minimal, not heavy “floating cards.”**

**Card Shadow (default):**

0 2px 8px rgba(11, 18, 32, 0.06)

**Modal Shadow:**

0 12px 40px rgba(11, 18, 32, 0.16)

## 6. Component Tokens (Light Mode)

### 6.1 Buttons

**Primary Button (Navy Fill):**

Background: #0E2A4B

Text: #FFFFFF

Hover: #0B223D

Focus ring: rgba(199,80,0,0.35)

Radius: 999px

Height: 44–48px

**Secondary Button (Outline):**

Background: transparent

Border: #D6D1C9

Text: #0B1220

Hover fill: rgba(14, 42, 75, 0.06)

**Ghost/Text Button (Orange helper action):**

Text: #C75000

Hover: underline or subtle warm background tint

Use for: “Choose from standard roles”

**Destructive Button:**

Background: #B42318

Text: white

Hover: darker red

### 6.2 Inputs / Textareas

Input Surface: #FFFFFF
Border: #D6D1C9
Placeholder: #9CA3AF
Focus Ring: rgba(199, 80, 0, 0.35)
Error Border: #B42318
Helper Text: #6B7280

### 6.3 Cards

Card Background: #FFFFFF
Card Border: #E6E2DC
Card Shadow: subtle (rgba(11,18,32,0.06))

### 6.4 Navigation (if applying to app shell)

**Selected Nav Item:**

Background: rgba(199, 80, 0, 0.10)

Text/Icon: #C75000

Default Nav Text: #354152
Hover Nav Background: rgba(14, 42, 75, 0.06)

### 6.5 Modal (Standard Role Picker)

Overlay: rgba(11, 18, 32, 0.55)
Modal Background: #FFFFFF
Border: #E6E2DC
Radius: 18px
Shadow: rgba(11,18,32,0.16)

## 7. Interaction & Motion Guidelines

### 7.1 Hover/Focus/Active

Hover should be subtle (no glow-heavy neon)

Focus ring always visible (accessibility)

Active states should compress slightly or darken lightly

### 7.2 Motion

Duration: 150–250ms

Easing: standard ease-out

Avoid bouncing animations (keep enterprise calm)

## 8. Implementation Notes (Tailwind / shadcn)

Approach: theme via tokens (CSS variables) and map to shadcn semantic keys:

background

foreground

primary

primary-foreground

muted

muted-foreground

border

ring

Key design decision:
Primary CTA should be navy, with orange used for emphasis + focus states + helper actions, matching Rangam’s employer page brand hierarchy.
