# Seaside Shakedown artwork

## Backglass — visual release 2.1

Saved production asset: `public/art/backglass.webp` (1200 × 800, 299,576 bytes).

Generated with the built-in ImageGen tool, using the user's photograph of a Fun Fair fruit machine as a style reference. The photograph itself is not shipped. The original generated 1536 × 1024 PNG was converted to WebP at quality 84 for self-hosting. No external image service is used during play.

The illustration is decorative printed backglass. All game labels, payouts, controls, letter lamps and meters are live HTML/CSS/SVG, independent of the bitmap.

Prompt used:

> Use case: illustration-story. Asset type: original printed backglass artwork for an interactive British seaside fruit-machine simulator. The supplied photo is ONLY a style reference for real British amusement machine printed glass, NOT an edit target. Create a flat straight-on 3:2 landscape full-bleed illustrated mural, with no cabinet, no mockup, no UI, no boxes, no text, no numerals. Authentic late-1990s British fruit-machine screenprinted and airbrushed illustration: saturated cobalt blue and electric purple night sky, magenta/pink sweeping ribbons, turquoise stars and confetti, gold ornamental scrolls and bright yellow light bursts. A cheeky white cartoon seagull with an orange beak stealing golden chips from a red-and-white chip carton, dynamic theatrical character, central in the LOWER HALF, above stylised turquoise waves. A seaside pier, illuminated fairground wheel and striped beach huts at the far sides; warm red and gold theatrical swirls framing the edges. The upper central third stays mostly rich blue/purple starburst texture so our real game title can overlay it legibly. Dramatic airbrushed highlights, rich painted black outlines, exaggerated playful comic character illustration and depth, glossy luminous printed-glass look, dense confident artwork like a real fruit-machine back panel, not flat corporate illustration, not minimalist vector, not generic website gradients. Colourful and loud but detailed ink edges. Do not copy the reference machine's exact characters or branding. No text anywhere.

## Other assets

Seven original SVG reel symbols in `public/art/` retain their silhouettes, with local radial gradients for a glossy printed finish. `scripts/finish-symbols.js` records the source transformation and is idempotent. Cabinet materials, reflections, lamps and plastic buttons are CSS. `src/ui/display.js` draws original seven-segment numerals using SVG polygons while preserving the real numeric text. Typography uses system fonts; sound is synthesized locally.
