**Date:** 2025-08-29

**Author:** Jules

**Subject:** Implementation of "Randomize Character" and "Export Spritesheet" Features

**Summary of Changes:**

This update implements two new features in the LPC Sprite Creator (`public/sprite-creator.html`):

1.  **Randomize Character:** The "Randomize Character" button is now functional.
    *   **File Modified:** `public/sprite-builder.js`
    *   **Functionality:** When clicked, this button clears the current character and applies a new set of randomly selected sprites for categories such as body, hair, torso, legs, arms, and feet. It respects the selected character sex (male/female) and updates the UI dropdowns to reflect the current selection.

2.  **Export Spritesheet:** The "Export Spritesheet" button is now functional.
    *   **File Modified:** `public/sprite-builder.js`
    *   **Functionality:** When clicked, this button generates a complete spritesheet for the currently configured character. The spritesheet contains all standard animations (walk, thrust, slash, etc.) laid out in a single PNG file. This file is then automatically downloaded by the user's browser as `spritesheet.png`.

**Testing Instructions:**

1.  Open `public/sprite-creator.html` in a web browser.
2.  Click the "Randomize Character" button. Observe that the displayed character's appearance changes. The dropdown menus should also update to reflect the new parts.
3.  Click the "Export Spritesheet" button. A file named `spritesheet.png` should be downloaded.
4.  Open `spritesheet.png` to verify that it contains a grid of character animations.
