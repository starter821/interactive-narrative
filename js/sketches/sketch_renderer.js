// sketch_renderer.js

// Responsible for rendering the main visualization based on the current active index
(function () {
    window.Renderer = {

        preload: function (p) {
            // Always preload VizLineChart since it's used in early sections
            if (window.VizLineChart && window.VizLineChart.preload) {
                window.VizLineChart.preload(p);
            }
        },

        setData: function (manager) {
            var self = this;

            manager.offsetX = (manager.margin && manager.margin.left) || 20;
            manager.offsetY = (manager.margin && manager.margin.top) || 0;

            function computeLayout(data) {
                manager.data = data;
            }

            computeLayout([]);
            return Promise.resolve(manager.data);
        },

        draw: function (p, manager, ai, progress) {

            if (ai === 1) {
                window.VizLineChart.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 6 || ai === 9) {
                window.VizProgressColor.draw(p, manager, ai, progress);
                return;
            }

            if ((ai >= 4 && ai < 6)) {
                window.VizScatter.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 7) {
                window.VizTimeline.draw(p, manager, ai, progress);
                return;
            }
        }
    };
})();
