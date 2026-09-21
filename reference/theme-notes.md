# Notebook / picture-book theme

The notebook revision adds a quiet ruled background, a warm paper palette and small print-mount details. A subsequent revision places the pug beside each title and connects it to the actual project subtitle. The separate mascot dialogue, background slogan and trail are removed. Horizontal navigation and media interactions remain intact.

## Palette

- Warm ivory paper: `#fbf7ee`
- Dark olive / brown ink: `#383d32`
- Primary body text: `#5d6658`
- Secondary text: `#666b5c`
- Soft terracotta emphasis: `#96533f`
- Muted sage: `#e6ebdc`
- Mist blue: `#e5eef0`
- Photo-mat paper: `#fffdf7`

The horizontal notebook rules use a low-opacity blue-grey at a 32 px interval on desktop and 28 px on mobile. A subtle coral binding line sits at 3.3 vw on desktop and 4 vw on mobile, outside the text columns. Header and footer remain unruled quiet paper.

Main text and meaningful small captions were darkened for comfortable contrast. Photos have an outward paper mat, minimal static offset shadow, and one small tape strip; the mat does not change image sizing. Reel saturation filtering was removed, preserving source media colors.

Computed text contrast against the ivory paper: primary ink 10.44:1, body text 5.60:1, secondary text 5.14:1, terracotta emphasis 5.45:1. Secondary text against the sage facts panel is 4.76:1. These exceed 4.5:1 for normal text.

The paper uses static CSS backgrounds without texture downloads, SVG filters, canvas or render libraries. A single 460 ms pug introduction runs after the target page enters the viewport and its SVG is decoded; there is no infinite animation. Reduced-motion preferences skip this movement.
