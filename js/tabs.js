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

    /**
     * Switch view helper function
     * Hides all other views, displays target, and syncs active status
     * @param {string} targetId 
     */
    function switchTab(targetId) {
        if (!sections[targetId]) return;

        // Sync active class across all nav links pointing to this target
        tabButtons.forEach(btn => {
            if (btn.getAttribute('data-target') === targetId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Hide all views and show the targeted one
        Object.entries(sections).forEach(([id, section]) => {
            if (section) {
                if (id === targetId) {
                    // Respect the layout design of each view
                    if (id === 'dashboard-view') {
                        section.style.display = 'grid';
                    } else if (id === 'wip-view') {
                        section.style.display = 'flex';
                    } else {
                        section.style.display = 'block';
                    }
                } else {
                    section.style.display = 'none';
                }
            }
        });

        // Close the mobile menu if open
        const navLinksContainer = document.querySelector('.nav-links');
        if (window.innerWidth <= 1024 && navLinksContainer) {
            navLinksContainer.style.display = 'none';
        }

        // Trigger a window resize event to redraw/responsive-recalculate Charts
        window.dispatchEvent(new Event('resize'));
    }

    // 3. Register click event listener on each tab button
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = button.getAttribute('data-target');
            if (targetId) {
                switchTab(targetId);
            }
        });
    });
});
