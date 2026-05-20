/**
 * js/charts.js
 * Chart orchestration logic for the Member Dashboard.
 * Designed for a single active user.
 */

window.addEventListener('DOMContentLoaded', () => {
    // 1. Verify Data Exists
    if (!window.mockData) {
        console.warn("charts.js: window.mockData is not available.");
        return;
    }

    const data = window.mockData;

    // --- Dynamic DOM Hydration for Top & Mid Rows ---
    const stats = data.membershipStats;
    
    // Helper to update top ring cards
    const setCardData = (idPrefix, value, goal, colorStr) => {
        // Update top row card
        const ring = document.getElementById(idPrefix + '-ring');
        const valEl = document.getElementById(idPrefix + '-val');
        
        let numVal = parseFloat(value);
        let pct = Math.min((numVal / goal) * 100, 100);

        if (valEl) valEl.textContent = value;
        if (ring) {
            ring.style.setProperty('--ring-pct', `${pct}%`);
        }
    };

    // Goals: Sessions(50), Points(2000), Attendance(100), Hours(200)
    setCardData('stat-sessions', stats.sessionsCount, 50, '#39ff14');
    setCardData('stat-points', stats.rewardPoints, 2000, '#ffd700');
    setCardData('stat-attendance', parseFloat(stats.attendanceRate), 100, '#00f2fe');
    setCardData('stat-hours', stats.totalHoursBurned, 200, '#ff8a8a');


    // 2. Global Theme Settings for Charts
    const getThemeColors = () => {
        const isDark = document.getElementById('dashboardContainer')?.classList.contains('theme-dark');
        return {
            primary: '#39ff14', // Green
            primaryLight: 'rgba(57, 255, 20, 0.2)',
            secondary: '#00f2fe', // Cyan
            tertiary: '#ffd700', // Yellow
            dark: isDark ? '#1e1c1a' : '#ffffff',
            text: isDark ? '#a1a1aa' : '#71717a',
            grid: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            fontFamily: "'Inter', sans-serif"
        };
    };

    const initialTheme = getThemeColors();

    // Set Chart.js global defaults if library is loaded
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = initialTheme.text;
        Chart.defaults.font.family = initialTheme.fontFamily;
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
                        borderColor: initialTheme.primary,
                        borderWidth: 3,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: initialTheme.dark,
                        pointBorderColor: initialTheme.primary,
                        pointBorderWidth: 2,
                        fill: false
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: initialTheme.grid },
                        ticks: { color: initialTheme.text }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: initialTheme.text }
                    }
                },
                plugins: {
                    legend: { display: false }
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                }
            }
        });
    }

    // 4. MutationObserver to handle dynamic theme switching
    const container = document.getElementById('dashboardContainer');
    if (container && typeof Chart !== 'undefined' && window.activityChart) {
        const observer = new MutationObserver(() => {
            const colors = getThemeColors();
            
            // Update scales
            if (window.activityChart.options.scales.y) {
                if (window.activityChart.options.scales.y.grid) {
                    window.activityChart.options.scales.y.grid.color = colors.grid;
                }
                if (window.activityChart.options.scales.y.ticks) {
                    window.activityChart.options.scales.y.ticks.color = colors.text;
                }
            }
            if (window.activityChart.options.scales.x && window.activityChart.options.scales.x.ticks) {
                window.activityChart.options.scales.x.ticks.color = colors.text;
            }
            
            // Update datasets
            if (window.activityChart.data.datasets && window.activityChart.data.datasets[0]) {
                window.activityChart.data.datasets[0].pointBackgroundColor = colors.dark;
            }
            
            // Update defaults
            Chart.defaults.color = colors.text;
            
            window.activityChart.update();
        });
        observer.observe(container, { attributes: true, attributeFilter: ['class'] });
    }



    // 5. Expose Timeframe Update Function for Activity Chart
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
});