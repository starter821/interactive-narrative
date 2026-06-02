// viz_linechart.js
(function () {

    let seattleTable;
    let usTable
    let seattleData = [];
    let usData = [];
    let activeMode = 'pct2000';
    let isInitialized = false;
    let lastPressed = false;
    let sliderStartYear = 2000;
    let sliderEndYear = 2026;
    let draggingHandle = null;

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
            const pad = { top: 150, right: 170, bottom: 80, left: 30 };
            const gW = W - pad.left - pad.right;
            const gH = H - pad.top - pad.bottom;

            const getVal = (d) => activeMode === 'pct2000' ? d.pct_from_2000 : d.pct_yoy;

            // filter data by slider year range
            const filteredSeattle = seattleData.filter(d => {
                const y = parseInt(d.date.split('-')[0]);
                return y >= sliderStartYear && y <= sliderEndYear;
            });
            const filteredUS = usData.filter(d => {
                const y = parseInt(d.date.split('-')[0]);
                return y >= sliderStartYear && y <= sliderEndYear;
            });

            const allVals = [
                ...filteredSeattle.map(d => getVal(d)),
                ...filteredUS.map(d => getVal(d))
            ].filter(v => !isNaN(v));

            if (filteredSeattle.length === 0 || filteredUS.length === 0) {
                return;  // Exit early if no data to display
            }

            const minV = Math.min(...allVals);
            const maxV = Math.max(...allVals);
            const xMap = i => ox + pad.left + (i / (filteredSeattle.length - 1)) * gW;
            const yMap = v => oy + pad.top + gH - ((v - minV) / (maxV - minV)) * gH;

            // Helper function to apply y-axis offset for pct_yoy mode
            const getDisplayY = (y) => activeMode === 'pct_yoy' ? y - 20 : y;


            //#region buttons
            const btn1X = ox + pad.left - 80;
            const btn2X = ox + pad.left + 70;
            const btnY = oy + pad.top - 150;
            const btnW = 150;
            const btnH = 40;

            // button 1 -- cumulative
            p.fill(activeMode === 'pct2000' ? p.color('#2DA3EE') : p.color(50));
            p.stroke(activeMode === 'pct2000' ? p.color('#2DA3EE') : p.color(120));
            p.strokeWeight(1);
            p.rect(btn1X, btnY, btnW, btnH, 10, 10, 0, 0);
            p.noStroke();
            p.fill(activeMode === 'pct2000' ? 255 : 160);
            p.textStyle(activeMode === 'pct2000' ? p.BOLD : p.NORMAL);
            p.textSize(12);
            p.textAlign(p.CENTER, p.CENTER);
            p.text('Cumulative Change', btn1X + btnW / 2, btnY + btnH / 2);

            // button 2 -- inflation rate
            p.fill(activeMode === 'pct_yoy' ? p.color('#2DA3EE') : p.color(50));
            p.stroke(activeMode === 'pct_yoy' ? p.color('#2DA3EE') : p.color(120));
            p.strokeWeight(1);
            p.rect(btn2X, btnY, btnW, btnH, 10, 10, 0, 0);
            p.noStroke();
            p.fill(activeMode === 'pct_yoy' ? 255 : 160);
            p.textStyle(activeMode === 'pct_yoy' ? p.BOLD : p.NORMAL);
            p.textAlign(p.CENTER, p.CENTER);
            p.text('Inflation Rate', btn2X + btnW / 2, btnY + btnH / 2);

            // click detection
            const pressed = p.mouseIsPressed;
            if (pressed && !lastPressed) {
                const mx2 = p.mouseX;
                const my2 = p.mouseY;

                if (mx2 >= btn1X && mx2 <= btn1X + btnW &&
                    my2 >= btnY && my2 <= btnY + btnH) {
                    activeMode = 'pct2000';
                }

                if (mx2 >= btn2X && mx2 <= btn2X + btnW &&
                    my2 >= btnY && my2 <= btnY + btnH) {
                    activeMode = 'pct_yoy';
                }
            }
            lastPressed = pressed;

            //#endregion
            //#region axes and labels

            // title
            const title = activeMode === 'pct2000' ? 'Cumulative Price Change 2000 - 2026' : 'Year-over-Year Inflation Rate 2000 - 2026';
            p.noStroke();
            p.fill(255);
            p.textSize(20);
            p.textStyle(p.NORMAL);
            p.textAlign(p.CENTER, p.TOP);
            p.text(title, ox + pad.left + gW / 2, oy + 60);

            // y axis
            p.textSize(11);
            p.textAlign(p.RIGHT, p.CENTER);
            // round to nice intervals
            let tickMin, tickMax, interval;
            if (activeMode === 'pct2000') {
                tickMin = 0;
                tickMax = 120;
                interval = 20;
            } else {
                tickMin = -2;
                tickMax = 10;
                interval = 2;
            }

            const rawRange = tickMax - tickMin;
            interval = rawRange > 50 ? 20 : rawRange > 20 ? 5 : 2;

            for (let v = tickMin; v <= tickMax; v += interval) {
                let y = getDisplayY(yMap(v));
                // tick
                p.stroke(220);
                p.strokeWeight(1);
                p.line(ox + pad.left - 5, y, ox + pad.left, y);
                // grid line
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
            const yLabel = activeMode === 'pct2000' ? 'Cumulative % Change' : 'Inflation Rate (%)';
            p.push();
            p.translate(ox - 30, oy + pad.top + gH / 2);
            p.rotate(-Math.PI / 2);
            p.textAlign(p.CENTER, p.CENTER);
            p.noStroke();
            p.textSize(14);
            p.text(yLabel, 0, 0);
            p.pop();

            // x axis 
            const startYear = 2000;
            const endYear = 2026;
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(11);

            for (let year = startYear; year <= endYear; year += 5) {
                // find index of Feb of that year (since data starts Feb 2000)
                const dateStr = year + '-02';
                const idx = filteredSeattle.findIndex(d => d.date === dateStr);
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
                        const x1 = xMap(i - 1), y1 = getDisplayY(yMap(v1));
                        const x2 = xMap(i), y2 = getDisplayY(yMap(v2));
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
                        if (!isNaN(v)) p.vertex(xMap(i), getDisplayY(yMap(v)));
                    });
                    p.endShape();
                }
            }

            drawLine(filteredUS, p.color('orange'), true)
            drawLine(filteredSeattle, p.color('#2DA3EE'), false)

            // hover dots
            const mx = p.mouseX;
            const my = p.mouseY;

            // check if mouse is inside chart area
            if (mx >= ox + pad.left && mx <= ox + pad.left + gW &&
                my >= oy + pad.top && my <= oy + pad.top + gH) {

                // find nearest index by x position
                const idx = Math.round((mx - ox - pad.left) / gW * (filteredSeattle.length - 1));
                const clampedIdx = Math.max(0, Math.min(idx, filteredSeattle.length - 1));

                const seattleV = getVal(filteredSeattle[clampedIdx]);
                const usV = getVal(filteredUS[clampedIdx]);
                const date = filteredSeattle[clampedIdx].date;

                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
                const parts = date.split('-');
                const dateLabel = monthNames[parseInt(parts[1]) - 1] + ' ' + parts[0];

                // vertical line
                p.stroke(150);
                p.strokeWeight(1);
                p.line(xMap(clampedIdx), getDisplayY(oy + pad.top - 24), xMap(clampedIdx), getDisplayY(oy + pad.top + gH));

                // dot on seattle line
                if (!isNaN(seattleV)) {
                    p.fill(p.color('#2DA3EE'));
                    p.noStroke();
                    p.circle(xMap(clampedIdx), getDisplayY(yMap(seattleV)), 10);
                }

                // dot on us line
                if (!isNaN(usV)) {
                    p.fill(p.color('orange'));
                    p.noStroke();
                    p.circle(xMap(clampedIdx), getDisplayY(yMap(usV)), 10);
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
                p.textSize(14);
                p.textAlign(p.LEFT, p.TOP);
                p.text(dateLabel, bx + boxPad, by + boxPad);

                // US row
                p.fill(p.color('orange'));
                p.noStroke();
                p.rect(bx + boxPad, by + 28, 14, 14, 2);
                p.fill(0);
                p.textSize(14);
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

            //#region legend + slider
            const legX = ox + pad.left + gW + 10;
            const legY = oy + pad.top + 10;
            const legW = 145;
            const legH = 110;
            const sliderPad = 12;
            const trackY = legY + 75;
            const trackX1 = legX + sliderPad;
            const trackX2 = legX + legW - sliderPad;
            const trackLen = trackX2 - trackX1;
            const yearMin = 2000;
            const yearMax = 2026;
            const handle1X = trackX1 + ((sliderStartYear - yearMin) / (yearMax - yearMin)) * trackLen;
            const handle2X = trackX1 + ((sliderEndYear - yearMin) / (yearMax - yearMin)) * trackLen;

            // slider drag logic
            const handleRadius = 8;
            if (p.mouseIsPressed) {
                if (draggingHandle === null) {
                    if (Math.abs(p.mouseX - handle1X) < handleRadius + 4 &&
                        Math.abs(p.mouseY - trackY) < handleRadius + 4) {
                        draggingHandle = 'start';
                    } else if (Math.abs(p.mouseX - handle2X) < handleRadius + 4 &&
                        Math.abs(p.mouseY - trackY) < handleRadius + 4) {
                        draggingHandle = 'end';
                    }
                }
                if (draggingHandle === 'start') {
                    const rawYear = yearMin + ((p.mouseX - trackX1) / trackLen) * (yearMax - yearMin);
                    sliderStartYear = Math.round(Math.min(Math.max(rawYear, yearMin), sliderEndYear - 1));
                }
                if (draggingHandle === 'end') {
                    const rawYear = yearMin + ((p.mouseX - trackX1) / trackLen) * (yearMax - yearMin);
                    sliderEndYear = Math.round(Math.min(Math.max(rawYear, sliderStartYear + 1), yearMax));
                }
            } else {
                draggingHandle = null;
            }

            // box
            p.fill(30);
            p.stroke(180);
            p.strokeWeight(1);
            p.rect(legX, legY, legW+10, legH, 4);

            // US line sample -- dashed orange
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
            p.textSize(12);
            p.text('United States', legX + 45, legY + 18);

            // Seattle line sample -- solid blue
            p.stroke(p.color('#2DA3EE'));
            p.strokeWeight(2);
            p.line(legX + 10, legY + 35, legX + 35, legY + 35);
            p.noStroke();
            p.fill(220);
            p.text('Seattle Metro', legX + 45, legY + 35);

            // 'Range'
            p.fill(220);
            p.textSize(12);
            p.textAlign(p.CENTER, p.CENTER);
            p.text('Range', legX + legW / 2 + 6, legY + 58);

            // track background
            p.stroke(80);
            p.strokeWeight(3);
            p.line(trackX1 + 6, trackY, trackX2 + 6, trackY);

            // active track between handles
            p.stroke(p.color('#2DA3EE'));
            p.strokeWeight(3);
            p.line(handle1X + 6, trackY, handle2X + 6, trackY);

            // handle circles
            p.fill(255);
            p.noStroke();
            p.circle(handle1X + 6, trackY, 12);
            p.circle(handle2X + 6, trackY, 12);

            // year labels under handles
            p.fill(220);
            p.textSize(11);
            p.textAlign(p.CENTER, p.TOP);
            p.text(sliderStartYear, handle1X + 6, trackY + 12);
            p.text(sliderEndYear, handle2X + 6, trackY + 12);

            //#endregion

            p.push()
            p.noStroke();
            p.fill(220);
            p.textSize(10);
            p.textAlign(p.RIGHT, p.BOTTOM);
            p.text('Source: U.S. Bureau of Labor Statistics', ox + pad.left + gW + 160, oy + pad.top + gH + 70 );
            p.pop();

            p.noFill()
            p.stroke(220)
            p.strokeWeight(0.5);
            p.rect(ox-50, oy + 40, W + 50, H - 40); // invisible rect to capture mouse events outside the chart area


        },

    }
})();
