/**
 * ui-interactions.js — Handles all interactive UI elements
 * Fully functional: toasts, schedule update modal, quick actions, todo, etc.
 */

/* ════════════════════════════════════════════════════════
   0. GLOBAL SHOW TOAST — available everywhere in the app
   ════════════════════════════════════════════════════════ */
window.showToast = function(title, message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const iconMap = {
        success: 'fa-solid fa-circle-check',
        info:    'fa-solid fa-circle-info',
        warning: 'fa-solid fa-triangle-exclamation',
        error:   'fa-solid fa-circle-xmark',
    };

    const toast = document.createElement('div');
    toast.className = `fp-toast ${type}`;
    toast.innerHTML = `
        <i class="${iconMap[type] || iconMap.info} fp-toast-icon"></i>
        <div class="fp-toast-body">
            <div class="fp-toast-title">${title}</div>
            <div class="fp-toast-msg">${message}</div>
        </div>
        <button class="fp-toast-close" aria-label="Dismiss"><i class="fa-solid fa-xmark"></i></button>
    `;

    container.appendChild(toast);

    function dismiss() {
        toast.classList.add('toast-out');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }

    toast.querySelector('.fp-toast-close').addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
};


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
            if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
        });
    });


    // ─── 3. SIMULATED ALERTS & TOASTS (Socials, Coming Soon) ────────────────
    const alertLinks = document.querySelectorAll('[data-alert]');
    alertLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const message = link.getAttribute('data-alert');
            showToast('FitPulse', message, 'info');
        });
    });


    // ─── 4. LANDING PAGE BUTTONS ─────────────────────────────────────────────
    // "Explore Plans" scroll button in hero
    const explorePlansBtn = document.querySelector('button[data-scroll-target="membershipTiers"]');
    if (explorePlansBtn) {
        explorePlansBtn.addEventListener('click', () => {
            const el = document.getElementById('membershipTiers');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        });
    }


    // ─── 5. DASHBOARD QUICK ACTIONS ──────────────────────────────────────────

    // ── 5a. Book Session ──
    const actionBook = document.getElementById('actionBook');
    if (actionBook) {
        actionBook.addEventListener('click', () => {
            actionBook.classList.add('btn-clicked');
            setTimeout(() => actionBook.classList.remove('btn-clicked'), 600);
            showToast('✅ Session Booked!', 'Your gym session has been successfully booked for today.', 'success');
        });
    }

    // ── 5b. Schedule Update Modal ──
    const actionSchedule  = document.getElementById('actionSchedule');
    const scheduleModal   = document.getElementById('scheduleModalOverlay');
    const scheduleClose   = document.getElementById('scheduleModalCloseBtn');
    const scheduleCancel  = document.getElementById('scheduleModalCancelBtn');
    const scheduleConfirm = document.getElementById('scheduleModalConfirmBtn');
    const scheduleDateEl  = document.getElementById('scheduleDate');

    // Set minimum date to today
    if (scheduleDateEl) {
        const today = new Date().toISOString().split('T')[0];
        scheduleDateEl.min = today;
        scheduleDateEl.value = today;
    }

    function openScheduleModal() {
        if (scheduleModal) scheduleModal.classList.add('visible');
    }

    function closeScheduleModal() {
        if (scheduleModal) scheduleModal.classList.remove('visible');
    }

    if (actionSchedule) {
        actionSchedule.addEventListener('click', () => {
            actionSchedule.classList.add('btn-clicked');
            setTimeout(() => actionSchedule.classList.remove('btn-clicked'), 600);
            openScheduleModal();
        });
    }

    if (scheduleClose)  scheduleClose.addEventListener('click', closeScheduleModal);
    if (scheduleCancel) scheduleCancel.addEventListener('click', closeScheduleModal);

    if (scheduleConfirm) {
        scheduleConfirm.addEventListener('click', () => {
            const dateVal    = scheduleDateEl ? scheduleDateEl.value : '';
            const sessionEl  = document.getElementById('scheduleSession');
            const sessionVal = sessionEl ? sessionEl.value : '';

            if (!dateVal || !sessionVal) {
                showToast('⚠️ Incomplete', 'Please select a date and session type before confirming.', 'warning');
                return;
            }

            // Format date nicely
            const dateObj  = new Date(dateVal + 'T00:00:00');
            const dateStr  = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

            closeScheduleModal();

            // Reset form
            if (sessionEl) sessionEl.value = '';
            const notesEl = document.getElementById('scheduleNotes');
            if (notesEl) notesEl.value = '';
            if (scheduleDateEl) {
                const today = new Date().toISOString().split('T')[0];
                scheduleDateEl.value = today;
            }

            showToast('📅 Update Scheduled!', `${sessionVal} confirmed for ${dateStr}.`, 'success', 5000);
        });
    }

    // Close schedule modal when clicking the backdrop
    if (scheduleModal) {
        scheduleModal.addEventListener('click', (e) => {
            if (e.target === scheduleModal) closeScheduleModal();
        });
    }

    // ── 5c. Upgrade Plan ──
    const actionUpgrade = document.getElementById('actionUpgrade');

    // Plans considered "top-tier" — no upgrade possible above these
    const TOP_TIER_PLANS = ['Elite Premium', 'Elite plan', 'Elite'];

    function getCurrentPlan() {
        // Try mockData first (most up-to-date after payment/login)
        if (window.mockData) {
            return (window.mockData.membershipStats?.activePlan || window.mockData.userProfile?.membershipPlan || '').trim();
        }
        // Fallback: read from the live DOM stat card
        const el = document.getElementById('stat-active-plan');
        return el ? el.textContent.trim() : '';
    }

    function isTopTierPlan(planName) {
        return TOP_TIER_PLANS.some(t => planName.toLowerCase().includes(t.toLowerCase()));
    }

    if (actionUpgrade) {
        actionUpgrade.addEventListener('click', () => {
            actionUpgrade.classList.add('btn-clicked');
            setTimeout(() => actionUpgrade.classList.remove('btn-clicked'), 600);

            const currentPlan = getCurrentPlan();

            if (isTopTierPlan(currentPlan)) {
                // User is already on the highest plan — show a premium toast
                showToast(
                    '🏆 You\'re Already at the Top!',
                    `You're on <strong>${currentPlan}</strong> — our best plan. Enjoy unlimited access to all features and premium benefits!`,
                    'success',
                    5000
                );
            } else {
                // Navigate to the Plans tab
                const navPlans = document.getElementById('nav-plans');
                if (navPlans) navPlans.click();
            }
        });
    }

    // ── 5d. Refer a Friend ──
    const actionRefer = document.getElementById('actionRefer');
    if (actionRefer) {
        actionRefer.addEventListener('click', () => {
            actionRefer.classList.add('btn-clicked');
            setTimeout(() => actionRefer.classList.remove('btn-clicked'), 600);

            const refLink = 'https://fitpulse.gym/ref/member';
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(refLink).then(() => {
                    showToast('📋 Link Copied!', 'Referral link copied to clipboard. Share it with friends!', 'info');
                }).catch(() => {
                    showToast('📋 Referral Link', refLink, 'info');
                });
            } else {
                showToast('📋 Referral Link', refLink, 'info');
            }
        });
    }


    // ─── 6. RECENT ACTIVITY 'VIEW ALL' ──────────────────────────────────────
    const viewAllBtn   = document.getElementById('viewAllActivity');
    const moreActivity = document.getElementById('moreActivity');
    if (viewAllBtn && moreActivity) {
        viewAllBtn.addEventListener('click', () => {
            moreActivity.style.display = 'block';
            viewAllBtn.style.display   = 'none';
        });
    }


    // ─── 7. TO-DO LIST DELETE (Event Delegation) ────────────────────────────
    const todoListUlEl = document.getElementById('todoListUl');
    if (todoListUlEl) {
        todoListUlEl.addEventListener('click', (e) => {
            // The trash icon is an <i> with classes "fa-solid fa-trash"
            const trashIcon = e.target.classList.contains('fa-trash')
                ? e.target
                : e.target.closest('i.fa-trash');
            if (trashIcon) {
                const li = trashIcon.closest('li');
                if (li) {
                    li.style.opacity = '0';
                    li.style.transition = 'opacity 0.2s';
                    setTimeout(() => li.remove(), 200);
                }
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

    // ─── 9. PROFILE MODAL CLOSE (close schedule modal too if open) ───────────
    // The profile modal close buttons also close the edit profile modal
    const editProfileModalClose = document.getElementById('profileModalCloseBtn');
    const editProfileOverlay    = document.getElementById('profileModalOverlay');
    const editProfileCancel     = document.getElementById('profileModalCancelBtn');

    function closeEditProfileModal() {
        if (editProfileOverlay) editProfileOverlay.classList.remove('visible');
    }

    if (editProfileModalClose) editProfileModalClose.addEventListener('click', closeEditProfileModal);
    if (editProfileCancel)     editProfileCancel.addEventListener('click', closeEditProfileModal);
    if (editProfileOverlay) {
        editProfileOverlay.addEventListener('click', (e) => {
            if (e.target === editProfileOverlay) closeEditProfileModal();
        });
    }


    // ─── 10. FORGOT PASSWORD HANDLER ────────────────────────────────────────
    const forgotLink = document.querySelector('.login-forgot');
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            const msg = forgotLink.getAttribute('data-alert') || 'Password reset link sent!';
            showToast('🔐 Password Reset', msg, 'info');
        });
    }


    // ─── 11. SOCIAL LOGIN BUTTONS ────────────────────────────────────────────
    const googleBtn = document.getElementById('googleLoginBtn');
    const appleBtn  = document.getElementById('appleLoginBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            showToast('Google Login', 'Social login is simulated in this demo. Please use email/password.', 'info');
        });
    }
    if (appleBtn) {
        appleBtn.addEventListener('click', () => {
            showToast('Apple Login', 'Social login is simulated in this demo. Please use email/password.', 'info');
        });
    }


    // ─── 12. SIGNUP LINK ────────────────────────────────────────────────────
    const signupLink = document.getElementById('signupLink');
    if (signupLink) {
        signupLink.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Coming Soon!', 'Sign-up page is under development. Login with any email for now.', 'info');
        });
    }

});
