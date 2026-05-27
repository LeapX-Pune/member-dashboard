/**
 * js/charts.js
 * Chart orchestration logic for the Member Dashboard.
 * Handles the dynamic rendering of top stat rings and the Activity Progress line chart.
 * Designed for a single active user.
 */

window.addEventListener('DOMContentLoaded', () => {
    // 1. Verify Data Exists
    if (!window.mockData) {
        console.warn("charts.js: window.mockData is not available.");
        return;
    }

    const data = window.mockData;
    const stats = data.membershipStats;
    
    // --- Dynamic DOM Hydration for Top Row Rings ---
    // Helper function to initialize a ring's DOM elements and calculate its target percentage based on a goal.
    const prepareRingData = (idPrefix, value, goal) => {
        const ring = document.getElementById(idPrefix + '-ring');
        const valEl = document.getElementById(idPrefix + '-val');
        
        if (valEl) valEl.textContent = '0';
        if (ring) ring.style.setProperty('--ring-pct', `0%`);
        
        let numVal = parseFloat(value);
        let pct = Math.min((numVal / goal) * 100, 100);

        return { ring, valEl, numVal, pct };
    };

    // Goals: Sessions(200), Points(2000), Attendance(100), Hours(200)
    const ringsData = [
        prepareRingData('stat-sessions', stats.sessionsCount, window.sessionGoal || 200),
        prepareRingData('stat-points', stats.rewardPoints, window.rewardGoal || 2000),
        prepareRingData('stat-attendance', parseFloat(stats.attendanceRate), 100),
        prepareRingData('stat-hours', stats.totalHoursBurned, 200)
    ];

    // Animation Function for a Single Ring
    // Animates from current DOM state to the target (instead of always from 0).
    const animateRing = (item) => {
        if (!item.ring) return;
        const duration = 1000;
        const startTime = performance.now();

        const startVal = item.valEl ? parseFloat(String(item.valEl.textContent).replace(/[^\d]/g, '')) || 0 : 0;
        const startPctStr = item.ring.style.getPropertyValue('--ring-pct') || '0%';
        const startPct = parseFloat(startPctStr) || 0;
        const diffVal = item.numVal - startVal;
        const diffPct = item.pct - startPct;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 4);

            const currentVal = startVal + (diffVal * easeProgress);
            const currentPct = startPct + (diffPct * easeProgress);

            if (item.valEl) item.valEl.textContent = Math.round(currentVal);
            item.ring.style.setProperty('--ring-pct', `${currentPct}%`);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                if (item.valEl) item.valEl.textContent = item.numVal;
                item.ring.style.setProperty('--ring-pct', `${item.pct}%`);
            }
        };
        requestAnimationFrame(step);
    };

    // 2. Global Theme Settings for Charts
    // Extract base computed styles from document to pass actual hex colors to the canvas.
    const rootStyle = getComputedStyle(document.body);
    const THEME = {
        primary: '#F15C05', // Fallback for Orange
        dark: 'transparent',
        text: '#A2A2A7',
        grid: '#2C2C30',
        surface: '#3A271B',
        fontFamily: "'Inter', sans-serif"
    };

    // Try to dynamically extract current CSS variable values (so chart matches the active Light/Dark theme overrides in charts.css)
    const updateThemeFromCSS = () => {
        const computed = getComputedStyle(document.getElementById('dashboardContainer') || document.body);
        const primaryColor = computed.getPropertyValue('--chart-ring-exercise').trim();
        const gridColor = computed.getPropertyValue('--chart-border').trim();
        const textColor = computed.getPropertyValue('--chart-text-secondary').trim();
        const surfaceColor = computed.getPropertyValue('--chart-surface').trim();
        
        if (primaryColor) THEME.primary = primaryColor;
        if (gridColor) THEME.grid = gridColor;
        if (textColor) THEME.text = textColor;
        if (surfaceColor) THEME.surface = surfaceColor;
    };
    updateThemeFromCSS();

    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = THEME.text;
        Chart.defaults.font.family = THEME.fontFamily;
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;
    } else {
        console.warn("charts.js: Chart.js library is not loaded. Charts will not render.");
    }

    // 3. Render Activity Chart (Line Chart synced with data.js)
    const activityCanvas = document.getElementById('activityChart');
    if (activityCanvas && typeof Chart !== 'undefined') {
        window.activityChart = new Chart(activityCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: data.activity_weekly.labels,
                datasets: [
                    {
                        label: 'Sessions',
                        data: data.activity_weekly.data, 
                        borderColor: THEME.primary,
                        borderWidth: 3,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: THEME.dark,
                        pointBorderColor: THEME.primary,
                        pointBorderWidth: 2,
                        fill: false
                    }
                ]
            },
            options: {
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: THEME.grid }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: THEME.text }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: THEME.surface,
                        titleColor: THEME.text,
                        bodyColor: THEME.primary,
                        titleFont: { family: THEME.fontFamily, size: 12, weight: 'normal' },
                        bodyFont: { family: THEME.fontFamily, size: 14, weight: 'bold' },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                        borderColor: THEME.grid,
                        borderWidth: 1,
                        caretPadding: 10,
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y + ' Sessions';
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                }
            }
        });
    }

    // 5. Intersection Observer to Trigger Animations on View
    // Ensures charts and rings only animate when the Analytics tab becomes visible.
    const wipView = document.getElementById('wip-view');
    let hasAnimated = false;
    
    if (wipView) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasAnimated) {
                    hasAnimated = true;

                    // Retrieve latest values from Overview elements
                    const pointsEl = document.getElementById('stat-points');
                    if (pointsEl) {
                        const numVal = parseInt(pointsEl.textContent.replace(/[^\d]/g, ''), 10) || 0;
                        const item = ringsData.find(d => d.ring && d.ring.id === 'stat-points-ring');
                        if (item) {
                            item.numVal = numVal;
                            item.pct = Math.min((numVal / (window.rewardGoal || 2000)) * 100, 100);
                        }
                    }

                    const sessionsEl = document.getElementById('stat-sessions');
                    if (sessionsEl) {
                        const numVal = parseInt(sessionsEl.textContent.replace(/[^\d]/g, ''), 10) || 0;
                        const item = ringsData.find(d => d.ring && d.ring.id === 'stat-sessions-ring');
                        if (item) {
                            item.numVal = numVal;
                            item.pct = Math.min((numVal / (window.sessionGoal || 200)) * 100, 100);
                        }
                    }

                    // Trigger Ring Animations
                    ringsData.forEach(animateRing);
                    
                    // Refresh theme colors
                    updateThemeFromCSS();
                    
                    // Trigger Line Chart Entrance Animation
                    if (window.activityChart) {
                        window.activityChart.data.datasets[0].borderColor = THEME.primary;
                        window.activityChart.data.datasets[0].pointBorderColor = THEME.primary;
                        window.activityChart.options.scales.x.ticks.color = THEME.text;
                        window.activityChart.options.scales.y.grid.color = THEME.grid;
                        window.activityChart.options.plugins.tooltip.backgroundColor = THEME.surface;
                        window.activityChart.options.plugins.tooltip.titleColor = THEME.text;
                        window.activityChart.options.plugins.tooltip.bodyColor = THEME.primary;
                        window.activityChart.options.plugins.tooltip.borderColor = THEME.grid;
                        window.activityChart.resize();
                        window.activityChart.reset();
                        window.activityChart.update();
                    }
                    
                    // Refresh Doughnut Chart when tab becomes visible (canvas had no size when hidden)
                    if (window.doughnutChart) {
                        window.doughnutChart.resize();
                        window.doughnutChart.reset();
                        window.doughnutChart.update();
                    }
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(wipView);
    }

    // --- Real-time Synchronization between Overview and Analytics tabs ---
    // Sets up MutationObservers to instantly reflect point and session changes in the Analytics tab.
    const syncRingWithOverview = (overviewId, valElId, ringId, goalKey, defaultGoal) => {
        const overviewEl = document.getElementById(overviewId);
        const valEl = document.getElementById(valElId);
        const ringEl = document.getElementById(ringId);
        if (!overviewEl || !valEl || !ringEl) return;

        let debounceTimeout = null;
        const observer = new MutationObserver(() => {
            if (debounceTimeout) clearTimeout(debounceTimeout);

            debounceTimeout = setTimeout(() => {
                const valStr = overviewEl.textContent || '0';
                const numVal = parseInt(valStr.replace(/[^\d]/g, ''), 10) || 0;
                const goal = window[goalKey] || defaultGoal;
                const pct = Math.min((numVal / goal) * 100, 100);

                // Update the ringsData so future entry animations use the correct target
                const item = ringsData.find(d => d.ring === ringEl);
                if (item) {
                    item.numVal = numVal;
                    item.pct = pct;
                }

                // If the entrance animation has already run, update the UI instantly
                if (hasAnimated) {
                    valEl.textContent = numVal.toLocaleString();
                    ringEl.style.setProperty('--ring-pct', `${pct}%`);
                }
            }, 50); // 50ms debounce ensures we wait until Overview's count-up animation stabilizes before repainting
        });

        observer.observe(overviewEl, { characterData: true, childList: true, subtree: true });
    };

    syncRingWithOverview('stat-points', 'stat-points-val', 'stat-points-ring', 'rewardGoal', 2000);
    syncRingWithOverview('stat-sessions', 'stat-sessions-val', 'stat-sessions-ring', 'sessionGoal', 200);
});


// ============================================================
// Student 8 - Donut Chart
// ============================================================

window.addEventListener('DOMContentLoaded', function () {

    var data = window.mockData.doughnut_weekly;
    var canvas = document.getElementById('doughnutChart');
    if (!canvas) return;

    // Read colours from charts.css so they work in both Light and Dark mode
    var themeEl = document.getElementById('dashboardContainer') || document.body;
    var style   = getComputedStyle(themeEl);
    var color1  = style.getPropertyValue('--chart-ring-exercise').trim();
    var color2  = style.getPropertyValue('--chart-ring-move').trim();
    var color3  = style.getPropertyValue('--chart-alert').trim();

    window.doughnutChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: [color1, color2, color3],
                borderWidth: 3,
                hoverOffset: 10
            }]
        },
        options: {
            cutout: '68%',
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 900 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (item) {
                            return item.label + ': ' + item.parsed + ' sessions';
                        }
                    }
                }
            }
        }
    });

    // Legend numbers
    document.getElementById('legend-used').textContent      = data.data[0];
    document.getElementById('legend-available').textContent = data.data[1];
    document.getElementById('legend-pending').textContent   = data.data[2];

});

// ============================================================
// Student 8 - Donut Chart ends here
// ============================================================
