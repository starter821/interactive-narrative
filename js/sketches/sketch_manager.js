// sketch_manager.js

function startP5() {

    var localRenderer;
    // localRenderer = window.TemplateRenderer;
    localRenderer = window.Renderer;

    // --- Sketch manager ----------------------------------------------------
    function getVisSize() {
        var isMobile = window.innerWidth <= 700;
        var w, margin;
        if (isMobile) {
            w = window.innerWidth - 24;
            margin = { top: 0, left: Math.round(w * 0.07), bottom: 25, right: 8 };
        } else {
            var wFromWidth = Math.round(window.innerWidth * 0.70) - 20;
            var wFromHeight = Math.round((window.innerHeight - 80) * (600 / 520));
            w = Math.min(wFromWidth, wFromHeight);
            margin = { top: 0, left: 80, bottom: 40, right: 10 };
        }
        return { width: w, height: Math.round(w * (520 / 600)), margin: margin };
    }

    function SketchManager() {
        var size = getVisSize();
        this.width = size.width;
        this.height = size.height;
        this.margin = size.margin;
        this.canvasWidth = this.width + this.margin.left + this.margin.right;
        this.canvasHeight = this.height + this.margin.top + this.margin.bottom;

        // drawing state
        this.state = { activeIndex: 0, progress: 0 };

        // data will be attached by localRenderer.setData(manager, data)
        this.data = [];

        // create the p5 instance bound to this manager
        var self = this;
        var sketch = function (p) {
            p.setup = function () {
                var parent = document.getElementById('vis');
                parent.innerHTML = '';
                p.createCanvas(self.canvasWidth, self.canvasHeight).parent('vis');
                p.noStroke();
                p.frameRate(30);
            };

            p.windowResized = function () {
                var s = getVisSize();
                self.width = s.width;
                self.height = s.height;
                self.margin = s.margin;
                self.canvasWidth = s.width + s.margin.left + s.margin.right;
                self.canvasHeight = s.height + s.margin.top + s.margin.bottom;
                self._randomPoints = null;
                self._barCounts = null;
                p.resizeCanvas(self.canvasWidth, self.canvasHeight);
            };

            p.draw = function () {
                p.background(255);
                self.draw(p);
            };
        };

        this.p5 = new p5(sketch);
    }


    // set visualization state (called by scroll logic)
    SketchManager.prototype.setState = function (s) {
        if (s.activeIndex !== undefined) this.state.activeIndex = s.activeIndex;
        if (s.progress !== undefined) this.state.progress = s.progress;
    };

    // delegate data handling to localRenderer
    SketchManager.prototype.setData = function (newData) {
        return localRenderer.setData(this, newData);
    };

    // simple drawing routine, split into helpers for clarity
    SketchManager.prototype.draw = function (p) {
        var ai = this.state.activeIndex || 0;
        var progress = this.state.progress || 0;
        localRenderer.draw(p, this, ai, progress);
    };

    // create (or replace) singleton manager and expose API
    if (window.__sketchAPI && window.__sketchAPI.p5) {
        try { window.__sketchAPI.p5.remove(); } catch (e) { }
        window.__sketchAPI = null;
    }
    var manager = new SketchManager();
    // initialize data via localRenderer (fail fast if missing)
    if (!localRenderer || typeof localRenderer.setData !== 'function') {
        throw new Error('localRenderer.setData is required at startup.');
    }

    var setDataResult = localRenderer.setData(manager);

    var api = {
        setState: manager.setState.bind(manager),
        setData: manager.setData.bind(manager),
        p5: manager.p5,
        data: manager.data
    };

    // Expose a `ready` promise so callers can wait until data/layout are ready.
    if (setDataResult && typeof setDataResult.then === 'function') {
        api.ready = setDataResult.then(function () { return api; });
    } else {
        api.ready = Promise.resolve(api);
    }

    // Expose the API globally once ready so consumers (like sections) see
    // the populated data without racing the async load.
    api.ready.then(function () {
        try { window.__sketchAPI = api; } catch (e) { }
    }).catch(function () {
        try { window.__sketchAPI = api; } catch (e) { }
    });

    return api;
}
