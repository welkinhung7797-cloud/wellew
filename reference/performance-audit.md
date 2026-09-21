# Original-site performance baseline

Observed 2026-09-21 against https://wellewkin.pages.dev/ and the saved `original.html`.

## Measured facts

| Signal | Original site |
|---|---:|
| HTML, including inline CSS/JavaScript | 64,153 bytes |
| Video elements with an initial `src` | 20 |
| `preload="metadata"` declarations | 20 |
| Video `autoplay` attributes | 2 |
| Unique referenced video files | 14 |
| Unique video file bytes | 9,297,196 bytes / 9.30 MB |
| Unique referenced media files (videos, images, posters) | 24 |
| Unique media file bytes | 10,144,113 bytes / 10.14 MB |
| Image elements / images declared lazy | 9 / 0 |
| Infinite CSS animation declarations | 4 |
| JavaScript `requestAnimationFrame` call sites | 1, scheduled by scroll/resize events |

The byte totals are complete file sizes from HTTP response headers, **not** bytes necessarily transferred during first paint. Repeated references may share cache entries. Twenty preload declarations do not establish twenty distinct network requests. HEAD responses omitted lengths; the audit requested GET response headers and cancelled response bodies. All 24 media URLs returned HTTP 200 with usable lengths.

### Browser observation

On a fresh background browser tab, before any scroll or click, document scrollTop was 0 and viewport height was 720 CSS pixels. All 20 video elements reported `readyState === 4` (enough buffered data for current playback).

Two videos were actively playing:

- Hero `showreel.webm`, rectangle top 176 / bottom 419.
- First journey `plan_kissko_short.webm`, rectangle top 899 / bottom 1048: entirely below the viewport.

The latter is directly explained by the source: initial `renderJourney()` invokes `activateScene(0)`, which calls `play()` for the first scene even when the journey is outside the viewport. The general media visibility observer explicitly skips scene-card videos. See original lines 622–638, 672, and 706–710.

No frame-rate, input-latency, CPU, memory, or hardware-specific lag measurement was available. The browser inspection scope did not expose the Resource Timing API. Therefore this audit establishes unnecessary eager media readiness and offscreen playback, **not** a proven sole cause of the user's perceived lag.

## Other source facts relevant to the rebuild

- The journey requires 1125 viewport heights on desktop and 1230 on mobile, mapping vertical scrolling onto ten visual scenes (original lines 123, 290).
- Each scheduled journey render reads the journey rectangle, writes a CSS variable, then rewrites `transform`, `opacity`, and `zIndex` for all ten scenes (lines 640–661). The handler remains registered outside the journey region. Its rAF scheduling is event-driven, not a perpetual JavaScript loop.
- Four infinite CSS animations run on dog body, tail, head, and ear. Their transforms can be compositor-friendly; the existence of these declarations alone does not prove poor performance.
- The header has backdrop blur, the hero video has a color filter, and the dog has a drop shadow. These are possible GPU costs, not measured bottlenecks.

## Rebuild criteria

1. Use a real horizontal CSS scrolling container. Avoid a tall vertical spacer and per-scroll transforms for every project.
2. Initial page load attaches no video URL to a video or source element and sets no autoplay. Posters are lightweight local images. Assign the chosen video URL only after a user opens it; pause and detach it on close.
3. Keep only the chosen video player active. An idle gallery must never play offscreen video.
4. Animate the guide only on deliberate state changes with finite transitions; no continuous JavaScript loop or infinite CSS animation. Respect reduced motion.
5. Use lazy, asynchronous image decoding for offscreen project thumbnails; preserve explicit dimensions/aspect ratios.
6. Keep the HTML plus local CSS and JavaScript below 150 KiB as a coarse structural budget. This does not replace visual/browser verification.
7. Browser QA should cover initial load (no loaded video), horizontal touch/trackpad/keyboard navigation, opening one video, and closing it (paused, URL removed). Check narrow viewports and reduced-motion behavior.

## Repeatable commands

Run from `wellew-horizontal`:

```text
node scripts/check-performance.mjs --baseline reference/original.html --remote https://wellewkin.pages.dev/
node scripts/check-performance.mjs --baseline reference/original.html --enforce
node scripts/check-performance.mjs
```

The first command reports the inventory in about two seconds. The second is a structural red case against the original: exit 1, with failures for initial video src, autoplay, eager preload, native horizontal scroll, and infinite CSS animation. The final command applies the same relevant policy checks to the rebuild. The automated check intentionally does not claim to measure FPS or to statically prove every possible dynamic video or animation behavior; browser QA remains required.

## Unique original video sizes

| File | Bytes |
|---|---:|
| showreel.webm | 850,508 |
| plan_kissko_short.webm | 727,041 |
| yt_yahoo_react.webm | 109,806 |
| yt_ugym.webm | 144,936 |
| vt_kissko_talk.webm | 163,246 |
| geo3d_japan.webm | 1,247,155 |
| geo3d_terrain.webm | 752,876 |
| geo3d_transit.webm | 296,899 |
| after_train.webm | 665,012 |
| tool_gakey_replay.webm | 2,513,621 |
| yt_script_film_clip.webm | 352,695 |
| yt_short_top1.webm | 630,270 |
| yt_short_top2.webm | 362,741 |
| yt_short_huzi.webm | 480,390 |
