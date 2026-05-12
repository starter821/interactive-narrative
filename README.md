## Narrative Visualization (Scrollytelling) Template

A minimal scaffold for scroll-driven p5.js visuals for **IMT 561 Data Visualization: Design and Development**. HTML sections in `index.html` drive the visual state via `js/helpers/sections.js`.

**Quick start**

VS Code Live Server extension:
1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
2. Open the repo folder in VS Code.
3. Click **Go Live** in the status bar (or right-click `index.html` → *Open with Live Server*).


**Structure**
- `index.html` — page sections and `window.ScrollDemoConfig`
- `css/` — layout and vis container styles
- `data/` — static data files (e.g. `words.tsv`)
- `js/helpers/` — `data_loader.js`, `scroller.js`, `visual_controller.js`, `sections.js`
- `js/sketches/sketch_manager.js` — p5 lifecycle; exposes `startP5()` → `{ setState, setData, ready, p5, data }`
- `js/sketches/sketch_renderer.js` — delegates draw calls to per-viz modules
- `js/sketches/viz/` — per-visual files (e.g. `viz_title.js`, `viz_scatter.js`, `viz_bar.js`)
- `js/sketches/examples/` — example renderer (`sketch_grid.js`)

**Add a new visual**
1. Create `js/sketches/viz/viz_foo.js` exposing `window.FooViz.draw(p, manager, ai, progress)`.
2. Load it in `index.html` before `sketch_renderer.js`.

**Script load order in `index.html`**
helpers → viz modules/examples → `sketch_renderer.js` → `sketch_manager.js`

**Deploy**
GitHub Pages (`gh-pages` branch or `docs/`) or any static host.
