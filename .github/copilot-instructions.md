# Project Guidelines

## Project Structure
- Keep the app in its existing vanilla HTML, CSS, and JavaScript files unless a change clearly requires a new file or dependency.
- Keep presentation in `styles.css`, structure in `index.html`, and behavior in `script.js`.
- This project has no documented build or test commands; do not introduce a build step for routine changes.

## UI and Accessibility
- Give all buttons a light lavender background (`#E9E2F4`) by default. Keep button text readable against it, and preserve clear hover, active, disabled, and keyboard-focus states.
- Preserve semantic HTML, accessible names, keyboard operation, and visible focus indicators when changing the interface.
- Keep the dashboard usable on narrow screens as well as desktop; avoid horizontal overflow.

## Conventions
- Reuse the CSS custom properties and existing component styles in `styles.css` rather than adding one-off values when practical.
- Keep changes focused and avoid adding frameworks or dependencies unless the requested behavior needs them.