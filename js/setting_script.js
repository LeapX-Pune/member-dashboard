document.addEventListener('DOMContentLoaded', () => {

    const tabBtns = document.querySelectorAll('.setting-tabs .tab-btn');
    const tabContents = document.querySelectorAll('.setting-content .tab-content');

    // Tab Switching Logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active classes
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked button
            btn.classList.add('active');

            // Show corresponding content
            const tabId = btn.getAttribute('data-tab');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Theme Toggling Logic
    const themeRadios = document.querySelectorAll('.theme-radio');
    const dashboardContainer = document.getElementById('dashboardContainer');
    
    // System theme media query listener
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    function getStoredTheme() {
        try {
            return localStorage.getItem('fitpulse-theme') || 'light';
        } catch (error) {
            return 'light';
        }
    }

    function storeTheme(theme) {
        try {
            localStorage.setItem('fitpulse-theme', theme);
        } catch (error) {
            // Private browsing or file restrictions can block storage.
        }
    }
    
    function applyTheme(theme) {
        if (!dashboardContainer) return;
        
        if (theme === 'dark') {
            dashboardContainer.classList.add('theme-dark');
        } else if (theme === 'light') {
            dashboardContainer.classList.remove('theme-dark');
        } else if (theme === 'system') {
            if (systemPrefersDark.matches) {
                dashboardContainer.classList.add('theme-dark');
            } else {
                dashboardContainer.classList.remove('theme-dark');
            }
        }
        
        // Save preference when the browser allows persistent storage.
        storeTheme(theme);
    }

    // Add change listeners to radio buttons
    themeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            applyTheme(e.target.value);
        });
    });

    // Listen for system theme changes if "system" is selected
    const handleSystemThemeChange = () => {
        const currentTheme = getStoredTheme();
        if (currentTheme === 'system') {
            applyTheme('system');
        }
    };

    if (systemPrefersDark.addEventListener) {
        systemPrefersDark.addEventListener('change', handleSystemThemeChange);
    } else if (systemPrefersDark.addListener) {
        systemPrefersDark.addListener(handleSystemThemeChange);
    }

    // Load saved theme on startup
    const savedTheme = getStoredTheme();
    const savedRadio = document.querySelector(`.theme-radio[value="${savedTheme}"]`);
    if (savedRadio) savedRadio.checked = true;
    applyTheme(savedTheme);

    // Profile Form Save Logic
    const saveProfile = document.getElementById('saveProfile');
    if (saveProfile) {
        saveProfile.addEventListener('click', (e) => {
            e.preventDefault();
            saveProfile.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
            saveProfile.style.backgroundColor = '#10b981'; // Green color for success
            
            setTimeout(() => {
                saveProfile.innerHTML = 'Save Profile';
                saveProfile.style.backgroundColor = '';
            }, 2500);
        });
    }

});
