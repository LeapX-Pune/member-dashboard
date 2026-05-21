document.addEventListener('DOMContentLoaded', () => {

    // ----------- Login Overlay Logic -----------
    const loginOverlay = document.getElementById('login-overlay');
    const loginCloseBtn = document.getElementById('loginCloseBtn');
    const loginForm = document.getElementById('loginForm');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');

    const landingContainer = document.getElementById('landingContainer');
    const dashboardContainer = document.getElementById('dashboardContainer');
    let loginTimerId = null;

    // Placeholder links should not change the hash, scroll to the top, or
    // appear like the page has refreshed.
    document.addEventListener('click', (e) => {
        const placeholderLink = e.target.closest('a[href="#"]');
        if (placeholderLink) {
            e.preventDefault();
        }
    });

    /**
     * Dismiss the login overlay and show the target container
     * @param {'landing' | 'dashboard'} target
     */
    function dismissLogin(target) {
        if (!loginOverlay) return;

        if (loginTimerId) {
            clearTimeout(loginTimerId);
            loginTimerId = null;
        }

        if (loginSubmitBtn) {
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.classList.remove('loading');
            loginSubmitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Dashboard';
        }

        if (target === 'dashboard' && loginForm) {
            loginForm.reset();
        }
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
                dismissLogin('landing');
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

            const sidebar = document.querySelector('.sidebar');
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const icon = mobileMenuBtn?.querySelector('i');

            // Reset Sidebar State
            if (sidebar) {
                sidebar.classList.remove('mobile-open');
            }

            document.body.classList.remove('sidebar-open');

            // Reset Hamburger Icon
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-xmark');
            }

            // Reset Login Form
            if (loginForm) {
                loginForm.reset();
            }

            // Open Login Overlay
            if (loginOverlay) {

                if (loginTimerId) {
                    clearTimeout(loginTimerId);
                    loginTimerId = null;
                }

                loginOverlay.style.display = 'flex';
                loginOverlay.classList.remove('hidden');

                // Reset Submit Button State
                if (loginSubmitBtn) {

                    loginSubmitBtn.classList.remove('loading');
                    loginSubmitBtn.disabled = false;

                    loginSubmitBtn.innerHTML =
                        '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Dashboard';
                }
            }
        });
    }

    // Profile Dropdown Elements
    const userAvatar = document.getElementById('userAvatar');
    const profileDropdown = document.getElementById('profileDropdown');

    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {

        notificationBtn.addEventListener('click', () => {
            console.log('Notification panel triggered.');
            notificationBtn.classList.add('notification-active');
            setTimeout(() => {
                notificationBtn.classList.remove('notification-active');
            }, 250);
        });
    }

    // Prevent reload/jump on Logout buttons (Sidebar and Profile Dropdown)
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    const profileLogoutBtn = document.querySelector('.profile-action-btn.text-danger');
    const systemLogoutBtn = document.querySelector('.logout-btn');

    function handleLogout(e) {
        e.preventDefault();

        if (dashboardContainer) dashboardContainer.style.display = 'none';
        if (landingContainer) landingContainer.style.display = 'flex';
        if (profileDropdown) profileDropdown.style.display = 'none';

        const sidebar = document.querySelector('.sidebar');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const icon = mobileMenuBtn?.querySelector('i');

        if (sidebar) {
            sidebar.classList.remove('mobile-open');
        }

        document.body.classList.remove('sidebar-open');

        if (icon) {
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-xmark');
        }
    }

    if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', handleLogout);
    if (profileLogoutBtn) profileLogoutBtn.addEventListener('click', handleLogout);
    if (systemLogoutBtn) systemLogoutBtn.addEventListener('click', handleLogout);


    // ----------- Dynamic Greeting Logic -----------
    const greetingText = document.getElementById('greetingText');
    function updateGreeting() {
        if (!greetingText) return;
        const currentHour = new Date().getHours();
        let greeting = 'Good Morning';

        if (currentHour >= 12 && currentHour < 17) {
            greeting = 'Good Afternoon';
        } else if (currentHour >= 17 || currentHour < 4) {
            greeting = 'Good Evening';
        }

        // Non-breaking space used between words for styling
        greetingText.innerHTML = `${greeting.replace(' ', '&nbsp;')}&nbsp;🎉`;
    }

    // Call immediately and check every minute
    updateGreeting();
    setInterval(updateGreeting, 60000);
    // -----------


    // Mobile Menu Elements
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    const navLinksContainer = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links a');

    // Views
    const dashboardView = document.getElementById('dashboard-view');
    const plansView = document.getElementById('plans-view');
    const settingsView = document.getElementById('settings-view');
    const wipView = document.getElementById('wip-view');

    // Mobile Sidebar Toggle
    if (mobileMenuBtn && sidebar) {

        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('mobile-open');
            document.body.classList.toggle('sidebar-open', sidebar.classList.contains('mobile-open'));

            const icon = mobileMenuBtn.querySelector('i');

            if (icon) {
                icon.classList.toggle('fa-bars', !sidebar.classList.contains('mobile-open'));
                icon.classList.toggle('fa-xmark', sidebar.classList.contains('mobile-open'));
            }
        });

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            const clickedInsideSidebar = sidebar.contains(e.target);
            const clickedMenuButton = mobileMenuBtn.contains(e.target);

            if (
                window.innerWidth <= 1024 &&
                sidebar.classList.contains('mobile-open') &&
                !clickedInsideSidebar &&
                !clickedMenuButton
            ) {
                sidebar.classList.remove('mobile-open');
                document.body.classList.remove('sidebar-open');

            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-xmark');
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
        
            const clickedInsideDropdown = profileDropdown.contains(e.target);
            const clickedAvatar = userAvatar.contains(e.target);
        
            if (!clickedInsideDropdown && !clickedAvatar) {
                profileDropdown.style.display = 'none';
            }
        });
    }


    // Window Resize Handling
        window.addEventListener('resize', () => {
        if (window.innerWidth > 1024 && sidebar) {
            sidebar.classList.remove('mobile-open');
            document.body.classList.remove('sidebar-open');

        const icon = mobileMenuBtn.querySelector('i');
        if (icon) {
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-xmark');
        }
        }
    });

    // Quick Action Buttons
    const actionBtns = document.querySelectorAll('.action-btn');

    actionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const actionText = btn.querySelector('span')?.textContent || 'Unknown action';
            console.log(`Quick Action clicked: ${actionText}`);
        });
    });

    // Carousel Elements
    const track = document.getElementById("carouselTrack");

    // Check Carousel Exists
    if (track) {

        const slides = Array.from(track.children);
        if (slides.length === 0) return;

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
    }

});
