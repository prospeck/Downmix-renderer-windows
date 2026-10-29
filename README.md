# Downmix Renderer website

A static, dependency-free landing page. No build step.

Live at https://prospeck.github.io/Downmix-renderer-windows/ (GitHub Pages, served from the `gh-pages` branch of the public `prospeck/Downmix-renderer-windows` repo). After committing site changes, publish them with `scripts/publish_website.sh` while signed in to gh as `prospeck`.

```sh
python3 -m http.server 8765 --directory website
# open http://127.0.0.1:8765/
```

## Structure

- `index.html`: page markup and copy.
- `styles.css`: design tokens, layout, and CSS motion.
- `main.js`: the motion engine:
  - **Dot field** (WebGL): a GPU port of `paint_spatial_backdrop()` from `downmix_renderer/app.py`, with the same wave terms, cursor repulsion, perspective tilt per section (`data-field-intensity`, `data-field-tilt`), and click ripples.
  - **Logo sculpture**: about 4,000 particles sampled from the logo geometry. They assemble after the intro, pulse like a speaker cone, and scatter on scroll.
  - **Product film**: a scroll-pinned, Apple-style tour of the real app. A camera flies between real control positions (`film/film.json`): route, Render press with cursor, 7.1, 9.1.6, sum meters, Channels, Advanced. The clips loop on one shared 120 BPM clock, and an optional Web Audio groove plays in sync with the meters.
  - **Fold scene** (Canvas 2D): a scroll-pinned diagram of the 9.1.6 bed folding into stereo. It uses the real `SHARUR_916_STEREO_MATRIX` coefficients and the app's channel colours.
- `assets/`: logo and real app screenshots rendered offscreen from the Qt UI (`scripts/render_site_screenshots.py`).
- `fonts/`: Geist and Geist Mono variable fonts (SIL OFL 1.1, see `fonts/OFL.txt`).

## Accessibility and performance

- `prefers-reduced-motion` disables the intro, autonomous animation, and parallax. Scroll-linked content still works.
- Rendering pauses while the tab is hidden. The fold canvas draws only while on screen.
- WebGL is optional. Without it the page falls back to plain black.

## Updating screenshots

```sh
QT_QPA_PLATFORM=offscreen .venv/bin/python scripts/render_site_screenshots.py
cwebp -q 88 .build/site-shots/app-0-view.png -o website/assets/app-view.webp
cwebp -q 88 .build/site-shots/app-1-advanced.png -o website/assets/app-advanced.webp
```

## Re-rendering the product film

The clips in `film/` are rendered frame by frame from the real Qt UI with a synthetic 120 BPM groove driving the meters:

```sh
QT_QPA_PLATFORM=offscreen .venv/bin/python scripts/render_site_film.py --ffmpeg "$(python -c 'import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())')"
cwebp -q 88 website/film/advanced.png -o website/film/advanced.webp && rm website/film/advanced.png
```

Use `--geometry-only` to refresh the camera targets in `film.json` after UI layout changes without re-encoding.
