/**
 * FitPulse — Tab Switching Logic
 * Handles client-side switching between dashboard views:
 * Overview, Plans, Analytics (WIP), and Settings.
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Select all tab navigation links (sidebar and bottom-nav)
    const tabButtons = document.querySelectorAll('[data-target]');
    
    // 2. Map target IDs to their respective DOM element views
    const sections = {
        'dashboard-view': document.getElementById('dashboard-view'),
        'plans-view': document.getElementById('plans-view'),
        'settings-view': document.getElementById('settings-view'),
        'wip-view': document.getElementById('wip-view')
    };

    Object.entries(sections).forEach(([id, section]) => {
        if (!section) return;

        if (id === 'dashboard-view') {
            section.setAttribute('aria-hidden', 'false');
        } else {
            section.setAttribute('aria-hidden', 'true');
        }
    });

    /**
     * Switch view helper function
     * Hides all other views, displays target, and syncs active status
     * @param {string} targetId 
     */
    function switchTab(targetId) {
        if (!sections[targetId]) return;

        // Sync active class across all nav links pointing to this target
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.removeAttribute('aria-current');
        
            if (btn.dataset.target === targetId) {
                btn.classList.add('active');
                btn.setAttribute('aria-current', 'page');
            }
        });

        // Hide all views and show the targeted one
        Object.entries(sections).forEach(([id, section]) => {
            if (section) {
                if (id === targetId) {
                    section.setAttribute('aria-hidden', 'false');
                
                    if (id === 'dashboard-view') {
                        section.style.display = 'grid';
                    } else if (id === 'plans-view') {
                        section.style.display = 'grid';
                    } else if (id === 'wip-view') {
                        section.style.display = 'flex';
                    } else {
                        section.style.display = 'block';
                    }
                } else {
                    section.style.display = 'none';
                    section.setAttribute('aria-hidden', 'true');
                }
            }
        });

        // Trigger a window resize event to redraw/responsive-recalculate Charts
        window.dispatchEvent(new Event('resize'));

        if (targetId === 'wip-view') {
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
                // Re-render charts with latest dynamic data
                if (typeof window.getActivityData === 'function' && typeof window.switchLineChart === 'function') {
                    const activeLine = document.querySelector('#lineChartToggle .chart-toggle-btn.active');
                    window.switchLineChart(activeLine ? activeLine.getAttribute('data-period') : 'weekly');
                }
                if (typeof window.getDoughnutData === 'function' && typeof window.switchDoughnutChart === 'function') {
                    const activeDoughnut = document.querySelector('#doughnutChartToggle .chart-toggle-btn.active');
                    window.switchDoughnutChart(activeDoughnut ? activeDoughnut.getAttribute('data-period') : 'weekly');
                }
            }, 100);
        }
    }

    // 3. Register click event listener on each tab button
        tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();

            window.scrollTo(0, 0);

            const targetId = button.getAttribute('data-target');

            if (targetId) {
                switchTab(targetId);

                const sidebar = document.querySelector('.sidebar');

                    if (window.innerWidth <= 1024 && sidebar) {
                    sidebar.classList.remove('mobile-open');
                    document.body.classList.remove('sidebar-open');

                    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
                    const icon = mobileMenuBtn?.querySelector('i');

                    if (icon) {
                        icon.classList.add('fa-bars');
                        icon.classList.remove('fa-xmark');
                    }
                }
            }
        });
    });
}); 
