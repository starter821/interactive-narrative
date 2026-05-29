// viz_timeline.js
(function () {

    const events = [
        { year: '2008', label: 'Created the Law', type: 'policy' },
        { year: '2008–2020', label: 'Not Funded', type: 'policy' },
        { year: '2020', label: 'COVID-19 Outbreak', type: 'economic' },
        { year: 'Mar 2021', label: 'Highest Inflation Growth Rate', type: 'economic' },
        { year: '2021', label: 'Funded and Activated', type: 'policy' },
        { year: '2023', label: 'First Payments Go Out', type: 'policy' },
    ];

    window.VizTimeline = {
        draw: function (p, manager, ai, progress) {
            const ox = manager.offsetX || 0;
            const oy = manager.offsetY || 0;
            const W = manager.width || 600;
            const H = manager.height || 520;

            const lineX = ox + W / 2;
            const lineTop = oy + 40;
            const lineBottom = oy + H - 40;
            const step = (lineBottom - lineTop) / (events.length - 1);

            // static full line
            p.stroke(80);
            p.strokeWeight(2);
            p.line(lineX, lineTop, lineX, lineBottom);

            // dots
            events.forEach((ev, i) => {
                const y = lineTop + i * step;
                const col = ev.type === 'economic' ? p.color('orange') : p.color('#2DA3EE');
                p.fill(col);
                p.noStroke();
                p.circle(lineX, y, 12);
            });
        }
    };

})();