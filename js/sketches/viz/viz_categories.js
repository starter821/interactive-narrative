// viz_categories.js
(function () {

    let housingTable, apparelTable, foodTable, medicalTable, gasolineTable, transportTable;
    let isInitialized = false;

    const categories = [
        { key: 'housing', label: 'Housing', file: 'data/housing.tsv', color: '#ffffff', data: [] },
        { key: 'apparel', label: 'Apparel', file: 'data/apparel.tsv', color: '#ffffff', data: [] },
        { key: 'food', label: 'Food', file: 'data/food.tsv', color: '#ffffff', data: [] },
        { key: 'medical', label: 'Medical', file: 'data/medical_care.tsv', color: '#ffffff', data: [] },
        { key: 'gas', label: 'Gas', file: 'data/seattle_gasoline_cpi.tsv', color: '#ffffff', data: [] },
        { key: 'transport', label: 'Transport', file: 'data/transportation.tsv', color: '#ffffff', data: [] },
    ];

    window.VizCategories = {

        resetAnimation: function () {
            // will add animation state here later
        },

        preload: function (p) {
            categories[0].tableRef = p.loadTable(categories[0].file, 'tsv', 'header');
            categories[1].tableRef = p.loadTable(categories[1].file, 'tsv', 'header');
            categories[2].tableRef = p.loadTable(categories[2].file, 'tsv', 'header');
            categories[3].tableRef = p.loadTable(categories[3].file, 'tsv', 'header');
            categories[4].tableRef = p.loadTable(categories[4].file, 'tsv', 'header');
            categories[5].tableRef = p.loadTable(categories[5].file, 'tsv', 'header');
        },

        setup: function () {
            if (isInitialized) return;

            for (const cat of categories) {
                cat.data = [];
                if (!cat.tableRef) continue;
                for (let i = 0; i < cat.tableRef.getRowCount(); i++) {
                    const d = {
                        date: cat.tableRef.getString(i, 'date'),
                        pct_from_2000: parseFloat(cat.tableRef.getString(i, 'pct_from_2000')),
                        pct_yoy: parseFloat(cat.tableRef.getString(i, 'pct_yoy')),
                    };
                    if (d.date >= '2000-02') cat.data.push(d);
                }
            }

            for (const cat of categories) {
                console.log(cat.key, cat.tableRef);
            }

            isInitialized = true;
        },

        draw: function (p, manager, ai, progress) {
            if (!isInitialized) this.setup();
            if (categories.some(c => c.data.length === 0)) return;

            const ox = manager.offsetX || 0;
            const oy = manager.offsetY || 0;
            const W = manager.width || 600;
            const H = manager.height || 520;
            const pad = { top: 80, right: 60, bottom: 60, left: 100 };
            const gW = W - pad.left - pad.right;
            const gH = H - pad.top - pad.bottom;

            const rowH = gH / categories.length;

            // title
            p.noStroke();
            p.fill(255);
            p.textSize(18);
            p.textStyle(p.NORMAL);
            p.textAlign(p.CENTER, p.TOP);
            p.text('Cumulative CPI Change by Category, 2000 - 2025', ox + pad.left + gW / 2, oy + 20);

            // x axis line
            p.stroke(180);
            p.strokeWeight(1);
            p.line(ox + pad.left, oy + pad.top + gH, ox + pad.left + gW, oy + pad.top + gH);

            // x axis ticks and labels
            const xMin = 2000;
            const xMax = 2025;
            p.textSize(11);
            p.textAlign(p.CENTER, p.TOP);
            for (let year = xMin; year <= xMax; year += 5) {
                const x = ox + pad.left + ((year - xMin) / (xMax - xMin)) * gW;
                p.stroke(180);
                p.strokeWeight(1);
                p.line(x, oy + pad.top + gH, x, oy + pad.top + gH + 5);
                p.noStroke();
                p.fill(200);
                p.text(year, x, oy + pad.top + gH + 8);
            }

            // x axis label
            p.noStroke();
            p.fill(200);
            p.textSize(12);
            p.textAlign(p.CENTER, p.TOP);
            p.text('Year', ox + pad.left + gW / 2, oy + pad.top + gH + 28);

            // category row labels and dividers
            categories.forEach((cat, i) => {
                const rowY = oy + pad.top + i * rowH;

                // horizontal divider
                p.stroke(50);
                p.strokeWeight(1);
                p.line(ox + pad.left, rowY, ox + pad.left + gW, rowY);

                // category label
                p.noStroke();
                p.fill(220);
                p.textSize(13);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(cat.label, ox + pad.left - 10, rowY + rowH / 2);
            });

            // bottom divider
            p.stroke(50);
            p.strokeWeight(1);
            p.line(ox + pad.left, oy + pad.top + gH, ox + pad.left + gW, oy + pad.top + gH);
        },

    };

})();