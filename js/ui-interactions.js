/**
 * ui-interactions.js — Handles all interactive UI elements previously defined inline
 * This keeps the HTML clean and separates presentation from logic.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ─── 1. TRAINERS CAROUSEL (Mobile Only) ──────────────────────────────────
    (function initTrainersCarousel() {
        const grid    = document.getElementById('trainersGrid');
        const prevBtn = document.getElementById('trainersPrev');
        const nextBtn = document.getElementById('trainersNext');
        const dots    = document.querySelectorAll('.trainers-dot');
        if (!grid || !prevBtn || !nextBtn) return;

        const cards   = grid.querySelectorAll('.trainer-card');
        let current   = 0;
        const total   = cards.length;

        function goTo(index) {
            current = (index + total) % total;
            // Only apply transform on mobile
            if (window.innerWidth <= 1024) {
                grid.style.transform = `translateX(-${current * 100}%)`;
            }
            dots.forEach((d, i) => d.classList.toggle('active', i === current));
        }

        prevBtn.addEventListener('click', () => goTo(current - 1));
        nextBtn.addEventListener('click', () => goTo(current + 1));

        dots.forEach(dot => {
            dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index, 10)));
        });

        // Touch swipe support
        let touchStartX = 0;
        grid.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
        grid.addEventListener('touchend', e => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
        }, { passive: true });

        // Reset transform on resize to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024) {
                grid.style.transform = '';
            } else {
                goTo(current);
            }
        });
    })();


    // ─── 2. SMOOTH SCROLLING NAVIGATION ─────────────────────────────────────
    const scrollLinks = document.querySelectorAll('a[href^="#"][data-scroll="true"], button[data-scroll-target]');
    scrollLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href')?.substring(1) || link.getAttribute('data-scroll-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });


    // ─── 3. SIMULATED ALERTS & TOASTS (Socials, Coming Soon) ────────────────
    const alertLinks = document.querySelectorAll('[data-alert]');
    alertLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const message = link.getAttribute('data-alert');
            // If it's a social link or coming soon, show alert. Alternatively, could use toast.
            alert(message);
        });
    });


    // ─── 4. LOGIN / JOIN NOW BUTTONS ────────────────────────────────────────
    const joinBtn = document.getElementById('joinNowBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            const loginBtn = document.getElementById('openLoginBtn');
            if (loginBtn) loginBtn.click();
        });
    }


    // ─── 5. DASHBOARD QUICK ACTIONS (Book, Schedule, Upgrade, Refer) ───────
    const actionBook = document.getElementById('actionBook');
    if (actionBook) {
        actionBook.addEventListener('click', () => {
            if (typeof showToast === 'function') showToast('✅ Session Booked', 'Your session has been successfully booked!', 'success');
            else alert('Session booked successfully!');
        });
    }

    const actionSchedule = document.getElementById('actionSchedule');
    const scheduleModal = document.getElementById('scheduleModalOverlay');
    if (actionSchedule && scheduleModal) {
        actionSchedule.addEventListener('click', () => {
            scheduleModal.classList.add('visible');
        });
    }

    // Schedule Modal Close Buttons
    const scheduleCloseBtns = document.querySelectorAll('.profile-modal-close, .modal-btn-save');
    scheduleCloseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (scheduleModal) scheduleModal.classList.remove('visible');
        });
    });

    const actionUpgrade = document.getElementById('actionUpgrade');
    if (actionUpgrade) {
        actionUpgrade.addEventListener('click', () => {
            const navPlans = document.getElementById('nav-plans');
            if (navPlans) navPlans.click();
        });
    }

    const actionRefer = document.getElementById('actionRefer');
    if (actionRefer) {
        actionRefer.addEventListener('click', () => {
            navigator.clipboard.writeText('https://fitpulse.gym/ref/member').then(() => {
                if (typeof showToast === 'function') showToast('📋 Link Copied', 'Referral link copied to clipboard!', 'info');
                else alert('Referral link copied to clipboard!');
            });
        });
    }


    // ─── 6. RECENT ACTIVITY 'VIEW ALL' ──────────────────────────────────────
    const viewAllBtn = document.getElementById('viewAllActivity');
    const moreActivity = document.getElementById('moreActivity');
    if (viewAllBtn && moreActivity) {
        viewAllBtn.addEventListener('click', () => {
            moreActivity.style.display = 'block';
            viewAllBtn.style.display = 'none';
        });
    }


    // ─── 7. TO-DO LIST DELETE (Event Delegation) ────────────────────────────
    const todoList = document.getElementById('todo-list');
    if (todoList) {
        todoList.addEventListener('click', (e) => {
            if (e.target.classList.contains('fa-trash') || e.target.closest('.fa-trash')) {
                const li = e.target.closest('li');
                if (li) li.remove();
            }
        });
    }


    // ─── 8. PROFILE SETTINGS EDIT BUTTON ────────────────────────────────────
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            const actualSettingsBtn = document.getElementById('settingsEditProfileBtn');
            if (actualSettingsBtn) actualSettingsBtn.click();
        });
    }

});
