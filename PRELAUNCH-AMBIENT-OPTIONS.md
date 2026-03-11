# Ambient Globe Live Test Options

Use `ambient` query params to preview cross-page background options.

## Modes

- `ambient=off`: default, no ambient layer
- `ambient=a`: soft gradient drift (recommended baseline)
- `ambient=b`: blurred world-map pan/zoom
- `ambient=c`: staged crossfade glows (lowest visual complexity)
- `ambient=d`: like `c`, but subtler movement and slower center shifts
- `ambient=e`: zoomed map stripe drift (globe-like rotation feel, focused render band)
- `ambient=f`: like `e`, but more blurred/subtle and slower

The chosen mode persists in `localStorage` (`tsi-ambient-mode`) until changed.

## Quick URLs

- Home: `index.html?ambient=a`
- Careers Hub: `portal-hub.html?ambient=a`
- Press: `portal-press.html?ambient=a`

Swap `a` with `b`, `c`, `d`, `e`, `f`, or `off` for comparisons.

## Performance Notes

- Mobile/reduced-motion users get reduced animation behavior via CSS fallbacks.
- Option `c` is the safest mode when prioritizing minimal runtime animation load.
