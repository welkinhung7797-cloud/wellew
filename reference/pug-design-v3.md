# WelleW pug — simplified picture-book revision

The latest user reference establishes the broad rounded head, two round eyes, a very short pug nose, paired muzzle lobes, floppy ears and short legs. The earlier continuous bean perimeter and asymmetric eye patch were rejected and are no longer used.

These are newly drawn vector shapes. The head has a visible chin outline and overlaps the torso; the torso is a complete solid shape underneath, so there is no transparent neck gap. Seated, walking, running, bowing and lying poses have separate torso/leg silhouettes. Raised paws replace their corresponding planted front leg instead of adding a third front limb.

The drawing now uses exactly the same three flat colors as `assets/logo.svg`: fur `#e9b750`; ears, nose, eyes and contours `#34312d`; muzzle, chest, tongue and eye rings `#fffaf0`. Brown and pink are removed. There is no texture, glow, gradient, fur detail or realistic eye highlight. An automated inventory of all 12 SVGs confirms there are no other color values.

The latest revision also redraws the legs and paws to be thinner and shorter. Seated front paws are narrow rounded stubs; walking, running and hopping leg paths have reduced lengths and widths; the lying and side-sitting paws are smaller. Raised arms on 04 and 12 are shorter and narrower, and 10 has a small paw touching the cheek. On these three poses the corresponding planted front leg remains omitted, so a raised paw never creates an extra front limb. Hidden-side limbs are occluded naturally in profile poses.

All files retain the same transparent 320×280 viewBox. The canonical anatomy and shared face are in `scripts/draw-pugs.mjs`; it exports `assets/pug/pose-01.svg` through `pose-12.svg` for the existing page mapping.

1. Walking right
2. Sitting attentively
3. Running right
4. Waving hello
5. Looking up
6. Small hop
7. Play bow
8. Listening with head tilted
9. Lying down asleep
10. Thinking with paw at cheek
11. Side sitting
12. Waving goodbye

The 12 drawings were rendered together for visual review in `reference/pug-poses-preview.png`, and the canonical sitting SVG and PNG were refreshed. The latest check verifies the exact logo palette, smaller paws, no duplicated front legs on 04/10/12, intact head/body overlap and clear pose differences. The reference stock image is used only for proportions and simple visual vocabulary; no stock pixels or watermark are included.
