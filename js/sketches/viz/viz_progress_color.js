// viz_progress_color.js
// Demonstrates progress-based animation for students.
(function () {
    window.VizProgressColor = {
        draw: function (p, manager, ai, progress) {
            var cols = manager.width || 600;
            var rows = manager.height || 520;
            var ox = manager.offsetX || 0;
            var oy = manager.offsetY || 0;
            var dotR = 10;
            var spacing = 36;
            var numCols = Math.floor(cols / spacing);
            var numRows = Math.floor(rows / spacing);
            var inRange = progress >= 0.09 && progress <= 0.3;

            p.push();
            p.noStroke();
            for (var r = 0; r < numRows; r++) {
                for (var c = 0; c < numCols; c++) {
                    var x = ox + spacing / 2 + c * spacing;
                    var y = oy + spacing / 2 + r * spacing;
                    p.fill(inRange ? p.color(220, 60, 60, 200) : p.color(180, 210, 230, 180));
                    p.ellipse(x, y, dotR, dotR);
                }
            }

            p.fill(inRange ? p.color(220, 60, 60) : p.color(100));
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(14);
            p.text(
                'if (progress > 0.09 && progress < 0.3)  →  red dots       progress: ' + progress.toFixed(2),
                ox + cols / 2,
                oy + rows - 20
            );
            p.pop();
        }
    };
})();