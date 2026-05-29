// viz_linechart.js
(function () {

    let table;
    let data = [];
    let activeMode = 'pct2000';
    let isInitialized = false;

    window.VizLineChart = {
        preload: function (p) {
            table = p.loadTable('data/all_items_cpi_rebased.tsv', 'tsv', 'header');
        },

        setup: function () {
            if (table && table.getRowCount && !isInitialized) {
                data = [];
                for (let i = 0; i < table.getRowCount(); i++) {
                    const d = {
                        date: table.getString(i, 'date'),
                        pct_from_2000: parseFloat(table.getString(i, 'pct_from_2000')),
                        pct_yoy: parseFloat(table.getString(i, 'pct_yoy'))
                    };
                    if (d.date >= '2000-02') data.push(d);
                }
                isInitialized = true;
            }
        },

        draw: function (p, manager, ai, progress) {
            // Ensure setup runs on first draw
            if (!isInitialized) {
                this.setup();
            }
            if (!data || data.length === 0) {
                return;
            }

            const ox = manager.offsetX || 0;
            const oy = manager.offsetY || 0;
            const W = manager.width || 600;
            const H = manager.height || 520;
            const pad = { top: 40, right: 30, bottom: 60, left: 70 };
            const gW = W - pad.left - pad.right;
            const gH = H - pad.top - pad.bottom;

            const col = activeMode === 'pct2000' ? p.color(56, 138, 221) : p.color(216, 90, 48);
            const vals = data.map(d => activeMode === 'pct2000' ? d.pct_from_2000 : d.pct_yoy)
                .filter(v => !isNaN(v));

            if (vals.length === 0) {
                return;
            }

            const minV = Math.min(...vals);
            const maxV = Math.max(...vals);
            const xMap = i => ox + pad.left + (i / (data.length - 1)) * gW;
            const yMap = v => oy + pad.top + gH - ((v - minV) / (maxV - minV)) * gH;


            // Data line
            p.stroke(col);
            p.strokeWeight(2);
            p.noFill();
            p.beginShape();
            data.forEach((d, i) => {
                const v = activeMode === 'pct2000' ? d.pct_from_2000 : d.pct_yoy;
                if (!isNaN(v)) p.vertex(xMap(i), yMap(v));
            });
            p.endShape();
        },


    };

})();
