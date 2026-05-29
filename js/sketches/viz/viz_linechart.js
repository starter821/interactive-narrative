// viz_linechart.js
(function () {

    let seattleTable;
    let usTable
    let seattleData = [];
    let usData = [];
    let activeMode = 'pct2000';
    let isInitialized = false;

    window.VizLineChart = {
        preload: function (p) {
            seattleTable = p.loadTable('data/all_items_cpi_rebased.tsv', 'tsv', 'header');
            usTable = p.loadTable('data/us_cpi_rebased.tsv', 'tsv', 'header');
        },

        setup: function () {
            if (seattleTable && usTable && !isInitialized) {
                seattleData = [];
                for (let i = 0; i < seattleTable.getRowCount(); i++) {
                    const d = {
                        date: seattleTable.getString(i, 'date'),
                        pct_from_2000: parseFloat(seattleTable.getString(i, 'pct_from_2000')),
                        pct_yoy: parseFloat(seattleTable.getString(i, 'pct_yoy'))
                    };
                    if (d.date >= '2000-02') seattleData.push(d);
                }

                usData = [];
                for (let i = 0; i < usTable.getRowCount(); i++) {
                    const d = {
                        date: usTable.getString(i, 'date'),
                        pct_from_2000: parseFloat(usTable.getString(i, 'pct_from_2000')),
                        pct_yoy: parseFloat(usTable.getString(i, 'pct_yoy'))
                    };
                    if (d.date >= '2000-02') usData.push(d);
                }

                isInitialized = true;
            }
        },

        draw: function (p, manager, ai, progress) {
            // Ensure setup runs on first draw
            if (!isInitialized) {
                this.setup();
            }
            if (!seattleData || seattleData.length === 0 || !usData || usData.length === 0) {
                return;
            }

            const ox = manager.offsetX || 0;
            const oy = manager.offsetY || 0;
            const W = manager.width || 600;
            const H = manager.height || 520;
            const pad = { top: 40, right: 30, bottom: 60, left: 70 };
            const gW = W - pad.left - pad.right;
            const gH = H - pad.top - pad.bottom;

            const getVal = (d) => activeMode === 'pct2000' ? d.pct_from_2000 : d.pct_yoy;

            const allVals = [
                ...seattleData.map(d => getVal(d)),
                ...usData.map(d => getVal(d))
            ].filter(v => !isNaN(v));

            const minV = Math.min(...allVals);
            const maxV = Math.max(...allVals);
            const xMap = i => ox + pad.left + (i / (seattleData.length - 1)) * gW;
            const yMap = v => oy + pad.top + gH - ((v - minV) / (maxV - minV)) * gH;

            //#region axes and labels
            // y axis
            p.textSize(11);
            p.textAlign(p.RIGHT, p.CENTER);
            for (let v = 0; v <= 120; v += 20) {
                const y = yMap(v);
                // tick
                p.stroke(220);
                p.strokeWeight(1);
                p.line(ox + pad.left - 5, y, ox + pad.left, y);
                // gridline
                p.stroke(80);
                p.line(ox + pad.left, y, ox + pad.left + gW, y);
                // label
                p.noStroke();
                p.fill(220);
                p.text(v + '%', ox + pad.left - 8, y);
            }

            // axis line
            p.stroke(220)
            p.strokeWeight(1);
            p.line(ox + pad.left, oy + pad.top - gH/10, ox + pad.left, oy + pad.top + gH);

            // y axis label
            p.push();
            p.translate(ox + 15, oy + pad.top + gH / 2);
            p.rotate(-Math.PI / 2);
            p.textAlign(p.CENTER, p.CENTER);
            p.noStroke();
            p.textSize(14);
            p.text('Percent Change', 0, 0);
            p.pop();

            // x axis 
            const startYear = 2000;
            const endYear = 2026;
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(11);

            for (let year = startYear; year <= endYear; year += 5) {
                // find index of Feb of that year (since data starts Feb 2000)
                const dateStr = year + '-02';
                const idx = seattleData.findIndex(d => d.date === dateStr);
                if (idx === -1) continue;
                const x = xMap(idx);

                // tick
                p.stroke(180);
                p.strokeWeight(1);
                p.line(x, oy + pad.top + gH, x, oy + pad.top + gH + 5);

                p.line(ox + pad.left, oy + pad.top + gH, ox + pad.left + gW, oy + pad.top + gH);

                // label
                p.noStroke();
                p.fill(220);
                p.text(year, x, oy + pad.top + gH + 8);
            }

            // x axis label
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(14);
            p.fill(220);
            p.noStroke();
            p.text('Year', ox + pad.left + gW / 2, oy + pad.top + gH + 30);

            //#endregion


            function drawLine(data, col, dashed) {
                p.stroke(col);
                p.strokeWeight(2);
                p.noFill();
                if (dashed) {
                    const dashLen = 3;
                    const gapLen = 4.5;
                    for (let i = 1; i < data.length; i++) {
                        const v1 = getVal(data[i - 1]);
                        const v2 = getVal(data[i]);
                        if (isNaN(v1) || isNaN(v2)) continue;
                        const x1 = xMap(i - 1), y1 = yMap(v1);
                        const x2 = xMap(i), y2 = yMap(v2);
                        const dx = x2 - x1, dy = y2 - y1;
                        const segLen = Math.sqrt(dx * dx + dy * dy);
                        let t = 0;
                        let drawing = true;
                        while (t < segLen) {
                            const t2 = Math.min(t + (drawing ? dashLen : gapLen), segLen);
                            if (drawing) {
                                p.line(
                                    x1 + dx * (t / segLen), y1 + dy * (t / segLen),
                                    x1 + dx * (t2 / segLen), y1 + dy * (t2 / segLen)
                                );
                            }
                            t = t2;
                            drawing = !drawing;
                        }

                    }
                } else {
                    p.beginShape();
                    data.forEach((d, i) => {
                        const v = activeMode === 'pct2000' ? d.pct_from_2000 : d.pct_yoy;
                        if (!isNaN(v)) p.vertex(xMap(i), yMap(v));
                    });
                    p.endShape();
                }
            }

            drawLine(usData, p.color('orange'), true)
            drawLine(seattleData, p.color('#2DA3EE'), false)
            console.log('usData length:', usData.length);

        },

    }
})();
