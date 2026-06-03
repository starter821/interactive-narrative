// viz_categories.js
(function () {

    let isInitialized = false;
    let sliderDate = 2000.0;
    let isDragging = false;
    let autoPlaying = false;
    let autoPlayStart = null;

    const categories = [
        { key: 'housing', label: 'Housing 🏠', file: 'data/housing.tsv', color: '#ffffff', data: [] },
        { key: 'apparel', label: 'Apparel 👕', file: 'data/apparel.tsv', color: '#ffffff', data: [] },
        { key: 'food', label: 'Food 🍽️', file: 'data/food.tsv', color: '#ffffff', data: [] },
        { key: 'medical', label: 'Medical 🏥', file: 'data/medical_care.tsv', color: '#ffffff', data: [] },
        { key: 'gas', label: 'Gas ⛽', file: 'data/seattle_gasoline_cpi.tsv', color: '#ffffff', data: [] },
        { key: 'transport', label: 'Transport 🚌', file: 'data/transportation.tsv', color: '#ffffff', data: [] },
    ];

    window.VizCategories = {

        resetAnimation: function () {
            autoPlaying = false;
            autoPlayStart = null;
            sliderYear = 2000;
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
            if (categories.some(c => !c.tableRef)) return;

            for (const cat of categories) {
                cat.data = [];
                for (let i = 0; i < cat.tableRef.getRowCount(); i++) {
                    const d = {
                        date: cat.tableRef.getString(i, 'date'),
                        pct_from_2000: parseFloat(cat.tableRef.getString(i, 'pct_from_2000')),
                        pct_yoy: parseFloat(cat.tableRef.getString(i, 'pct_yoy')),
                    };
                    if (d.date >= '2000-02') cat.data.push(d);
                }
            }

            isInitialized = true;
        },

        draw: function (p, manager, ai, progress) {
            if (!isInitialized) this.setup();
            if (!isInitialized) return;
            if (categories.some(c => c.data.length === 0)) return;

            if (progress > 0 && !isDragging) {
                if (!autoPlaying) {
                    autoPlaying = true;
                    autoPlayStart = p.millis();
                    sliderYear = 2000;
                }
                const elapsed = (p.millis() - autoPlayStart) / 1000; // seconds
                const duration = 6; // seconds to go 2000 -> 2025
                const t = Math.min(elapsed / duration, 1);
                sliderDate = 2000 + t * 26;
            }

            const ox = manager.offsetX || 0;
            const oy = manager.offsetY || 0;
            const W = manager.width || 600;
            const H = manager.height || 520;
            const pad = { top: 140, right: 60, bottom: 80, left: 100 };
            const gW = W - pad.left - pad.right;
            const gH = H - pad.top - pad.bottom;
            const rowH = gH / categories.length;

            const pctMin = -10;
            const pctMax = 340;
            const pctRange = pctMax - pctMin;
            const zeroX = ox + pad.left + ((-pctMin) / pctRange) * gW;

            // title
            p.noStroke();
            p.fill(255);
            p.textSize(18);
            p.textStyle(p.NORMAL);
            p.textAlign(p.CENTER, p.TOP);
            p.text('Cumulative CPI Change by Category, 2000 - 2025', ox + pad.left + gW / 2, oy + 20);

            // zero line
            p.stroke(120);
            p.strokeWeight(2);
            p.line(zeroX, oy + pad.top, zeroX, oy + pad.top + gH);

            // x axis ticks and grid lines
            for (let v = pctMin; v <= pctMax; v += 20) {
                const x = ox + pad.left + ((v - pctMin) / pctRange) * gW;
                p.stroke(80);
                p.strokeWeight(1);
                p.line(x, oy + pad.top, x, oy + pad.top + gH);
                p.stroke(180);
                p.line(x, oy + pad.top + gH, x, oy + pad.top + gH + 5);
                p.noStroke();
                p.fill(200);
                p.textSize(12);
                p.textAlign(p.CENTER, p.TOP);
                p.text(v + '%', x, oy + pad.top + gH + 8);
            }

            // x axis label
            p.noStroke();
            p.fill(200);
            p.textSize(14);
            p.textAlign(p.CENTER, p.TOP);
            p.text('Cumulative % change since 2000', ox + pad.left + gW / 2, oy + pad.top + gH + 40);

            // x axis bottom line
            p.stroke(180);
            p.strokeWeight(1);
            p.line(ox + pad.left, oy + pad.top + gH, ox + pad.left + gW, oy + pad.top + gH);

            // category row labels and dividers
            categories.forEach((cat, i) => {
                const rowY = oy + pad.top + i * rowH;
                p.stroke(50);
                p.strokeWeight(1);
                p.line(ox + pad.left, rowY, ox + pad.left + gW, rowY);
                p.noStroke();
                p.fill(220);
                p.textSize(16);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(cat.label, ox + pad.left - 10, rowY + rowH / 2);
            });

            // bottom divider
            p.stroke(50);
            p.strokeWeight(1);
            p.line(ox + pad.left, oy + pad.top + gH, ox + pad.left + gW, oy + pad.top + gH);

            // slider
            const trackX1 = ox + pad.left;
            const trackX2 = ox + pad.left + gW;
            const trackLen = trackX2 - trackX1;
            const trackY = oy + pad.top - 40;
            const yearMin = 2000;
            const yearMax = 2026;
            const handleX = trackX1 + ((sliderDate - yearMin) / (yearMax - yearMin)) * trackLen;

            if (p.mouseIsPressed) {
                if (!isDragging) {
                    if (Math.abs(p.mouseX - handleX) < 12 && Math.abs(p.mouseY - trackY) < 12) {
                        isDragging = true;
                    }
                }
                if (isDragging) {
                    sliderDate = yearMin + ((p.mouseX - trackX1) / trackLen) * (yearMax - yearMin);
                    sliderDate = Math.min(Math.max(sliderDate, yearMin), yearMax);
                }
            } else {
                isDragging = false;
            }

            p.stroke(80);
            p.strokeWeight(3);
            p.line(trackX1, trackY, trackX2, trackY);

            p.stroke(p.color('#2DA3EE'));
            p.strokeWeight(3);
            p.line(trackX1, trackY, handleX, trackY);

            p.fill(255);
            p.noStroke();
            p.circle(handleX, trackY, 14);

            p.fill(220);
            p.noStroke();
            p.textSize(11);
            p.textAlign(p.CENTER, p.TOP);
            const displayYear = Math.floor(sliderDate);
            const displayMonth = Math.round((sliderDate % 1) * 12) + 1;
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            p.text(monthNames[displayMonth - 1] + ' ' + displayYear, handleX, trackY + 10);

            // bars
            categories.forEach((cat, i) => {
                const rowY = oy + pad.top + i * rowH;
                const rowPad = rowH * 0.25;
                const barY = rowY + rowPad;
                const barH = rowH - rowPad * 2;

                const displayYear = Math.floor(sliderDate);
                const displayMonth = Math.round((sliderDate % 1) * 12) + 1;
                const mm = String(displayMonth).padStart(2, '0');
                const target = displayYear + '-' + mm;

                let closest = cat.data[0];
                for (const d of cat.data) {
                    if (d.date <= target) closest = d;
                    else break;
                }

                if (!closest || isNaN(closest.pct_from_2000)) return;

                const valX = ox + pad.left + ((closest.pct_from_2000 - pctMin) / pctRange) * gW;
                const barX = Math.min(zeroX, valX);
                const barW = Math.abs(valX - zeroX);

                p.noStroke();
                p.fill(cat.color);
                p.rect(barX, barY, barW, barH, 2);

                p.fill(220);
                p.textSize(11);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(closest.pct_from_2000.toFixed(1) + '%', valX + 5, barY + barH / 2);
            });
        },

    };

})();