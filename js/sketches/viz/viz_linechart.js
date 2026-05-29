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
            const pad = { top: 70, right: 170, bottom: 60, left: 30 };
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

            // title
            p.noStroke();
            p.fill(255);
            p.textSize(20);
            p.textAlign(p.CENTER, p.TOP);
            p.text('Cumulative Price Change 2000 - 2025', ox + pad.left + gW / 2, oy);

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
            p.line(ox + pad.left, oy + pad.top - gH / 10, ox + pad.left, oy + pad.top + gH);

            // y axis label
            p.push();
            p.translate(ox - 30, oy + pad.top + gH / 2);
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

            // hover dots
            const mx = p.mouseX;
            const my = p.mouseY;

            // check if mouse is inside chart area
            if (mx >= ox + pad.left && mx <= ox + pad.left + gW &&
                my >= oy + pad.top && my <= oy + pad.top + gH) {

                // find nearest index by x position
                const idx = Math.round((mx - ox - pad.left) / gW * (seattleData.length - 1));
                const clampedIdx = Math.max(0, Math.min(idx, seattleData.length - 1));

                const seattleV = getVal(seattleData[clampedIdx]);
                const usV = getVal(usData[clampedIdx]);
                const date = seattleData[clampedIdx].date;

                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
                const parts = date.split('-');
                const dateLabel = monthNames[parseInt(parts[1]) - 1] + ' ' + parts[0];

                // vertical line
                p.stroke(150);
                p.strokeWeight(1);
                p.line(xMap(clampedIdx), oy + pad.top - 24, xMap(clampedIdx), oy + pad.top + gH);

                // dot on seattle line
                if (!isNaN(seattleV)) {
                    p.fill(p.color('#2DA3EE'));
                    p.noStroke();
                    p.circle(xMap(clampedIdx), yMap(seattleV), 10);
                }

                // dot on us line
                if (!isNaN(usV)) {
                    p.fill(p.color('orange'));
                    p.noStroke();
                    p.circle(xMap(clampedIdx), yMap(usV), 10);
                }

                // annotation box
                const boxW = 160;
                const boxH = 70;
                const boxPad = 8;

                let bx = xMap(clampedIdx) + 12;
                if (bx + boxW > ox + pad.left + gW) bx = xMap(clampedIdx) - boxW - 12;
                let by = my - boxH / 2;
                if (by < oy + pad.top) by = oy + pad.top;
                if (by + boxH > oy + pad.top + gH) by = oy + pad.top + gH - boxH;

                // white box
                p.fill(255);
                p.stroke(200);
                p.strokeWeight(1);
                p.rect(bx, by, boxW, boxH, 4);

                // date label
                p.noStroke();
                p.fill(0);
                p.textSize(12);
                p.textAlign(p.LEFT, p.TOP);
                p.text(dateLabel, bx + boxPad, by + boxPad);

                // US row
                p.fill(p.color('orange'));
                p.noStroke();
                p.rect(bx + boxPad, by + 28, 14, 14, 2);
                p.fill(0);
                p.textSize(11);
                p.textAlign(p.LEFT, p.TOP);
                p.text('United States', bx + boxPad + 18, by + 28);
                p.textAlign(p.RIGHT, p.TOP);
                p.text(isNaN(usV) ? 'N/A' : usV.toFixed(1) + '%', bx + boxW - boxPad, by + 28);

                // Seattle row
                p.fill(p.color('#2DA3EE'));
                p.noStroke();
                p.textAlign(p.LEFT, p.TOP);
                p.rect(bx + boxPad, by + 46, 14, 14, 2);
                p.fill(0);
                p.text('Seattle Metro', bx + boxPad + 18, by + 46);
                p.textAlign(p.RIGHT, p.TOP);
                p.text(isNaN(seattleV) ? 'N/A' : seattleV.toFixed(1) + '%', bx + boxW - boxPad, by + 46);
            }

            //#region legend
            const legX = ox + pad.left + gW + 10;
            const legY = oy + pad.top + 10;
            const legW = 145;
            const legH = 50;

            // box
            p.fill(30);
            p.stroke(180);
            p.strokeWeight(1);
            p.rect(legX, legY, legW, legH, 4);

            // US line sample — dashed orange
            p.stroke(p.color('orange'));
            p.strokeWeight(2);
            const dashLen = 3, gapLen = 4.5;
            let t = 0, drawing = true;
            while (t < 25) {
                const t2 = Math.min(t + (drawing ? dashLen : gapLen), 25);
                if (drawing) p.line(legX + 10 + t, legY + 18, legX + 10 + t2, legY + 18);
                t = t2;
                drawing = !drawing;
            }
            p.noStroke();
            p.fill(220);
            p.textAlign(p.LEFT, p.CENTER);
            p.textSize(11);
            p.text('United States', legX + 40, legY + 18);

            // Seattle line sample — solid blue
            p.stroke(p.color('#2DA3EE'));
            p.strokeWeight(2);
            p.line(legX + 10, legY + 35, legX + 35, legY + 35);
            p.noStroke();
            p.fill(220);
            p.text('Seattle Metro', legX + 40, legY + 35);

            //#endregion

        },

    }
})();
