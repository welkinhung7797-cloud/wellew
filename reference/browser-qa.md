# Browser verification

Date: 2026-09-21. Local build, http://127.0.0.1:4173/ . These checks use the actual in-app Chromium browser via CUA.

## Behaviour checked

- Home CTA navigates horizontally to `#planning`, focuses its heading and updates the page counter to 02 / 12.
- A mouse wheel down gesture on the reader advances from home to planning without vertical document travel.
- ArrowRight changes the active work; Home and End reach the first and last pages. The previous/next buttons disable at the respective bounds.
- Browser Back restored the previous work hash and page.
- The project index shows all ten original categories; choosing Discord or GAKEY closes the dialog and focuses that heading.
- Discord function 07 selects Webhook 自動化 and updates both its heading and description.
- Before opening a work, `document.querySelectorAll('video').length` is 0.
- Opening the 親親子 thumbnail creates one video, which reaches readyState 4 with its correct local source. Browser background playback policy may keep it paused; native controls remain available.
- Closing the work dialog removes its player; the count returns to 0 and dialog.open is false. Source cleanup also pauses, removes src, and calls load before removal.
- Loaded image elements had no broken-image entries in the inspected planning page.
- Local font request returns 200 with font/woff2 and 97,604 bytes.
- Video byte-range request returns 206 with the correct Content-Range and 100-byte length.
- All 12 page navigation buttons were exercised after the final vector mascot integration: each selected the matching `pose-01.svg` through `pose-12.svg`, and every page retained zero video players until user interaction.
- After navigation settled at contact, gallery scrollLeft matched the contact page offset (14,080 px at a 1,280 px viewport); `.page:not([inert])` matched exactly one page, `contact`.
- The final home and contact artwork were visually inspected: flat colors, simple thick outlines, continuous head/body silhouette, no clipped sprite fragments or disconnected neck. No broken images were found after visiting all pages.
- Final homepage document scrollHeight and viewport height both measured 720 px.

## Responsive checks

DOM geometry was inspected for all 12 pages. Desktop 1280 × 720 was also visually inspected. Portrait 390 × 844 and 375 × 667 keep the content within each page. At 375 × 667, the longest GAKEY page ended at y=517 with the page ending at y=603.

844 × 390 landscape initially clipped content. A dedicated compact landscape layout was added and checked again: all 12 content bounds were within the page, with page end y=342 and the greatest measured content end y=283. Header, footer, descriptions and media use the compact layout; the page continues to move horizontally.

A 1px document overflow caused by the offscreen status element was corrected by explicitly positioning that element at the top left.

Viewport overrides were reset after responsive verification.

## Scope

These observations validate layout and interaction in the tested browser. They are not an FPS benchmark or a claim about every device. The original-site media byte inventory is separate from actual initial bytes transferred; see performance-audit.md.


## Title companion revision

- Removed separate mascot dialogue and background trail; each heading now has its own decorative pug and the original project description is the subtitle.
- All 12 poses use the exact three logo colors with shorter, thinner limbs.
- Checked all 12 page overflow measurements at 1280×720, 375×667 and 844×390: no vertical page overflow. Visually checked Discord, GAKEY and home layouts.
- Confirmed the GAKEY hash survives refresh, current and adjacent pug SVGs load, no guide-note remains, and the initial DOM has zero videos.
- Deferred the finite 460 ms entrance until the target page reaches 95% visibility and the SVG decodes.
- Source and dist validation and structural performance checks pass; HTML plus local JS/CSS: 65,113 bytes.
