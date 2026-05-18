document.addEventListener('DOMContentLoaded', () => {

    // Mobile Menu Elements
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinksContainer = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links a');

    // Views
    const dashboardView = document.getElementById('dashboard-view');
    const plansView = document.getElementById('plans-view');
    const wipView = document.getElementById('wip-view');

    // Mobile Menu Toggle
    if (mobileMenuBtn) {

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
                dashboardView.style.display = 'grid';
                if (plansView) {
                    plansView.style.display = 'none';
                }
                wipView.style.display = 'none';
            }



            // Show Plans
            else if (targetView === 'plans-view') {
                dashboardView.style.display = 'none';
                if (plansView) {
                    plansView.style.display = 'block';
                }
                wipView.style.display = 'none';
            }



            // Show Working In Progress
            else {

                dashboardView.style.display = 'none';
                if (plansView) {
                    plansView.style.display = 'none';
                }
                wipView.style.display = 'flex';
            }

            // Close Mobile Menu
            if (window.innerWidth <= 1024) {

                navLinksContainer.style.display = 'none';
            }
        });
    });

    // Window Resize Handling
    window.addEventListener('resize', () => {

        if (window.innerWidth > 1024) {

            navLinksContainer.style.display = 'flex';
            navLinksContainer.style.flexDirection = 'row';
            navLinksContainer.style.position = 'static';
            navLinksContainer.style.backgroundColor = 'transparent';
            navLinksContainer.style.padding = '0';
            navLinksContainer.style.boxShadow = 'none';

        } else {
            navLinksContainer.style.display = 'none';
        }
    });

    // Quick Action Buttons
    const actionBtns = document.querySelectorAll('.action-btn');

    actionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const actionText = btn.querySelector('span').textContent;
            console.log(`Quick Action clicked: ${actionText}`);
        });
    });

    // Carousel Elements
    const track = document.getElementById("carouselTrack");

    // Check Carousel Exists
    if (track) {

        const slides = Array.from(track.children);
        const nextButton = document.getElementById("nextSlide");
        const prevButton = document.getElementById("prevSlide");
        const dotsNav = document.getElementById("carouselDots");
        const dots = Array.from(dotsNav.children);
        let currentIndex = 2;
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
            dots[currentIndex].classList.add("active");
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
        nextButton.addEventListener("click", () => {
            moveToNextSlide();
            resetAutoSlide();
        });

        // Previous Button
        prevButton.addEventListener("click", () => {
            moveToPrevSlide();
            resetAutoSlide();
        });

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