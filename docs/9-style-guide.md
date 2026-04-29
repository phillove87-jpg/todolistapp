# Style Guide

This style guide is based on the clean, functional design of modern calendar applications (specifically inspired by Google Calendar). It focuses on clarity, accessibility, and a professional aesthetic.

## 1. Color Palette

### Core Colors
| Type | Color | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | Blue | `#1a73e8` | Primary actions, active states, highlights. |
| **Background** | White | `#ffffff` | Main application background, card backgrounds. |
| **Surface** | Light Gray | `#f8f9fa` | Sidebar, hover states, secondary backgrounds. |
| **Border** | Border Gray | `#dadce0` | Grid lines, dividers, input borders. |

### Text Colors
| Type | Color | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Text** | Dark Gray | `#3c4043` | Main headings, body text, high-emphasis text. |
| **Secondary Text**| Medium Gray | `#70757a` | Labels, captions, low-emphasis text. |

### Semantic / Category Colors (Example)
These colors are used for categorizing events or tasks.
- **Red:** `#d93025`
- **Gray:** `#5f6368`
- **Blue:** `#1a73e8`
- **Green:** `#1e8e3e`
- **Purple:** `#7030a0`

---

## 2. Typography

- **Font Family:** Clean sans-serif (e.g., 'Google Sans', 'Roboto', 'Inter', or system-default).
- **Base Font Size:** `14px`
- **Line Heights:**
    - Body: `1.5`
    - Headings: `1.2`

### Text Styles
- **H1 (Header Title):** `22px`, Regular, `#3c4043`
- **H2 (Sidebar Sections):** `14px`, Medium (font-weight: 500), `#3c4043`
- **Body:** `14px`, Regular, `#3c4043`
- **Small/Caption:** `12px`, Regular, `#70757a`

---

## 3. Layout & Spacing

### Grid System
- **Sidebar Width:** `256px`
- **Header Height:** `64px`
- **Grid Lines:** `1px` solid `#dadce0`

### Spacing Scale (8px Base)
- **XS:** `4px`
- **S:** `8px`
- **M:** `16px`
- **L:** `24px`
- **XL:** `32px`

---

## 4. Components

### Buttons
- **Primary "Create" Button:**
    - Background: `#ffffff`
    - Box Shadow: `0 1px 2px 0 rgba(60,64,67,0.302), 0 1px 3px 1px rgba(60,64,67,0.149)`
    - Border-radius: `24px`
    - Padding: `8px 16px`
- **Icon Buttons:**
    - Color: `#5f6368`
    - Hover background: `rgba(95,99,104,0.04)`
    - Border-radius: `50%`

### Cards / Event Blocks
- **Border-radius:** `4px`
- **Padding:** `4px 8px`
- **Font-weight:** `500` for titles
- **Border:** `1px solid rgba(0,0,0,0.1)`

### Inputs / Checkboxes
- **Checkboxes:** Primary blue (`#1a73e8`) when checked.
- **Input Fields:** Minimalist with focus state using primary blue.

---

## 5. Visual Effects

- **Shadows:** Use soft, subtle shadows for elevated elements (like the Create button or dropdowns).
- **Transitions:** `200ms ease-in-out` for hover states and transitions.
- **Borders:** Subtle gray borders (`#dadce0`) to define structure without overwhelming the user.
