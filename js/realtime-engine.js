/**
 * realtime-engine.js — Premium live dashboard simulation
 * Vanilla JS · modular · no duplicate intervals
 */
'use strict';

(function () {
    const STORAGE_EXPIRY = 'fp_membership_expiry';
    const STORAGE_ACTIVITIES = 'fp_activities';
    const STORAGE_DAILY_ACTIVITY = 'fp_daily_activity';
    const STORAGE_PENDING_SESSIONS = 'fp_pending_sessions';
    const STORAGE_TOTAL_HOURS = 'fp_total_hours';
    const DEFAULT_SESSION_HOURS = 0.75;
    const POINTS_BONUS_DONE = 50;
    const SIM_MIN_MS = 2000;
    const SIM_MAX_MS = 3000;
    const RELATIVE_TICK_MS = 15000;
    const EXPIRY_CHECK_MS = 60000;
    const LIVE_EVENT_MIN_MS = 8000;
    const LIVE_EVENT_MAX_MS = 14000;

    const ACTIVITY_TEMPLATES = [
        { title: 'Reward Earned', sub: (n) => `+${25 + Math.floor(Math.random() * 40)} pts · ${n}`, avatar: { bg: 'd1fae5', color: '059669' } },
        { title: 'Membership Renewed', sub: (n) => `Pro Annual · ${n}`, avatar: { bg: 'e2e8f0', color: '475569' } },
        { title: 'Goal Completed', sub: () => 'Weekly step target reached', avatar: { bg: 'fce9d5', color: 'e8813a' } },
        { title: 'Calories Burned', sub: () => `${320 + Math.floor(Math.random() * 200)} cal logged`, avatar: { bg: '1e1c1a', color: 'fff' } },
        { title: 'Trainer Assigned', sub: (n) => `Coach assigned · ${n}`, avatar: { bg: 'dbeafe', color: '2563eb' } },
    ];

    const TRAINER_NAMES = ['Coach Alex', 'Sarah Jenkins', 'Marcus Iron', 'Priya Verma', 'Aarav Sharma'];

    let enginesStarted = false;
    let simTimeoutId = null;
    let relativeIntervalId = null;
    let expiryCheckIntervalId = null;
    let liveEventTimeoutId = null;
    let activityIdCounter = 0;
    let activities = [];
    let showAllActivities = false;

    const dashboardState = {
        streak: window.mockData?.membershipStats?.totalHoursBurned ? Math.floor(window.mockData.membershipStats.totalHoursBurned / 12) : 15,
        sessionsDone: window.mockData?.membershipStats?.sessionsCount || 80,
        totalSessions: window.mockData?.membershipStats?.sessionsCount || 80,
        rewardPoints: window.mockData?.membershipStats?.rewardPoints || 300,
        expiryDate: null,
        goals: {
            steps: 55000 + Math.floor(Math.random() * 15000),
            stepsMax: 70000 + Math.floor(Math.random() * 5000),
            workouts: 8 + Math.floor(Math.random() * 5),
            workoutsMax: 14 + Math.floor(Math.random() * 4),
            water: 15 + Math.round(Math.random() * 8 * 10) / 10,
            waterMax: 24 + Math.round(Math.random() * 6 * 10) / 10,
        },
    };

    let calendarView = { year: 0, month: 0 };
    let bookingCalView = { year: 0, month: 0 };
    let bookingSelectedDate = null;

    // ─── Utilities ───────────────────────────────────────────────────────────

    function getCurrentUserName() {
        const el = $('welcomeName');
        return el ? el.textContent.trim() : 'You';
    }

    function $(id) {
        return document.getElementById(id);
    }

    function toLocalDateStr(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function isDashboardActive() {
        const dash = $('dashboardContainer');
        if (!dash) return false;
        const display = window.getComputedStyle(dash).display;
        return display !== 'none';
    }

    function parseNumber(text) {
        if (!text) return 0;
        return parseInt(String(text).replace(/[^\d]/g, ''), 10) || 0;
    }

    function formatPoints(n) {
        return n.toLocaleString();
    }

    function randomBetween(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    function daysUntilDate(date) {
        const target = new Date(date);
        const now = new Date();
        target.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        return Math.round((target - now) / 86400000);
    }

    function formatExpiryDisplay(date) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function avatarUrl(name, bg, color) {
        const encoded = encodeURIComponent(name || 'Member');
        return `https://ui-avatars.com/api/?name=${encoded}&background=${bg}&color=${color}&rounded=true&bold=true`;
    }

    // ─── Required: calculateMembershipStatus ─────────────────────────────────

    function calculateMembershipStatus(expiryDate) {
        const days = daysUntilDate(expiryDate);
        let status;
        let color;
        if (days <= 0) {
            status = 'Expired';
            color = '#ef4444';
        } else if (days <= 30) {
            status = 'Expiring Soon';
            color = '#f59e0b';
        } else {
            status = 'Active';
            color = '#22c55e';
        }
        return { days, status, color };
    }

    // ─── Required: animateCounter ──────────────────────────────────────────────

    function animateCounter(el, from, to, duration, formatter) {
        if (!el) return;
        const start = performance.now();
        const diff = to - from;
        const fmt = formatter || ((v) => String(Math.round(v)));

        function step(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = fmt(from + diff * eased);
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    // ─── Required: animateCard ─────────────────────────────────────────────────

    function animateCard(el, className) {
        if (!el) return;
        const cls = className || 'fp-card-glow';
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
        setTimeout(() => el.classList.remove(cls), 900);
    }

    // ─── Required: updateDashboardStats ────────────────────────────────────────

    function updateDashboardStats(updates) {
        if (!updates) return;

        if (updates.streak != null) {
            dashboardState.streak = updates.streak;
            const el = $('heroStreak');
            if (el) {
                const prev = parseNumber(el.textContent);
                animateCounter(el, prev, updates.streak, 700);
            }
            animateCard($('heroStreakStat'), 'fp-stat-glow');
        }

        if (updates.sessionsDone != null) {
            dashboardState.sessionsDone = updates.sessionsDone;
            const el = $('heroSessions');
            if (el) {
                const prev = parseNumber(el.textContent);
                animateCounter(el, prev, updates.sessionsDone, 700);
            }
            animateCard($('heroSessionsStat'), 'fp-stat-glow');
        }

        if (updates.totalSessions != null) {
            dashboardState.totalSessions = updates.totalSessions;
            const el = $('stat-sessions');
            if (el) {
                const prev = parseNumber(el.textContent);
                animateCounter(el, prev, updates.totalSessions, 800);
                el.classList.add('live-update');
                setTimeout(() => el.classList.remove('live-update'), 600);
            }
        }

        if (updates.rewardPoints != null) {
            dashboardState.rewardPoints = updates.rewardPoints;
            const el = $('stat-points');
            if (el) {
                const prev = parseNumber(el.textContent);
                animateCounter(el, prev, updates.rewardPoints, 900, formatPoints);
                el.classList.add('live-update');
                setTimeout(() => el.classList.remove('live-update'), 600);
            }
        }

        if (updates.motivation) {
            const mot = $('heroMotivation');
            if (mot) {
                mot.textContent = updates.motivation;
                mot.classList.add('fp-motivation-flash');
                setTimeout(() => mot.classList.remove('fp-motivation-flash'), 2000);
            }
        }

        const hero = document.querySelector('.welcome-card');
        if (updates.pulseHero && hero) {
            hero.classList.add('fp-hero-pulse');
            setTimeout(() => hero.classList.remove('fp-hero-pulse'), 900);
        }
    }

    // ─── Required: updateRelativeTimes ─────────────────────────────────────────

    function formatRelativeTime(timestamp) {
        const diffSec = Math.floor((Date.now() - timestamp) / 1000);
        if (diffSec < 10) return 'just now';
        if (diffSec < 60) return `${diffSec} sec ago`;
        const mins = Math.floor(diffSec / 60);
        if (mins === 1) return '1 min ago';
        if (mins < 60) return `${mins} mins ago`;
        const hours = Math.floor(mins / 60);
        if (hours === 1) return '1h ago';
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return days === 1 ? '1d ago' : `${days}d ago`;
    }

    function updateRelativeTimes() {
        const list = $('activityList');
        if (!list) return;
        list.querySelectorAll('.activity-item[data-timestamp]').forEach((item) => {
            const ts = parseInt(item.dataset.timestamp, 10);
            const timeEl = item.querySelector('.act-time');
            if (timeEl && !Number.isNaN(ts)) {
                timeEl.textContent = formatRelativeTime(ts);
            }
        });
    }

    // ─── Persistence & view limit ───────────────────────────────────────────────

    function saveActivities() {
        try {
            localStorage.setItem(STORAGE_ACTIVITIES, JSON.stringify(activities));
        } catch (e) {}
    }

    function loadActivities() {
        try {
            const data = localStorage.getItem(STORAGE_ACTIVITIES);
            if (data) {
                activities = JSON.parse(data);
                return Array.isArray(activities) && activities.length > 0;
            }
        } catch (e) {}
        return false;
    }

    const DEFAULT_SHOW_COUNT = 4;

    function applyActivityLimit() {
        const list = $('activityList');
        if (!list) return;
        const items = list.querySelectorAll(':scope > .activity-item');
        items.forEach((item, i) => {
            item.style.display = (showAllActivities || i < DEFAULT_SHOW_COUNT) ? '' : 'none';
        });
        const btn = $('viewAllActivity');
        if (btn) {
            btn.style.display = items.length <= DEFAULT_SHOW_COUNT ? 'none' : '';
            btn.textContent = showAllActivities ? 'Show Less' : 'View All';
        }
    }

    function toggleActivityView() {
        const list = $('activityList');
        if (!showAllActivities) {
            if (list) {
                list.style.overflowY = 'auto';
                list.style.height = list.offsetHeight + 'px';
            }
            showAllActivities = true;
        } else {
            showAllActivities = false;
            if (list) {
                list.style.overflowY = '';
                list.style.height = '';
            }
        }
        applyActivityLimit();
    }

    // ─── Activity rendering (sorted) ─────────────────────────────────────────

    function createActivityElement(data) {
        const item = document.createElement('div');
        item.className = 'activity-item' + (data.completed ? ' is-completed' : '');
        item.dataset.activityId = data.id;
        item.dataset.timestamp = String(data.timestamp);
        item.dataset.name = data.name;
        if (data.bookable) item.dataset.bookable = 'true';

        const badgeHtml = data.bookable ? '' : `<span class="act-badge act-badge-live">Live</span>`;
        const doneHtml = data.bookable
            ? `<button type="button" class="act-done-btn${data.completed ? ' completed' : ''}" data-act-id="${data.id}" ${data.completed ? 'disabled' : ''}>${data.completed ? 'Completed ✓' : 'Done'}</button>`
            : '';

        item.innerHTML = `
            <img src="${avatarUrl(data.name, data.avatar.bg, data.avatar.color)}" alt="${data.name}" class="act-avatar">
            <div class="act-details">
                <h4>${data.title}</h4>
                <p>${data.subtitle}</p>
            </div>
            <div class="act-meta">
                ${badgeHtml}
                <span class="act-time">${formatRelativeTime(data.timestamp)}</span>
                ${doneHtml}
            </div>
        `;

        return item;
    }

    function renderActivities(newActivityId) {
        const list = $('activityList');
        if (!list) return;

        const currentUser = getCurrentUserName();
        const userActivities = activities.filter(a => a.name === currentUser);
        const userNewest = userActivities.length > 0
            ? userActivities.reduce((a, b) => (a.timestamp > b.timestamp ? a : b))
            : null;

        const sorted = [...activities].sort((a, b) => {
            const aIsTop = userNewest && a.id === userNewest.id;
            const bIsTop = userNewest && b.id === userNewest.id;
            if (aIsTop && !bIsTop) return -1;
            if (!aIsTop && bIsTop) return 1;
            return (b.timestamp || 0) - (a.timestamp || 0);
        });

        list.innerHTML = '';
        sorted.forEach(a => {
            const item = createActivityElement(a);
            list.appendChild(item);

            const btn = item.querySelector('.act-done-btn');
            if (btn && !a.completed) {
                btn.addEventListener('click', () => completeSession(a.id));
            }
        });

        if (newActivityId) {
            const el = list.querySelector(`[data-activity-id="${newActivityId}"]`);
            if (el) {
                el.classList.add('fp-slide-in');
                setTimeout(() => el.classList.remove('fp-slide-in'), 600);
            }
        }

        applyActivityLimit();
    }

    // ─── Required: addActivity ─────────────────────────────────────────────────

    function addActivity(options) {
        const list = $('activityList');
        if (!list) return null;

        const id = options.id || `act-${++activityIdCounter}`;

        const exists = activities.some(a => a.id === id);
        if (!exists) {
            activities.unshift({
                id,
                timestamp: options.timestamp || Date.now(),
                title: options.title || 'Activity',
                subtitle: options.subtitle || '',
                name: options.name || 'You',
                bookable: !!options.bookable,
                completed: !!options.completed,
                avatar: options.avatar || { bg: 'fce9d5', color: 'e8813a' },
                bookingDate: options.bookingDate || '',
            });
            saveActivities();
        }

        renderActivities(id);

        return list.querySelector(`[data-activity-id="${id}"]`);
    }

    // ─── Required: completeSession ───────────────────────────────────────────────

    function trackCompletedActivity() {
        const count = parseInt(localStorage.getItem('fp_completed_count') || '0', 10);
        localStorage.setItem('fp_completed_count', String(count + 1));
        if (count >= 5000) {
            console.info('[FitPulse] Completed activity count at 5000 — consider calling clearCompletedData() to reset.');
        }
    }

    function clearCompletedData() {
        localStorage.removeItem('fp_completed_count');
        console.info('[FitPulse] Completed activity data cleared.');
    }

    // ─── Dynamic chart data tracking ─────────────────────────────────────────

    function trackDailyActivity(date) {
        const dateStr = date ? toLocalDateStr(date) : toLocalDateStr(new Date());
        const data = JSON.parse(localStorage.getItem(STORAGE_DAILY_ACTIVITY) || '{}');
        data[dateStr] = (data[dateStr] || 0) + 1;
        try { localStorage.setItem(STORAGE_DAILY_ACTIVITY, JSON.stringify(data)); } catch (e) {}
    }

    function trackSessionHours() {
        const hours = parseFloat(localStorage.getItem(STORAGE_TOTAL_HOURS) || '142');
        localStorage.setItem(STORAGE_TOTAL_HOURS, String(Math.round((hours + DEFAULT_SESSION_HOURS) * 100) / 100));
    }

    function updatePendingCount(delta) {
        const current = parseInt(localStorage.getItem(STORAGE_PENDING_SESSIONS) || '0', 10);
        localStorage.setItem(STORAGE_PENDING_SESSIONS, String(Math.max(0, current + delta)));
    }

    /** Build line chart data for a given period, merging static baseline + dynamic daily activity */
    function getActivityData(period) {
        if (!window.mockData) return { labels: [], data: [] };
        const staticData = window.mockData['activity_' + period];
        if (!staticData) return { labels: [], data: [] };

        const labels = [...staticData.labels];
        const data = [...staticData.data];
        const daily = JSON.parse(localStorage.getItem(STORAGE_DAILY_ACTIVITY) || '{}');
        const today = new Date();

        if (period === 'weekly') {
            const dayIndex = (today.getDay() + 6) % 7;
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() - dayIndex + i);
                const dateStr = toLocalDateStr(date);
                if (daily[dateStr]) data[i] += daily[dateStr];
            }
        } else if (period === 'monthly') {
            const month = today.getMonth();
            const year = today.getFullYear();
            for (const [dateStr, count] of Object.entries(daily)) {
                const d = new Date(dateStr + 'T00:00:00');
                if (d.getFullYear() === year && d.getMonth() === month) {
                    data[Math.min(3, Math.floor((d.getDate() - 1) / 7))] += count;
                }
            }
        } else if (period === 'yearly') {
            const year = today.getFullYear();
            for (const [dateStr, count] of Object.entries(daily)) {
                const d = new Date(dateStr + 'T00:00:00');
                if (d.getFullYear() === year) {
                    data[d.getMonth()] += count;
                }
            }
        }

        return { labels, data };
    }

    /** Build doughnut chart data for a given period, merging static + dynamic */
    function getDoughnutData(period) {
        if (!window.mockData) return { labels: ["Used Sessions", "Available Sessions", "Pending Approval"], data: [0, 0, 0] };
        const staticData = window.mockData['doughnut_' + period];
        if (!staticData) return { labels: ["Used Sessions", "Available Sessions", "Pending Approval"], data: [0, 0, 0] };

        const labels = [...staticData.labels];
        const staticTotal = staticData.data.reduce((a, b) => a + b, 0);
        const pending = parseInt(localStorage.getItem(STORAGE_PENDING_SESSIONS) || '0', 10);
        const daily = JSON.parse(localStorage.getItem(STORAGE_DAILY_ACTIVITY) || '{}');
        const today = new Date();

        let dynamicUsed = 0;
        if (period === 'weekly') {
            const dayIndex = (today.getDay() + 6) % 7;
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() - dayIndex + i);
                dynamicUsed += daily[toLocalDateStr(date)] || 0;
            }
        } else if (period === 'monthly') {
            const month = today.getMonth();
            const year = today.getFullYear();
            for (const [dateStr, count] of Object.entries(daily)) {
                const d = new Date(dateStr + 'T00:00:00');
                if (d.getFullYear() === year && d.getMonth() === month) dynamicUsed += count;
            }
        } else if (period === 'yearly') {
            dynamicUsed = parseInt(localStorage.getItem('fp_total_sessions') || '0', 10);
        }

        const usedSessions = staticData.data[0] + dynamicUsed;
        const pendingSessions = pending;
        const adjustTotal = staticTotal + dynamicUsed;
        const availableSessions = Math.max(0, adjustTotal - usedSessions - pendingSessions);

        return { labels, data: [usedSessions, availableSessions, pendingSessions] };
    }

    function syncAnalyticsRings(sessions, points) {
        const updateRing = (valElId, ringId, value, goal) => {
            const valEl = document.getElementById(valElId);
            const ringEl = document.getElementById(ringId);
            if (!valEl || !ringEl) return;
            const prevVal = parseFloat(String(valEl.textContent).replace(/[^\d.]/g, '')) || 0;
            const prevPct = parseFloat(ringEl.style.getPropertyValue('--ring-pct')) || 0;
            const targetPct = Math.min((value / goal) * 100, 100);
            if (prevVal === value && Math.abs(prevPct - targetPct) < 0.5) return;
            animateCounter(valEl, prevVal, value, 700);
            animateRingPct(ringEl, prevPct, targetPct, 700);
        };

        function animateRingPct(el, from, to, duration) {
            const start = performance.now();
            const diff = to - from;
            function step(now) {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.style.setProperty('--ring-pct', `${from + diff * eased}%`);
                if (progress < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }

        updateRing('stat-sessions-val', 'stat-sessions-ring', sessions, window.sessionGoal || 200);
        updateRing('stat-points-val', 'stat-points-ring', points, window.rewardGoal || 2000);

        // Attendance ring — computed from completed / (completed + pending)
        const totalSessions = parseInt(localStorage.getItem('fp_total_sessions') || '0', 10);
        const pendingSessions = parseInt(localStorage.getItem(STORAGE_PENDING_SESSIONS) || '0', 10);
        const denom = totalSessions + pendingSessions;
        const attendancePct = denom > 0 ? Math.round((totalSessions / denom) * 100) : 0;
        updateRing('stat-attendance-val', 'stat-attendance-ring', attendancePct, 100);

        // Hours ring — accumulated session hours
        const totalHours = parseFloat(localStorage.getItem(STORAGE_TOTAL_HOURS) || '142');
        updateRing('stat-hours-val', 'stat-hours-ring', Math.round(totalHours), 200);
    }

    function completeSession(activityId) {
        const list = $('activityList');
        if (!list) return;

        const item = list.querySelector(`[data-activity-id="${activityId}"]`);
        if (!item || item.dataset.completed === 'true') return;

        item.dataset.completed = 'true';
        item.classList.add('is-completed');

        const badge = item.querySelector('.act-badge');
        if (badge) {
            badge.textContent = 'Completed';
            badge.className = 'act-badge act-badge-completed';
        }

        const btn = item.querySelector('.act-done-btn');
        if (btn) {
            btn.textContent = 'Completed ✓';
            btn.classList.add('completed');
            btn.disabled = true;
        }

        const idx = activities.findIndex(a => a.id === activityId);
        let completedBookingDate = null;
        if (idx !== -1) {
            activities[idx].completed = true;
            if (activities[idx].bookingDate) {
                completedBookingDate = new Date(activities[idx].bookingDate + 'T00:00:00');
            }
            saveActivities();
            // Decrement pending count if this was a bookable activity
            if (activities[idx].bookable) {
                updatePendingCount(-1);
            }
        }

        dashboardState.streak += 1;
        dashboardState.sessionsDone += 1;
        dashboardState.totalSessions += 1;
        dashboardState.rewardPoints += POINTS_BONUS_DONE;
        localStorage.setItem('fp_reward_points', String(dashboardState.rewardPoints));
        localStorage.setItem('fp_total_sessions', String(dashboardState.totalSessions));
        trackCompletedActivity();
        trackDailyActivity(completedBookingDate);
        trackSessionHours();

        updateDashboardStats({
            streak: dashboardState.streak,
            sessionsDone: dashboardState.sessionsDone,
            totalSessions: dashboardState.totalSessions,
            rewardPoints: dashboardState.rewardPoints,
            motivation: pickMotivation(),
            pulseHero: true,
        });

        animateCard($('stat-sessions')?.closest('.dark-card'));
        animateCard($('stat-points')?.closest('.dark-card'));

        syncAnalyticsRings(dashboardState.totalSessions, dashboardState.rewardPoints);

        emitDataUpdate();

        if (typeof window.bumpWorkoutCalories === 'function') {
            window.bumpWorkoutCalories(POINTS_BONUS_DONE);
        }

        if (typeof window.showToast === 'function') {
            window.showToast('Workout Completed', `+${POINTS_BONUS_DONE} bonus points · Streak increased!`, 'success');
        }
    }

    function pickMotivation() {
        const msgs = [
            'Workout Completed — great consistency!',
            'Streak increased — keep it up!',
            'You crushed that session!',
            'Amazing progress today!',
        ];
        return msgs[Math.floor(Math.random() * msgs.length)];
    }

    // ─── Booking flow ──────────────────────────────────────────────────────────

    function openBookingModal() {
        const overlay = $('bookingModalOverlay');
        if (!overlay) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        bookingSelectedDate = new Date(today);

        const dateEl = $('bookingDate');
        if (dateEl) {
            const dateStr = toLocalDateStr(today);
            dateEl.value = dateStr;
            dateEl.min = dateStr;
        }

        updateBookingDateDisplay();
        closeBookingCalendar();

        overlay.removeAttribute('hidden');
        requestAnimationFrame(() => overlay.classList.add('visible'));
        document.body.style.overflow = 'hidden';
    }

    function closeBookingModal() {
        const overlay = $('bookingModalOverlay');
        if (!overlay) return;
        closeBookingCalendar();
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
        setTimeout(() => overlay.setAttribute('hidden', ''), 350);
    }

    function showBookingSuccess(sessionType, trainer, timeStr, dateStr) {
        const overlay = $('bookingSuccessOverlay');
        const detail = $('bookingSuccessDetail');
        if (detail) {
            detail.textContent = dateStr
                ? `${sessionType} with ${trainer} on ${dateStr} at ${timeStr}`
                : `${sessionType} with ${trainer} at ${timeStr}`;
        }
        if (!overlay) return;

        overlay.removeAttribute('hidden');
        requestAnimationFrame(() => overlay.classList.add('visible'));

        setTimeout(() => {
            overlay.classList.remove('visible');
            setTimeout(() => overlay.setAttribute('hidden', ''), 400);
        }, 2200);
    }

    // ─── Mini calendar date picker ─────────────────────────────────────────────

    function initBookingDatePicker() {
        const toggle = $('bookingDateToggle');
        const calendar = $('bookingCalendar');
        if (!toggle || !calendar) return;

        const overlay = $('bookingModalOverlay');
        if (overlay && calendar.parentElement && !calendar.parentElement.classList.contains('fp-premium-overlay')) {
            overlay.insertBefore(calendar, overlay.firstChild);
        }

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (calendar.hidden) {
                openBookingCalendar();
            } else {
                closeBookingCalendar();
            }
        });

        document.addEventListener('click', (e) => {
            const wrap = e.target.closest('.fp-booking-date-wrap');
            const cal = e.target.closest('.fp-booking-calendar');
            if (!wrap && !cal) {
                closeBookingCalendar();
            }
        });

        $('bookingCalPrev')?.addEventListener('click', () => {
            bookingCalView.month -= 1;
            if (bookingCalView.month < 0) { bookingCalView.month = 11; bookingCalView.year -= 1; }
            renderBookingCalendar();
        });

        $('bookingCalNext')?.addEventListener('click', () => {
            bookingCalView.month += 1;
            if (bookingCalView.month > 11) { bookingCalView.month = 0; bookingCalView.year += 1; }
            renderBookingCalendar();
        });
    }

    function openBookingCalendar() {
        const cal = $('bookingCalendar');
        if (!cal) return;
        const date = bookingSelectedDate || new Date();
        bookingCalView.year = date.getFullYear();
        bookingCalView.month = date.getMonth();
        renderBookingCalendar();

        const isMobile = window.innerWidth <= 640;
        if (!isMobile) {
            const toggle = $('bookingDateToggle');
            if (toggle) {
                const rect = toggle.getBoundingClientRect();
                const calWidth = 300;
                let left = rect.right - calWidth;
                if (left < 8) left = 8;
                if (left + calWidth > window.innerWidth - 8) left = window.innerWidth - calWidth - 8;
                cal.style.top = (rect.bottom + 4) + 'px';
                cal.style.left = left + 'px';
            }
        }

        cal.hidden = false;
    }

    function closeBookingCalendar() {
        const cal = $('bookingCalendar');
        if (cal) cal.hidden = true;
    }

    function renderBookingCalendar() {
        const grid = $('bookingCalGrid');
        const label = $('bookingCalLabel');
        if (!grid || !label) return;

        const { year, month } = bookingCalView;
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        label.textContent = `${monthNames[month]} ${year}`;

        grid.innerHTML = '';
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sel = bookingSelectedDate ? new Date(bookingSelectedDate) : null;
        if (sel) sel.setHours(0, 0, 0, 0);

        for (let i = 0; i < firstDay; i++) {
            const pad = document.createElement('button');
            pad.type = 'button';
            pad.className = 'fp-cal-day other-month';
            pad.disabled = true;
            grid.appendChild(pad);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'fp-cal-day';
            btn.textContent = String(d);

            const isPast = date < today;
            if (isPast) {
                btn.disabled = true;
                btn.classList.add('other-month');
            }
            if (date.toDateString() === today.toDateString()) {
                btn.classList.add('today');
            }
            if (sel && date.toDateString() === sel.toDateString()) {
                btn.classList.add('selected');
            }

            if (!isPast) {
                btn.addEventListener('click', () => {
                    selectBookingDate(new Date(date));
                });
            }

            grid.appendChild(btn);
        }
    }

    function selectBookingDate(date) {
        bookingSelectedDate = new Date(date);
        bookingSelectedDate.setHours(0, 0, 0, 0);
        updateBookingDateDisplay();
        closeBookingCalendar();
    }

    function updateBookingDateDisplay() {
        const display = $('bookingDateDisplay');
        const hidden = $('bookingDate');
        if (!bookingSelectedDate) {
            if (display) display.value = '';
            return;
        }
        if (display) {
            display.value = bookingSelectedDate.toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            });
        }
        if (hidden) {
            hidden.value = toLocalDateStr(bookingSelectedDate);
        }
    }

    // ─── Shared data-update event ────────────────────────────────────────────
    function emitDataUpdate() {
        document.dispatchEvent(new CustomEvent('dashboard:data-updated'));
    }

    function confirmBooking() {
        const sessionType = $('bookingSessionType')?.value || 'Yoga Session';
        const trainer = $('bookingTrainer')?.value || 'Coach Alex';
        const dateVal = $('bookingDate')?.value;
        const timeVal = $('bookingTime')?.value || '08:00';

        if (!dateVal) {
            if (typeof window.showToast === 'function') {
                window.showToast('Incomplete', 'Please select a date for your session.', 'warning');
            }
            return;
        }

        const selectedDate = new Date(dateVal + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            if (typeof window.showToast === 'function') {
                window.showToast('Invalid Date', 'Please select today or a future date.', 'warning');
            }
            return;
        }

        const timeFormatted = formatTime12h(timeVal);
        const dateFormatted = bookingSelectedDate
            ? bookingSelectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
            : '';
        closeBookingModal();
        showBookingSuccess(sessionType, trainer, timeFormatted, dateFormatted);

        addActivity({
            title: 'Session Booked',
            subtitle: `${sessionType} · ${timeFormatted}`,
            name: $('welcomeName')?.textContent?.trim() || 'You',
            bookable: true,
            avatar: { bg: 'fce9d5', color: 'e8813a' },
            bookingDate: toLocalDateStr(bookingSelectedDate),
        });
        updatePendingCount(1);

        // Update ring metrics and notify chart layer
        syncAnalyticsRings(dashboardState.totalSessions, dashboardState.rewardPoints);
        emitDataUpdate();

        if (typeof window.showToast === 'function') {
            window.showToast('Session Booked', `${sessionType} confirmed.`, 'success');
        }
    }

    function formatTime12h(time24) {
        const [h, m] = time24.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hr = h % 12 || 12;
        return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
    }

    // ─── Expiry calendar ───────────────────────────────────────────────────────

    function openExpiryCalendar() {
        const overlay = $('expiryCalendarOverlay');
        if (!overlay) return;

        const base = dashboardState.expiryDate || defaultExpiryDate();
        calendarView.year = base.getFullYear();
        calendarView.month = base.getMonth();

        renderCalendar();
        overlay.removeAttribute('hidden');
        requestAnimationFrame(() => overlay.classList.add('visible'));
        document.body.style.overflow = 'hidden';
    }

    function closeExpiryCalendar() {
        const overlay = $('expiryCalendarOverlay');
        if (!overlay) return;
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
        setTimeout(() => overlay.setAttribute('hidden', ''), 350);
    }

    function defaultExpiryDate() {
        const stored = localStorage.getItem(STORAGE_EXPIRY);
        if (stored) {
            const d = new Date(stored + 'T00:00:00');
            if (!Number.isNaN(d.getTime())) return d;
        }
        if (window.mockData?.userProfile?.expiryDate) {
            const parsed = new Date(window.mockData.userProfile.expiryDate);
            if (!Number.isNaN(parsed.getTime())) return parsed;
        }
        const d = new Date();
        d.setDate(d.getDate() + 87);
        return d;
    }

    function renderCalendar() {
        const grid = $('calendarGrid');
        const label = $('calendarMonthLabel');
        if (!grid || !label) return;

        const { year, month } = calendarView;
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        label.textContent = `${monthNames[month]} ${year}`;

        grid.innerHTML = '';
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysPrev = new Date(year, month, 0).getDate();
        const selected = dashboardState.expiryDate;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < firstDay; i++) {
            const dayNum = daysPrev - firstDay + i + 1;
            grid.appendChild(createCalDay(dayNum, true, year, month - 1, selected, today));
        }
        for (let d = 1; d <= daysInMonth; d++) {
            grid.appendChild(createCalDay(d, false, year, month, selected, today));
        }
        const totalCells = firstDay + daysInMonth;
        const remainder = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remainder; i++) {
            grid.appendChild(createCalDay(i, true, year, month + 1, selected, today));
        }
    }

    function createCalDay(dayNum, otherMonth, year, month, selected, today) {
        const date = new Date(year, month, dayNum);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fp-cal-day';
        btn.textContent = String(dayNum);
        btn.setAttribute('role', 'gridcell');

        if (otherMonth) btn.classList.add('other-month');

        if (date.toDateString() === today.toDateString()) btn.classList.add('today');
        if (selected && date.toDateString() === selected.toDateString()) btn.classList.add('selected');

        btn.addEventListener('click', () => selectExpiryDate(new Date(date)));
        return btn;
    }

    function selectExpiryDate(date) {
        dashboardState.expiryDate = new Date(date);
        dashboardState.expiryDate.setHours(0, 0, 0, 0);
        localStorage.setItem(STORAGE_EXPIRY, dashboardState.expiryDate.toISOString().slice(0, 10));

        if (window.mockData?.userProfile) {
            window.mockData.userProfile.expiryDate = formatExpiryDisplay(dashboardState.expiryDate);
            const { status } = calculateMembershipStatus(dashboardState.expiryDate);
            window.mockData.userProfile.status = status;
        }

        applyExpiryToUI(true);
        renderCalendar();
        closeExpiryCalendar();

        if (typeof window.showToast === 'function') {
            const { status, days } = calculateMembershipStatus(dashboardState.expiryDate);
            window.showToast('Membership Updated', `${status} · ${days} days remaining`, status === 'Expired' ? 'error' : 'info');
        }
    }

    function applyExpiryToUI(animate) {
        const date = dashboardState.expiryDate || defaultExpiryDate();
        const { days, status, color } = calculateMembershipStatus(date);

        const daysEl = $('stat-expiry-days');
        const statusEl = $('membership-status');
        const dateEl = $('expiryDateDisplay');
        const card = $('expiryStatusCard');
        const planExpiry = $('stat-plan-expiry');

        if (daysEl) {
            if (days <= 0) daysEl.textContent = 'Expired';
            else daysEl.textContent = `${days} Day${days === 1 ? '' : 's'}`;
        }
        if (statusEl) {
            statusEl.textContent = status;
            statusEl.style.color = color;
        }
        if (dateEl) dateEl.textContent = formatExpiryDisplay(date);
        if (planExpiry) planExpiry.textContent = `Valid till ${formatExpiryDisplay(date)}`;

        if (card) {
            card.classList.remove('status-active', 'status-expiring', 'status-expired');
            if (status === 'Active') card.classList.add('status-active');
            else if (status === 'Expiring Soon') card.classList.add('status-expiring');
            else card.classList.add('status-expired');
            if (animate) animateCard(card, 'fp-card-glow');
        }
    }

    function runExpiryAutoCheck() {
        if (!dashboardState.expiryDate) return;
        const prev = calculateMembershipStatus(dashboardState.expiryDate).status;
        applyExpiryToUI(false);
        const next = calculateMembershipStatus(dashboardState.expiryDate).status;
        if (prev !== next && typeof window.showToast === 'function') {
            window.showToast('Membership Alert', `Status changed to ${next}`, next === 'Expired' ? 'error' : 'warning');
        }
    }

    // ─── Realtime simulation engine ────────────────────────────────────────────

    function tickRealtimeSimulation() {
        if (!isDashboardActive()) return;

        const roll = Math.random();
        if (roll < 0.30) {
            dashboardState.goals.steps = Math.min(dashboardState.goals.stepsMax, dashboardState.goals.steps + randomBetween(100, 800));
            updateGoalUI('steps');
        } else if (roll < 0.55) {
            dashboardState.goals.workouts = Math.min(dashboardState.goals.workoutsMax, dashboardState.goals.workouts + 1);
            updateGoalUI('workouts');
        } else if (roll < 0.75) {
            dashboardState.goals.water = Math.min(dashboardState.goals.waterMax, Math.round((dashboardState.goals.water + 0.3) * 10) / 10);
            updateGoalUI('water');
        } else if (roll < 0.90) {
            const cals = document.querySelectorAll('.workout-stats .cal');
            if (cals.length) {
                const cal = cals[randomBetween(0, cals.length - 1)];
                const val = parseNumber(cal.textContent) + randomBetween(5, 25);
                cal.textContent = `${val} cal`;
                cal.classList.add('live-update');
                setTimeout(() => cal.classList.remove('live-update'), 500);
            }
        } else if (Math.random() < 0.4) {
            dashboardState.streak += 1;
            updateDashboardStats({ streak: dashboardState.streak });
        }
    }

    function scheduleSimTick() {
        if (simTimeoutId) clearTimeout(simTimeoutId);
        simTimeoutId = setTimeout(() => {
            tickRealtimeSimulation();
            if (enginesStarted) scheduleSimTick();
        }, randomBetween(SIM_MIN_MS, SIM_MAX_MS));
    }

    function updateGoalUI(key) {
        const g = dashboardState.goals;
        if (key === 'steps') {
            const text = $('goalStepsText');
            const bar = $('goalStepsBar');
            const pct = Math.min(100, (g.steps / g.stepsMax) * 100);
            if (text) text.textContent = `${g.steps.toLocaleString()} / ${g.stepsMax.toLocaleString()}`;
            if (bar) { bar.style.width = `${pct}%`; bar.classList.add('fp-bar-animate'); }
        } else if (key === 'workouts') {
            const text = $('goalWorkoutsText');
            const bar = $('goalWorkoutsBar');
            const pct = Math.min(100, (g.workouts / g.workoutsMax) * 100);
            if (text) text.textContent = `${g.workouts} / ${g.workoutsMax} sessions`;
            if (bar) { bar.style.width = `${pct}%`; bar.classList.add('fp-bar-animate'); }
        } else if (key === 'water') {
            const text = $('goalWaterText');
            const bar = $('goalWaterBar');
            const pct = Math.min(100, (g.water / g.waterMax) * 100);
            if (text) text.textContent = `${g.water}L / ${g.waterMax}L`;
            if (bar) { bar.style.width = `${pct}%`; bar.classList.add('fp-bar-animate'); }
        }
    }

    function scheduleLiveActivityEvent() {
        if (liveEventTimeoutId) clearTimeout(liveEventTimeoutId);
        const delay = randomBetween(LIVE_EVENT_MIN_MS, LIVE_EVENT_MAX_MS);
        liveEventTimeoutId = setTimeout(() => {
            if (isDashboardActive()) injectRandomActivity();
            scheduleLiveActivityEvent();
        }, delay);
    }

    function injectRandomActivity() {
        const tpl = ACTIVITY_TEMPLATES[randomBetween(0, ACTIVITY_TEMPLATES.length - 1)];
        const name = TRAINER_NAMES[randomBetween(0, TRAINER_NAMES.length - 1)];
        addActivity({
            title: tpl.title,
            subtitle: typeof tpl.sub === 'function' ? tpl.sub(name) : tpl.sub,
            name,
            avatar: tpl.avatar,
            bookable: false,
        });
    }

    // ─── Seed & init ───────────────────────────────────────────────────────────

    function seedInitialActivities() {
        const now = Date.now();
        const seeds = [
            { title: 'Plan Renewed', subtitle: 'Pro Annual · Aarav Sharma', name: 'Aarav Sharma', offset: 2 * 3600000, avatar: { bg: 'e2e8f0', color: '475569' } },
            { title: 'Points Earned', subtitle: '+50 pts · Priya Verma', name: 'Priya Verma', offset: 5 * 3600000, avatar: { bg: 'd1fae5', color: '059669' } },
        ];
        seeds.forEach((s) => {
            activities.unshift({
                id: `act-${++activityIdCounter}`,
                timestamp: now - s.offset,
                title: s.title,
                subtitle: s.subtitle,
                name: s.name,
                bookable: false,
                completed: false,
                avatar: s.avatar,
            });
        });
        saveActivities();
        renderActivities();
    }

    function readInitialStats() {
        dashboardState.streak = parseNumber($('heroStreak')?.textContent) || 12;
        const persistedTotal = parseInt(localStorage.getItem('fp_total_sessions') || String(window.mockData?.membershipStats?.sessionsCount || 80), 10);
        dashboardState.sessionsDone = persistedTotal;
        dashboardState.totalSessions = persistedTotal;
        dashboardState.rewardPoints = parseInt(localStorage.getItem('fp_reward_points') || String(window.mockData?.membershipStats?.rewardPoints || 300), 10);
        dashboardState.expiryDate = defaultExpiryDate();
    }

    function bindEvents() {
        const actionBook = $('actionBook');
        if (actionBook) {
            actionBook.addEventListener('click', (e) => {
                e.preventDefault();
                actionBook.classList.add('btn-clicked');
                setTimeout(() => actionBook.classList.remove('btn-clicked'), 600);
                openBookingModal();
            });
        }

        $('bookingModalCloseBtn')?.addEventListener('click', closeBookingModal);
        $('bookingModalCancelBtn')?.addEventListener('click', closeBookingModal);
        $('bookingConfirmBtn')?.addEventListener('click', confirmBooking);

        $('bookingModalOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'bookingModalOverlay') closeBookingModal();
        });

        const expiryCard = $('expiryStatusCard');
        if (expiryCard) {
            expiryCard.addEventListener('click', openExpiryCalendar);
            expiryCard.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openExpiryCalendar();
                }
            });
        }

        $('expiryCalendarCloseBtn')?.addEventListener('click', closeExpiryCalendar);
        $('expiryCalendarOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'expiryCalendarOverlay') closeExpiryCalendar();
        });

        $('calendarPrevMonth')?.addEventListener('click', () => {
            calendarView.month -= 1;
            if (calendarView.month < 0) { calendarView.month = 11; calendarView.year -= 1; }
            renderCalendar();
        });
        $('calendarNextMonth')?.addEventListener('click', () => {
            calendarView.month += 1;
            if (calendarView.month > 11) { calendarView.month = 0; calendarView.year += 1; }
            renderCalendar();
        });

        $('viewAllActivity')?.addEventListener('click', (e) => {
            e.preventDefault();
            toggleActivityView();
        });

        initBookingDatePicker();

        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            const cal = $('bookingCalendar');
            if (cal && !cal.hidden) {
                closeBookingCalendar();
                return;
            }
            if ($('bookingModalOverlay')?.classList.contains('visible')) closeBookingModal();
            if ($('expiryCalendarOverlay')?.classList.contains('visible')) closeExpiryCalendar();
        });
    }

    function clearAllIntervals() {
        if (simTimeoutId) { clearTimeout(simTimeoutId); simTimeoutId = null; }
        if (relativeIntervalId) { clearInterval(relativeIntervalId); relativeIntervalId = null; }
        if (expiryCheckIntervalId) { clearInterval(expiryCheckIntervalId); expiryCheckIntervalId = null; }
        if (liveEventTimeoutId) { clearTimeout(liveEventTimeoutId); liveEventTimeoutId = null; }
    }

    function startEngines() {
        if (enginesStarted) return;
        if (!isDashboardActive()) return;
        enginesStarted = true;

        scheduleSimTick();
        relativeIntervalId = setInterval(updateRelativeTimes, RELATIVE_TICK_MS);
        expiryCheckIntervalId = setInterval(runExpiryAutoCheck, EXPIRY_CHECK_MS);
        scheduleLiveActivityEvent();
        updateRelativeTimes();
    }

    function init() {
        if (!$('dashboardContainer')) return;

        const hasPersisted = loadActivities();
        if (hasPersisted) {
            let maxId = 0;
            activities.forEach(a => {
                const n = parseInt(String(a.id).replace('act-', ''), 10);
                if (!isNaN(n) && n > maxId) maxId = n;
            });
            activityIdCounter = maxId;
            renderActivities();
        }

        readInitialStats();
        applyExpiryToUI(false);
        bindEvents();

        if (!hasPersisted) {
            seedInitialActivities();
        }

        const dash = $('dashboardContainer');
        const observer = new MutationObserver(() => {
            if (isDashboardActive()) startEngines();
        });
        if (dash) {
            observer.observe(dash, { attributes: true, attributeFilter: ['style'] });
        }

        if (isDashboardActive()) startEngines();

        window.addEventListener('beforeunload', clearAllIntervals);
    }

    // ─── Public API (required function names) ──────────────────────────────────

    window.openBookingModal = openBookingModal;
    window.confirmBooking = confirmBooking;
    window.addActivity = addActivity;
    window.updateRelativeTimes = updateRelativeTimes;
    window.completeSession = completeSession;
    window.updateDashboardStats = updateDashboardStats;
    window.clearCompletedData = clearCompletedData;
    window.openExpiryCalendar = openExpiryCalendar;
    window.renderCalendar = renderCalendar;
    window.selectExpiryDate = selectExpiryDate;
    window.calculateMembershipStatus = calculateMembershipStatus;
    window.animateCard = animateCard;
    window.animateCounter = animateCounter;
    window.syncAnalyticsRings = syncAnalyticsRings;
    window.getActivityData = getActivityData;
    window.getDoughnutData = getDoughnutData;
    window.emitDataUpdate = emitDataUpdate;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
