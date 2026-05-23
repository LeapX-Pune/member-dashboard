document.addEventListener('DOMContentLoaded', () => {

    // ----------- Login Overlay Logic -----------
    const loginOverlay = document.getElementById('login-overlay');
    const loginCloseBtn = document.getElementById('loginCloseBtn');
    const loginForm = document.getElementById('loginForm');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');

    const landingContainer = document.getElementById('landingContainer');
    const dashboardContainer = document.getElementById('dashboardContainer');
    let loginTimerId = null;

    // ── Session persistence: restore dashboard on page load/refresh ──
    const SESSION_KEY = 'fitpulse-session';
    function isSessionActive() {
        try { return !!JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return false; }
    }
    function persistSession() {
        // session data is written by profile.js; we just ensure the key exists
        if (!isSessionActive()) {
            try { localStorage.setItem(SESSION_KEY, JSON.stringify({ loggedInAt: Date.now() })); } catch { /* private mode */ }
        }
    }
    function destroySession() {
        try { localStorage.removeItem(SESSION_KEY); } catch { /* private mode */ }
    }

    // On every load, if session exists → skip login and go straight to dashboard
    if (isSessionActive()) {
        if (loginOverlay)        loginOverlay.style.display = 'none';
        if (landingContainer)    landingContainer.style.display = 'none';
        if (dashboardContainer)  dashboardContainer.style.display = 'flex';
    }

    // Placeholder links — only prevent default scroll-to-top, but do NOT
    // stop propagation so other listeners (tabs, logout modal, etc.) still fire.

    /**
     * Dismiss the login overlay and show the target container
     * @param {'landing' | 'dashboard'} target
     */
    function dismissLogin(target) {
        if (!loginOverlay) return;

        // Immediately hide — do NOT rely on animationend which can fail when
        // the tab is inactive or CSS animations are disabled.
        loginOverlay.style.display = 'none';
        loginOverlay.classList.add('hidden');

        if (target === 'landing' && landingContainer) {
            landingContainer.style.display = 'flex';
            if (dashboardContainer) dashboardContainer.style.display = 'none';
        } else if (target === 'dashboard' && dashboardContainer) {
            dashboardContainer.style.display = 'flex';
            if (landingContainer) landingContainer.style.display = 'none';
        }
    }

    // X Button — skip to Landing Page (blocked while sign-in is in progress)
        if (loginCloseBtn) {
            loginCloseBtn.addEventListener('click', () => {
            if (!loginSubmitBtn || !loginSubmitBtn.classList.contains('loading')) {
                dismissLogin('landing');
            }
            });
        }

    // Form submit — simulate login, then enter dashboard
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (loginSubmitBtn && loginSubmitBtn.classList.contains('loading')) {
                return;
            }

            const emailInput = document.getElementById('loginEmail');
            const passwordInput = document.getElementById('loginPassword');

            if (!emailInput || !passwordInput || !emailInput.value.trim() || !passwordInput.value.trim()) {
                alert('Please enter your email and password to access the dashboard.');
                return;
            }

            // Password Regex: Minimum 8 characters, at least 1 letter, 1 number, and 1 special character
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
            if (!passwordRegex.test(passwordInput.value)) {
                alert('Password must be at least 8 characters long and include a letter, a number, and a special character (@$!%*#?&).');
                return;
            }

            if (loginSubmitBtn) {
                loginSubmitBtn.classList.add('loading');
                loginSubmitBtn.disabled = true;
                loginSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing In…';
            }
            // Go to dashboard after 2 seconds
            loginTimerId = setTimeout(() => {
                if (loginSubmitBtn) {
                    loginSubmitBtn.disabled = false;
                    loginSubmitBtn.classList.remove('loading');
                }
                
                // Set default plan to Gold Premium on login
                if (window.mockData) {
                    window.mockData.userProfile.membershipPlan = "Gold Premium";
                    window.mockData.membershipStats.activePlan = "Gold Premium";
                    if (typeof window.renderActiveDashboard === 'function') {
                        window.renderActiveDashboard();
                    }
                }

                persistSession();       // ← save session so refresh keeps user in
                
                // Reset theme to light on every fresh login — the dashboard always
                // opens in light mode when user logs in with credentials.
                try { localStorage.removeItem('fitpulse-theme'); } catch { /* private mode */ }

                dismissLogin('dashboard');
                loginTimerId = null;
            }, 2000);
        });
    }

    // Open Login Overlay from Landing Page
    const openLoginBtn = document.getElementById('openLoginBtn');
    if (openLoginBtn) {
        openLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginOverlay) {
                if (loginTimerId) {
                    clearTimeout(loginTimerId);
                    loginTimerId = null;
                }

                loginOverlay.style.display = 'flex';
                loginOverlay.classList.remove('hidden');
                // Reset submit button state
                if (loginSubmitBtn) {
                    loginSubmitBtn.classList.remove('loading');
                    loginSubmitBtn.disabled = false;
                    loginSubmitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Dashboard';
                }
            }
        });
    }

    // Profile Dropdown Elements
    const userAvatar = document.getElementById('userAvatar');
    const profileDropdown = document.getElementById('profileDropdown');

    // Logout button references
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    const systemLogoutBtn  = document.querySelector('.logout-btn');

    // Logout confirmation modal logic
    const logoutModal      = document.getElementById('logoutModal');
    const logoutCancelBtn  = document.getElementById('logoutCancelBtn');
    const logoutProceedBtn = document.getElementById('logoutProceedBtn');

    function showLogoutModal(e) {
        if (e) e.preventDefault();
        if (logoutModal) logoutModal.style.display = 'flex';
    }

    function hideLogoutModal() {
        if (logoutModal) logoutModal.style.display = 'none';
    }

    function doLogout() {
        hideLogoutModal();
        destroySession();
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        if (landingContainer)   landingContainer.style.display   = 'flex';
        if (profileDropdown)    profileDropdown.style.display    = 'none';
    }

    // Cancel — close modal
    if (logoutCancelBtn) logoutCancelBtn.addEventListener('click', hideLogoutModal);
    // Click outside the card — cancel
    if (logoutModal) {
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) hideLogoutModal();
        });
    }
    // Proceed — actually log out
    if (logoutProceedBtn) logoutProceedBtn.addEventListener('click', doLogout);

    // Wire sidebar & settings logout buttons to show modal
    if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', showLogoutModal);
    if (systemLogoutBtn)  systemLogoutBtn.addEventListener('click',  showLogoutModal);


    // ----------- Dynamic Greeting Logic -----------
    const greetingText = document.getElementById('greetingText');
    const welcomeSubtext = document.querySelector('.welcome-subtext');
    function updateGreeting() {
        if (!greetingText) return;
        const currentHour = new Date().getHours();
        let greeting = 'Good Morning';
        let emoji = '🎉';
        let subMsg = "Ready for today's workout?";


        if (currentHour >= 5 && currentHour < 12) {
            greeting = 'Good Morning';
            emoji = '🎉';
            subMsg = "Ready for today's workout?";

        } else if (currentHour >= 12 && currentHour < 17) {
            greeting = 'Good Afternoon';
            emoji = '☀️';
            subMsg = "Let’s keep the momentum going.";

        } else if (currentHour >= 17 && currentHour < 21) {
            greeting = 'Good Evening';
            emoji = '🎉';
            subMsg = "Ready for your evening workout?";
        } else {
            greeting = 'Good Night';
            emoji = '🌙';
            subMsg = "Time to review your progress.";
        }

        // Non-breaking space used between words for styling, keep emoji inline
        greetingText.innerHTML = `${greeting.replace(' ', '&nbsp;')}&nbsp;${emoji}`;

        if (welcomeSubtext) {
            const welcomeNameEl = document.getElementById('welcomeName');
            const name = welcomeNameEl ? welcomeNameEl.textContent : 'User';
            welcomeSubtext.innerHTML = `Welcome back, <strong id="welcomeName">${name}</strong>. ${subMsg}`;
        }
    }

    // Call immediately and check every minute
    updateGreeting();
    setInterval(updateGreeting, 60000);
    // -----------


    // Mobile Menu Elements
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');

    // Mobile Menu Toggle
    const sidebar = document.querySelector('.sidebar');
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('mobile-open');
            document.body.classList.toggle('sidebar-open', sidebar.classList.contains('mobile-open'));
            
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                if (sidebar.classList.contains('mobile-open')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-xmark');
                } else {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('mobile-open') && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
                document.body.classList.remove('sidebar-open');
                
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }

    // Profile Dropdown Toggle
    if (userAvatar && profileDropdown) {
        userAvatar.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent immediate closing
            if (profileDropdown.style.display === 'none' || profileDropdown.style.display === '') {
                profileDropdown.style.display = 'block';
            } else {
                profileDropdown.style.display = 'none';
            }
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target) && e.target !== userAvatar) {
                profileDropdown.style.display = 'none';
            }
        });
    }

    // Notification Dropdown Toggle
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    
    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (notificationDropdown.style.display === 'none' || notificationDropdown.style.display === '') {
                notificationDropdown.style.display = 'block';
                // Hide notification dot when opened
                const dot = notificationBtn.querySelector('.notification-dot');
                if (dot) dot.style.display = 'none';
            } else {
                notificationDropdown.style.display = 'none';
            }
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!notificationDropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
                notificationDropdown.style.display = 'none';
            }
        });
    }

    // ── To-Do List Logic ──
    const todoAddBtn = document.getElementById('todoAddBtn');
    const todoNewInput = document.getElementById('todoNewInput');
    const todoListUl = document.getElementById('todoListUl');

    if (todoAddBtn && todoNewInput && todoListUl) {
        todoAddBtn.addEventListener('click', () => {
            const taskText = todoNewInput.value.trim();
            if (taskText) {
                const li = document.createElement('li');
                li.style.padding = '0.4rem 0';
                li.style.display = 'flex';
                li.style.alignItems = 'center';
                li.style.gap = '0.5rem';
                
                const uniqueId = 'todo' + Date.now();
                
                li.innerHTML = `
                    <input type="checkbox" id="${uniqueId}">
                    <label for="${uniqueId}" style="cursor: pointer; flex: 1;">${taskText}</label>
                    <i class="fa-solid fa-trash text-muted" style="cursor: pointer; font-size: 0.9rem;" onclick="this.parentElement.remove()" title="Delete"></i>
                `;
                
                todoListUl.appendChild(li);
                todoNewInput.value = ''; // clear input
                // scroll to bottom
                todoListUl.scrollTop = todoListUl.scrollHeight;
            }
        });

        // Add task on enter key
        todoNewInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                todoAddBtn.click();
            }
        });
    }

    // To-Do FAB Toggle
    const todoFabBtn = document.getElementById('todoFabBtn');
    const todoPanel = document.getElementById('todoPanel');
    
    if (todoFabBtn && todoPanel) {
        todoFabBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (todoPanel.style.display === 'none' || todoPanel.style.display === '') {
                todoPanel.style.display = 'block';
                todoFabBtn.style.transform = 'rotate(45deg)';
            } else {
                todoPanel.style.display = 'none';
                todoFabBtn.style.transform = 'rotate(0deg)';
            }
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!todoPanel.contains(e.target) && !todoFabBtn.contains(e.target)) {
                todoPanel.style.display = 'none';
                todoFabBtn.style.transform = 'rotate(0deg)';
            }
        });
    }

    // Dynamic Avatar Initials
    const navUserName = document.getElementById('navUserName');
    const navAvatarInitials = document.getElementById('navAvatarInitials');
    if (navUserName && navAvatarInitials) {
        const nameText = navUserName.textContent.trim();
        const words = nameText.split(' ').filter(w => w.length > 0);
        if (words.length > 0) {
            let initials = words[0].charAt(0).toUpperCase();
            if (words.length > 1) {
                initials += words[words.length - 1].charAt(0).toUpperCase();
            }
            navAvatarInitials.textContent = initials;
        }
    }

    // Duplicate Navigation Link Handling removed to let tabs.js act as source of truth

    // Carousel Elements
    const track = document.getElementById("carouselTrack");

    // Check Carousel Exists
    if (track) {

        const slides = Array.from(track.children);
        if (slides.length === 0) {
            // No slides — skip carousel setup safely without exiting the outer callback
        } else {

        const nextButton = document.getElementById("nextSlide");
        const prevButton = document.getElementById("prevSlide");
        const dotsNav = document.getElementById("carouselDots");
        const dots = dotsNav ? Array.from(dotsNav.children) : [];
        let currentIndex = Math.min(2, slides.length - 1);
        // Update Carousel
        function updateCarousel() {

            slides.forEach((slide, index) => {
                slide.classList.remove(
                    "prev-slide",
                    "current-slide",
                    "next-slide"
                );
                if (index === currentIndex) {

                    slide.classList.add("current-slide");
                }
                else if (
                    index === (currentIndex - 1 + slides.length) % slides.length
                ) {

                    slide.classList.add("prev-slide");
                }
                else if (
                    index === (currentIndex + 1) % slides.length
                ) {
                    slide.classList.add("next-slide");
                }
            });

            // Update Dots
            dots.forEach(dot => dot.classList.remove("active"));
            if (dots[currentIndex]) dots[currentIndex].classList.add("active");
        }

        // Next Slide
        function moveToNextSlide() {

            currentIndex++;
            if (currentIndex >= slides.length) {
                currentIndex = 0;
            }
            updateCarousel();
        }

        // Previous Slide
        function moveToPrevSlide() {

            currentIndex--;
            if (currentIndex < 0) {
                currentIndex = slides.length - 1;
            }
            updateCarousel();
        }

        // Next Button
        if (nextButton) {
            nextButton.addEventListener("click", () => {
                moveToNextSlide();
                resetAutoSlide();
            });
        }

        // Previous Button
        if (prevButton) {
            prevButton.addEventListener("click", () => {
                moveToPrevSlide();
                resetAutoSlide();
            });
        }

        // Dot Navigation
        dots.forEach(dot => {
            dot.addEventListener("click", (e) => {
                currentIndex = Number(e.target.dataset.index);
                updateCarousel();
                resetAutoSlide();
            });
        });

        // Auto Slide
        let autoSlide = setInterval(() => {
            moveToNextSlide();
        }, 3000);

        // Reset Auto Slide
        function resetAutoSlide() {
            clearInterval(autoSlide);
            autoSlide = setInterval(() => {
                moveToNextSlide();
            }, 3000);
        }

        // Initial Carousel Load
        updateCarousel();
        } // end else (slides.length > 0)
    }

    // ═══════════════════════════════════════════════════════
    // LIVE DASHBOARD UPDATES
    // ═══════════════════════════════════════════════════════

    // ── 1. Recent Activity — time labels refresh every 5 s ──
    (function initActivityTimestamps() {
        // Each item has an ordered set of labels to cycle through
        const activityItems = [
            { selector: '.activity-list .activity-item:nth-child(1) .act-time', labels: ['Just now', '1 min ago', '3 min ago', '5 min ago', '10 min ago', '15 min ago', '30 min ago', '1h ago'] },
            { selector: '.activity-list .activity-item:nth-child(2) .act-time', labels: ['2h ago', '3h ago', '4h ago', '5h ago', '6h ago', '8h ago', '10h ago', '12h ago'] },
            { selector: '.activity-list .activity-item:nth-child(3) .act-time', labels: ['5h ago', '6h ago', '8h ago', '10h ago', '12h ago', '16h ago', '20h ago', '1d ago'] },
        ];

        // Initialise index counters
        const indices = activityItems.map(() => 0);

        function tickActivityTimes() {
            activityItems.forEach((item, i) => {
                const el = document.querySelector(item.selector);
                if (!el) return;
                // Advance index
                indices[i] = (indices[i] + 1) % item.labels.length;
                // Animate: fade out → update → fade in
                el.style.transition = 'opacity 0.4s';
                el.style.opacity = '0';
                setTimeout(() => {
                    el.textContent = item.labels[indices[i]];
                    el.style.opacity = '1';
                }, 400);
            });
        }

        // Tick every 5 seconds
        setInterval(tickActivityTimes, 5000);
    })();


    // ── 2. Recent Workouts — rotate by day, calories tick every ~8 s ──
    (function initRecentWorkouts() {
        // Pool of workouts keyed by day-of-week (0=Sun … 6=Sat)
        // Each day has 3 workouts shown
        const workoutsByDay = {
            0: [ // Sunday
                { initials: 'YS', name: 'Yoga Session',      time: '07:00 AM', dur: '40 min', cal: 160, intensity: 'Low',    badge: 'low'    },
                { initials: 'MS', name: 'Meditation',        time: '08:00 AM', dur: '20 min', cal:  80, intensity: 'Low',    badge: 'low'    },
                { initials: 'SW', name: 'Swimming',          time: '10:00 AM', dur: '45 min', cal: 350, intensity: 'Medium', badge: 'medium' },
            ],
            1: [ // Monday
                { initials: 'MR', name: 'Morning Run',       time: '06:30 AM', dur: '45 min', cal: 420, intensity: 'High',   badge: 'high'   },
                { initials: 'ST', name: 'Strength Training', time: '06:00 PM', dur: '60 min', cal: 380, intensity: 'Medium', badge: 'medium' },
                { initials: 'YS', name: 'Yoga Session',      time: '08:00 PM', dur: '30 min', cal: 150, intensity: 'Low',    badge: 'low'    },
            ],
            2: [ // Tuesday
                { initials: 'HC', name: 'HIIT Cardio',       time: '06:00 AM', dur: '30 min', cal: 480, intensity: 'High',   badge: 'high'   },
                { initials: 'CS', name: 'Cycling Sprint',    time: '07:30 AM', dur: '40 min', cal: 390, intensity: 'High',   badge: 'high'   },
                { initials: 'SB', name: 'Stretching',        time: '07:00 PM', dur: '25 min', cal: 110, intensity: 'Low',    badge: 'low'    },
            ],
            3: [ // Wednesday
                { initials: 'PL', name: 'Pilates',           time: '07:00 AM', dur: '50 min', cal: 220, intensity: 'Medium', badge: 'medium' },
                { initials: 'BC', name: 'Boxing Class',      time: '05:30 PM', dur: '60 min', cal: 540, intensity: 'High',   badge: 'high'   },
                { initials: 'WA', name: 'Walk / Jog',        time: '07:30 PM', dur: '35 min', cal: 200, intensity: 'Low',    badge: 'low'    },
            ],
            4: [ // Thursday
                { initials: 'DL', name: 'Deadlifts',         time: '06:00 AM', dur: '55 min', cal: 460, intensity: 'High',   badge: 'high'   },
                { initials: 'SC', name: 'Spin Class',        time: '08:00 AM', dur: '45 min', cal: 410, intensity: 'High',   badge: 'high'   },
                { initials: 'YS', name: 'Yoga Session',      time: '07:00 PM', dur: '30 min', cal: 150, intensity: 'Low',    badge: 'low'    },
            ],
            5: [ // Friday
                { initials: 'MR', name: 'Morning Run',       time: '06:30 AM', dur: '50 min', cal: 450, intensity: 'High',   badge: 'high'   },
                { initials: 'ST', name: 'Strength Training', time: '12:00 PM', dur: '60 min', cal: 400, intensity: 'Medium', badge: 'medium' },
                { initials: 'ZM', name: 'Zumba',             time: '06:00 PM', dur: '50 min', cal: 320, intensity: 'Medium', badge: 'medium' },
            ],
            6: [ // Saturday
                { initials: 'HC', name: 'HIIT Cardio',       time: '07:00 AM', dur: '35 min', cal: 490, intensity: 'High',   badge: 'high'   },
                { initials: 'SW', name: 'Swimming',          time: '09:00 AM', dur: '60 min', cal: 380, intensity: 'Medium', badge: 'medium' },
                { initials: 'CB', name: 'CrossFit Basics',   time: '05:00 PM', dur: '50 min', cal: 510, intensity: 'High',   badge: 'high'   },
            ],
        };

        const workoutList = document.querySelector('.workout-list');
        if (!workoutList) return;

        // Current live cal values (will tick up)
        let liveCals = [];

        function renderWorkouts(day) {
            const workouts = workoutsByDay[day] || workoutsByDay[1];
            liveCals = workouts.map(w => w.cal);

            workoutList.innerHTML = workouts.map((w, i) => `
                <div class="workout-item">
                    <div class="workout-icon">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(w.initials)}&background=1e1c1a&color=fff&rounded=true&bold=true" alt="${w.name} icon">
                    </div>
                    <div class="workout-details">
                        <h4>${w.name}</h4>
                        <p>${w.time} &middot; ${w.dur}</p>
                    </div>
                    <div class="workout-stats">
                        <span class="cal" id="wCal${i}">${liveCals[i]} cal</span>
                        <span class="badge ${w.badge}">${w.intensity}</span>
                    </div>
                </div>
            `).join('');
        }

        // Initial render based on today's day
        const today = new Date().getDay();
        renderWorkouts(today);

        // Tick calorie numbers every 8 seconds (±5–15 cal variance per item)
        function tickCalories() {
            liveCals = liveCals.map((cal, i) => {
                const delta = Math.floor(Math.random() * 11) + 5; // 5–15
                const increase = Math.random() > 0.3; // 70% chance to go up
                const newCal = increase ? cal + delta : Math.max(cal - delta, 50);
                const el = document.getElementById(`wCal${i}`);
                if (el) {
                    el.style.transition = 'opacity 0.3s';
                    el.style.opacity = '0';
                    setTimeout(() => {
                        el.textContent = `${newCal} cal`;
                        el.style.opacity = '1';
                    }, 300);
                }
                return newCal;
            });
        }

        setInterval(tickCalories, 8000);

        // Schedule a midnight re-render (so workouts change by day without refresh)
        function scheduleNextDay() {
            const now = new Date();
            const msTillMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5).getTime() - now.getTime();
            setTimeout(() => {
                renderWorkouts(new Date().getDay());
                scheduleNextDay(); // schedule again for the next midnight
            }, msTillMidnight);
        }
        scheduleNextDay();
    })();


    // ── 3. Weekly Goal Progress — incremental live updates ──
    (function initWeeklyGoalProgress() {
        // Live state
        const goals = {
            steps:    { current: 68000, max: 70000, fillId: null,     textId: null     },
            workouts: { current: 9,     max: 14,    fillId: null,     textId: null     },
            water:    { current: 17.5,  max: 27.5,  fillId: null,     textId: null     },
        };

        // Get references to DOM elements
        const progressItems = document.querySelectorAll('.progress-item');
        if (progressItems.length < 3) return;

        // Assign IDs dynamically so we can target them
        const keys = ['steps', 'workouts', 'water'];
        progressItems.forEach((item, i) => {
            const key = keys[i];
            if (!key) return;
            const fill = item.querySelector('.progress-fill');
            const text = item.querySelector('.prog-text p');
            if (fill) { fill.id = `pgFill-${key}`; }
            if (text) { text.id = `pgText-${key}`; }
        });

        function formatGoalText(key) {
            const g = goals[key];
            if (key === 'steps')    return `${g.current.toLocaleString()} / ${g.max.toLocaleString()}`;
            if (key === 'workouts') return `${g.current} / ${g.max} sessions`;
            if (key === 'water')    return `${g.current.toFixed(1)}L / ${g.max}L`;
            return '';
        }

        function updateGoalUI(key) {
            const g = goals[key];
            const pct = Math.min(100, Math.round((g.current / g.max) * 100));
            const fill = document.getElementById(`pgFill-${key}`);
            const text = document.getElementById(`pgText-${key}`);
            if (fill) fill.style.width = `${pct}%`;
            if (text) {
                text.style.transition = 'opacity 0.3s';
                text.style.opacity = '0';
                setTimeout(() => {
                    text.textContent = formatGoalText(key);
                    text.style.opacity = '1';
                }, 300);
            }
        }

        // Steps: increment by 10–30 steps every ~25 s (realistic pedometer pace)
        function tickSteps() {
            if (goals.steps.current < goals.steps.max) {
                goals.steps.current = Math.min(goals.steps.current + Math.floor(Math.random() * 21) + 10, goals.steps.max);
                updateGoalUI('steps');
            }
        }
        setInterval(tickSteps, 25000);

        // Water: increment by 0.1–0.2 L every ~20 s
        function tickWater() {
            if (goals.water.current < goals.water.max) {
                const inc = parseFloat((Math.random() * 0.1 + 0.1).toFixed(1));
                goals.water.current = parseFloat(Math.min(goals.water.current + inc, goals.water.max).toFixed(1));
                updateGoalUI('water');
            }
        }
        setInterval(tickWater, 20000);

        // Workouts: increment by 1 every 60 s (one session takes time)
        function tickWorkouts() {
            if (goals.workouts.current < goals.workouts.max) {
                goals.workouts.current += 1;
                updateGoalUI('workouts');
            }
        }
        setInterval(tickWorkouts, 60000);

        // Initial render
        keys.forEach(k => updateGoalUI(k));
    })();


    // ----------- Payment Flow Logic -----------
    const planBtns = document.querySelectorAll('.plan-btn');
    const paymentModal = document.getElementById('paymentModal');
    const paymentQrCode = document.getElementById('paymentQrCode');
    const paymentSuccess = document.getElementById('paymentSuccess');
    const paymentTitle = document.getElementById('paymentTitle');
    let selectedPlanName = "";
    let paymentWaitingTimer = null;
    let paymentCloseTimer = null;

    function clearPaymentTimers() {
        if (paymentWaitingTimer) {
            clearTimeout(paymentWaitingTimer);
            paymentWaitingTimer = null;
        }
        if (paymentCloseTimer) {
            clearTimeout(paymentCloseTimer);
            paymentCloseTimer = null;
        }
    }

    function closePaymentModal() {
        if (!paymentModal || !paymentQrCode || !paymentSuccess || !paymentTitle) return;
        clearPaymentTimers();
        paymentModal.style.display = 'none';
        paymentQrCode.style.display = 'block';
        paymentSuccess.style.display = 'none';
        paymentTitle.textContent = 'Complete Payment';
    }
    
    if (planBtns.length > 0 && paymentModal && paymentQrCode && paymentSuccess && paymentTitle) {
        planBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const planCard = e.currentTarget.closest('.plan-card');
                if (planCard) {
                    const titleEl = planCard.querySelector('.plan-title');
                    selectedPlanName = titleEl ? titleEl.textContent : "New Plan";
                } else {
                    selectedPlanName = "New Plan";
                }

                clearPaymentTimers();

                // Show waiting payment state first
                paymentModal.style.display = 'flex';
                paymentQrCode.style.display = 'block';
                paymentSuccess.style.display = 'none';
                paymentTitle.textContent = `Complete Payment for ${selectedPlanName}`;
                
                // Then show success state
                paymentWaitingTimer = setTimeout(() => {
                    paymentQrCode.style.display = 'none';
                    paymentSuccess.style.display = 'block';
                    paymentTitle.textContent = "Payment Successful";
                    
                    if (window.mockData) {
                        window.mockData.userProfile.membershipPlan = selectedPlanName;
                        window.mockData.membershipStats.activePlan = selectedPlanName;
                        if (typeof window.renderActiveDashboard === 'function') {
                            window.renderActiveDashboard();
                        }
                    }
                    
                    paymentCloseTimer = setTimeout(() => {
                        closePaymentModal();
                    }, 2000);
                }, 5000);
            });
        });

        // Allow closing the modal by clicking outside the payment card
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) {
                closePaymentModal();
            }
        });
    }

});


// ============================================================
// Chart Toggle Logic — Weekly / Monthly / Yearly
// Separate controls for Line Chart and Doughnut Chart
// Uses destroy() + new Chart() on every switch as required
// ============================================================

// --- Helper: highlight the clicked button, dim the rest ---
function setActiveToggleBtn(groupId, period) {
    var group = document.getElementById(groupId);
    if (!group) return;

    // Loop through all buttons in this group
    var buttons = group.querySelectorAll('.chart-toggle-btn');
    buttons.forEach(function(btn) {
        if (btn.getAttribute('data-period') === period) {
            btn.classList.add('active');    // highlight selected button
        } else {
            btn.classList.remove('active'); // dim all other buttons
        }
    });
}

// --- Line Chart Toggle ---
// Destroys the old line chart and creates a fresh one with new period data
// Does NOT touch the doughnut chart at all
function switchLineChart(period) {
    console.log("Line chart switching to:", period);

    // Step 1: highlight the correct button
    setActiveToggleBtn('lineChartToggle', period);

    // Step 2: destroy the existing line chart before making a new one
    if (window.activityChart) {
        window.activityChart.destroy();
        window.activityChart = null;
    }

    // Step 3: pick the correct dataset from data.js based on period
    var lineData = window.mockData['activity_' + period];

    // Step 4: read theme colors the same way charts.js does
    var themeEl  = document.getElementById('dashboardContainer') || document.body;
    var style    = getComputedStyle(themeEl);
    var primary  = style.getPropertyValue('--chart-ring-exercise').trim() || '#F15C05';
    var gridCol  = style.getPropertyValue('--chart-border').trim()        || '#2C2C30';
    var textCol  = style.getPropertyValue('--chart-text-secondary').trim()|| '#A2A2A7';
    var surface  = style.getPropertyValue('--chart-surface').trim()       || '#3A271B';
    var fontFam  = "'Inter', sans-serif";

    // Step 5: get the canvas and draw a brand new line chart
    var lineCtx = document.getElementById('activityChart').getContext('2d');
    window.activityChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: lineData.labels,
            datasets: [{
                label: 'Sessions',
                data: lineData.data,
                borderColor: primary,
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: 'transparent',
                pointBorderColor: primary,
                pointBorderWidth: 2,
                fill: false
            }]
        },
        options: {
            animation: { duration: 1000, easing: 'easeOutQuart' },
            scales: {
                y: { beginAtZero: true, grid: { color: gridCol } },
                x: { grid: { display: false }, ticks: { color: textCol } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: surface,
                    titleColor: textCol,
                    bodyColor: primary,
                    titleFont: { family: fontFam, size: 12, weight: 'normal' },
                    bodyFont: { family: fontFam, size: 14, weight: 'bold' },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    borderColor: gridCol,
                    borderWidth: 1,
                    caretPadding: 10,
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + ' Sessions';
                        }
                    }
                }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}

// --- Doughnut Chart Toggle ---
// Destroys the old doughnut chart and creates a fresh one with new period data
// Does NOT touch the line chart at all
function switchDoughnutChart(period) {
    console.log("Doughnut chart switching to:", period);

    // Step 1: highlight the correct button
    setActiveToggleBtn('doughnutChartToggle', period);

    // Step 2: destroy the existing doughnut chart before making a new one
    if (window.doughnutChart) {
        window.doughnutChart.destroy();
        window.doughnutChart = null;
    }

    // Step 3: pick the correct dataset from data.js based on period
    var doughnutData = window.mockData['doughnut_' + period];

    // Step 4: read theme colors the same way charts.js does
    var themeEl = document.getElementById('dashboardContainer') || document.body;
    var style   = getComputedStyle(themeEl);
    var color1  = style.getPropertyValue('--chart-ring-exercise').trim(); // Used Sessions
    var color2  = style.getPropertyValue('--chart-ring-move').trim();     // Available Sessions
    var color3  = style.getPropertyValue('--chart-alert').trim();         // Pending Approval

    // Step 5: get the canvas and draw a brand new doughnut chart
    var doughnutCtx = document.getElementById('doughnutChart').getContext('2d');
    window.doughnutChart = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
            labels: doughnutData.labels,
            datasets: [{
                data: doughnutData.data,
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
                        label: function(item) {
                            return item.label + ': ' + item.parsed + ' sessions';
                        }
                    }
                }
            }
        }
    });

    // Step 6: update the HTML legend numbers below the doughnut chart
    document.getElementById('legend-used').textContent      = doughnutData.data[0];
    document.getElementById('legend-available').textContent = doughnutData.data[1];
    document.getElementById('legend-pending').textContent   = doughnutData.data[2];
}
