// sketch_renderer.js

// Responsible for rendering the main visualization based on the current active index
(function () {
    window.Renderer = {

        preload: function (p) {
            // Preload all visualizations that need data loading
            if (window.VizLineChart && window.VizLineChart.preload) {
                window.VizLineChart.preload(p);
            }
            if (window.FirstViz && window.FirstViz.preload) {
                window.FirstVi2.preload(p);
            }

            if (window.VizCategories && window.VizCategories.preload) {
                window.VizCategories.preload(p);
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
            } else {
                if (window.VizLineChart &&
                    window.VizLineChart.resetAnimation) {
                    window.VizLineChart.resetAnimation();
                }
            }

            if (ai == 2) {
                window.VizCategories.draw(p, manager, ai, progress);
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

            if (ai === 8) {
                window.VizTimeline.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 3) {
                window.FirstViz2.draw(p, manager, ai, progress);
                return;
            }
        }
    };
})();
