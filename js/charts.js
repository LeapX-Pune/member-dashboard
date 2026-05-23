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

    // Goals: Sessions(50), Points(2000), Attendance(100), Hours(200)
    const ringsData = [
        prepareRingData('stat-sessions', stats.sessionsCount, 50),
        prepareRingData('stat-points', stats.rewardPoints, 2000),
        prepareRingData('stat-attendance', parseFloat(stats.attendanceRate), 100),
        prepareRingData('stat-hours', stats.totalHoursBurned, 200)
    ];

    // Animation Function for a Single Ring
    // Animates the number value from 0 to the target value, and the ring progress from 0% to the target percentage using a custom easing function.
    const animateRing = (item) => {
        if (!item.ring) return;
        const duration = 1000; // 1s duration
        const startTime = performance.now();
        
        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 4); // easeOutQuart
            
            const currentVal = (item.numVal * easeProgress);
            const currentPct = (item.pct * easeProgress);
            
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

    // 4. Expose Timeframe Update Function for Activity Chart
    window.updateActivityTimeframe = (timeframe) => {
        if (!window.activityChart) return;
        
        let targetData = null;
        if (timeframe === 'weekly') targetData = data.activity_weekly;
        else if (timeframe === 'monthly') targetData = data.activity_monthly;
        else if (timeframe === 'yearly') targetData = data.activity_yearly;
        
        if (targetData) {
            window.activityChart.data.labels = targetData.labels;
            window.activityChart.data.datasets[0].data = targetData.data;
            window.activityChart.update();
        }
    };

    // 5. Intersection Observer to Trigger Animations on View
    // Ensures charts and rings only animate when the Analytics tab becomes visible.
    const wipView = document.getElementById('wip-view');
    let hasAnimated = false;
    
    if (wipView) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasAnimated) {
                    hasAnimated = true;
                    // Trigger Ring Animations
                    ringsData.forEach(animateRing);
                    
                    // Trigger Line Chart Entrance Animation
                    if (window.activityChart) {
                        // Refresh theme colors just in case mode was toggled before tab opened
                        updateThemeFromCSS();
                        window.activityChart.data.datasets[0].borderColor = THEME.primary;
                        window.activityChart.data.datasets[0].pointBorderColor = THEME.primary;
                        window.activityChart.options.scales.x.ticks.color = THEME.text;
                        window.activityChart.options.scales.y.grid.color = THEME.grid;
                        
                        // Update tooltips to match new theme
                        window.activityChart.options.plugins.tooltip.backgroundColor = THEME.surface;
                        window.activityChart.options.plugins.tooltip.titleColor = THEME.text;
                        window.activityChart.options.plugins.tooltip.bodyColor = THEME.primary;
                        window.activityChart.options.plugins.tooltip.borderColor = THEME.grid;
                        
                        window.activityChart.reset();
                        window.activityChart.update();
                    }
                } else if (!entry.isIntersecting) {
                    // Reset so the animation replays every time the user visits the tab
                    hasAnimated = false;
                    
                    // Reset DOM state for rings
                    ringsData.forEach(item => {
                        if (item.ring) item.ring.style.setProperty('--ring-pct', '0%');
                        if (item.valEl) item.valEl.textContent = '0';
                    });
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(wipView);
    }
});


// ============================================================
// Student 8 - Donut Chart starts here
// ============================================================

window.addEventListener('DOMContentLoaded', function () {

    // Get the data from data.js
    var data = window.mockData.doughnut_weekly;

    // Show the numbers in the legend below the chart
    document.getElementById('legend-used').textContent      = data.data[0];
    document.getElementById('legend-available').textContent = data.data[1];
    document.getElementById('legend-pending').textContent   = data.data[2];

    // Get the canvas element
    var canvas = document.getElementById('doughnutChart');

    // Read colours from charts.css so they work in both Light and Dark mode
    // The same CSS variables are used by the ring cards at the top of Analytics
    var themeEl = document.getElementById('dashboardContainer') || document.body;
    var style   = getComputedStyle(themeEl);
    var color1  = style.getPropertyValue('--chart-ring-exercise').trim(); // Used Sessions
    var color2  = style.getPropertyValue('--chart-ring-move').trim();     // Available Sessions
    var color3  = style.getPropertyValue('--chart-alert').trim();         // Pending Approval

    // Draw the doughnut chart
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
            animation: {
                duration: 900
            },
            plugins: {
                legend: {
                    display: false   // we use our own HTML legend below the chart
                },
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

    // This function is called by Student 9's toggle buttons (Weekly / Monthly / Yearly)
    window.updateDoughnutTimeframe = function (timeframe) {

        // Pick the right data based on the button clicked
        var newData;
        if (timeframe === 'weekly') {
            newData = window.mockData.doughnut_weekly;
        } else if (timeframe === 'monthly') {
            newData = window.mockData.doughnut_monthly;
        } else if (timeframe === 'yearly') {
            newData = window.mockData.doughnut_yearly;
        }

        // Update the chart with the new data
        window.doughnutChart.data.labels           = newData.labels;
        window.doughnutChart.data.datasets[0].data = newData.data;
        window.doughnutChart.update();

        // Update the legend numbers too
        document.getElementById('legend-used').textContent      = newData.data[0];
        document.getElementById('legend-available').textContent = newData.data[1];
        document.getElementById('legend-pending').textContent   = newData.data[2];
    };

});

// ============================================================
// Student 8 - Donut Chart ends here
// ============================================================