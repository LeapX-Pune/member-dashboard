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

    // Prevent reload/jump on Logout buttons (Sidebar and Profile Dropdown)
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    const profileLogoutBtn = document.querySelector('.profile-action-btn.text-danger');
    const systemLogoutBtn = document.querySelector('.logout-btn');

    function handleLogout(e) {
        e.preventDefault();
        // Go back to landing page
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        if (landingContainer) landingContainer.style.display = 'flex';
        if (profileDropdown) profileDropdown.style.display = 'none';
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
    const navLinksContainer = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links a');

    // Views
    const dashboardView = document.getElementById('dashboard-view');
    const plansView = document.getElementById('plans-view');
    const settingsView = document.getElementById('settings-view');
    const wipView = document.getElementById('wip-view');

    // Mobile Menu Toggle
    if (mobileMenuBtn && navLinksContainer) {

        mobileMenuBtn.addEventListener('click', () => {
            if (navLinksContainer.style.display === 'flex') {
                navLinksContainer.style.display = 'none';
            } else {

                navLinksContainer.style.display = 'flex';
                navLinksContainer.style.flexDirection = 'column';
                navLinksContainer.style.position = 'absolute';
                navLinksContainer.style.top = '70px';
                navLinksContainer.style.left = '0';
                navLinksContainer.style.right = '0';
                navLinksContainer.style.backgroundColor = 'var(--bg-card)';
                navLinksContainer.style.padding = '1rem';
                navLinksContainer.style.borderRadius = 'var(--radius-lg)';
                navLinksContainer.style.boxShadow = 'var(--shadow-md)';
                navLinksContainer.style.zIndex = '100';
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


    // Navigation Link Handling
    navLinks.forEach(link => {

        link.addEventListener('click', function (e) {

            e.preventDefault();

            // Remove Active Class
            navLinks.forEach(l => l.classList.remove('active'));

            // Add Active Class
            this.classList.add('active');

            // Target View
            const targetView = this.getAttribute('data-target');



            // Show Dashboard
            if (targetView === 'dashboard-view') {
                if (dashboardView) dashboardView.style.display = 'grid';
                if (plansView) plansView.style.display = 'none';
                if (settingsView) settingsView.style.display = 'none';
                if (wipView) wipView.style.display = 'none';
            }

            // Show Plans
            else if (targetView === 'plans-view') {
                if (dashboardView) dashboardView.style.display = 'none';
                if (plansView) plansView.style.display = 'block';
                if (settingsView) settingsView.style.display = 'none';
                if (wipView) wipView.style.display = 'none';
            }

            // Show Settings
            else if (targetView === 'settings-view') {
                if (dashboardView) dashboardView.style.display = 'none';
                if (plansView) plansView.style.display = 'none';
                if (settingsView) settingsView.style.display = 'block';
                if (wipView) wipView.style.display = 'none';
            }

            // Show Working In Progress
            else {
                if (dashboardView) dashboardView.style.display = 'none';
                if (plansView) plansView.style.display = 'none';
                if (settingsView) settingsView.style.display = 'none';
                if (wipView) wipView.style.display = 'flex';
            }

            // Close Mobile Menu
            if (window.innerWidth <= 1024) {

                if (navLinksContainer) navLinksContainer.style.display = 'none';
            }
        });
    });

    // Window Resize Handling
    window.addEventListener('resize', () => {
        if (!navLinksContainer) return;

        if (window.innerWidth > 1024) {

            navLinksContainer.removeAttribute('style');

        } else {
            if (navLinksContainer.style.display !== 'flex') {
                navLinksContainer.style.display = 'none';
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
