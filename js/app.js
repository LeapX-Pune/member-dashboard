/**
 * app.js — FitPulse Member Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Business Rules:
 *   EXPIRY STATUS  → Computed from real calendar days remaining
 *                    > 7 days  = "Active"       (green)
 *                    1–7 days  = "Expiring Soon" (amber)
 *                    0 / past  = "Expired"       (red)
 *
 *   SESSIONS       → Max 2 sessions logged per calendar day (localStorage)
 *                    Simulated: 1 session auto-logged 8 s after page load,
 *                    second session 20 s after (if quota allows)
 *
 *   REWARD POINTS  → +75 pts per session attended
 *                    Persisted in localStorage across reloads
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const POINTS_PER_SESSION  = 75;   // pts awarded per workout session
const MAX_SESSIONS_PER_DAY = 2;   // hard cap: sessions that count per day
const STORAGE_KEY_DATE     = 'fp_sessions_date';
const STORAGE_KEY_TODAY    = 'fp_sessions_today';
const STORAGE_KEY_TOTAL    = 'fp_total_sessions';
const STORAGE_KEY_POINTS   = 'fp_reward_points';
const STORAGE_KEY_GOAL     = 'fp_reward_goal';

// ─── UTILS ───────────────────────────────────────────────────────────────────

/** Today's date string YYYY-MM-DD (used as localStorage key) */
function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Calculate calendar days remaining until a date string
 * e.g. "December 31, 2026"
 */
function daysUntil(dateStr) {
    const target = new Date(dateStr);
    const now    = new Date();
    // Zero-out time portions for a clean day diff
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.round((target - now) / 86_400_000);
}

/** Derive membership status from days remaining */
function statusFromDays(days) {
    if (days <= 0)  return 'Expired';
    if (days <= 7)  return 'Expiring Soon';
    return 'Active';
}

/** Map status → colour */
function colorForStatus(status) {
    return status === 'Active'         ? '#22c55e'
         : status === 'Expiring Soon'  ? '#f59e0b'
         : status === 'Expired'        ? '#ef4444'
         : '#6b7280';
}

/** Update a DOM element's text + status colour */
function renderStatus(el, status) {
    if (!el) return;
    el.textContent  = status;
    el.style.color  = colorForStatus(status);
    el.style.fontWeight = '600';
}

/** Animate a number element with a count-up from current → target */
function animateCount(el, from, to, duration = 800) {
    if (!el) return;
    const start   = performance.now();
    const diff    = to - from;
    const step    = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased   = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(from + diff * eased).toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
        }

/** Pulse-flash an element (CSS class) */
function flashEl(el) {
    if (!el) return;
    el.classList.remove('live-update');
    // Force reflow so re-adding the class restarts the animation
    void el.offsetWidth;
    el.classList.add('live-update');
    setTimeout(() => el.classList.remove('live-update'), 600);
}

// ─── STORAGE: Daily Session Tracking ─────────────────────────────────────────

function loadStorage() {
    const today = todayStr();
    const storedDate = localStorage.getItem(STORAGE_KEY_DATE);

    // Reset daily counter if it's a new day
    if (storedDate !== today) {
        localStorage.setItem(STORAGE_KEY_DATE,  today);
        localStorage.setItem(STORAGE_KEY_TODAY, '0');
    }

    return {
        today:  parseInt(localStorage.getItem(STORAGE_KEY_TODAY)  || '0', 10),
        total:  parseInt(localStorage.getItem(STORAGE_KEY_TOTAL)  || String(window.mockData?.membershipStats?.sessionsCount || 45), 10),
        points: parseInt(localStorage.getItem(STORAGE_KEY_POINTS) || String(window.mockData?.membershipStats?.rewardPoints  || 1200), 10),
        completedCount: parseInt(localStorage.getItem('fp_completed_count') || '0', 10),
    };
}

function saveStorage(state) {
    localStorage.setItem(STORAGE_KEY_TODAY,  String(state.today));
    localStorage.setItem(STORAGE_KEY_TOTAL,  String(state.total));
    localStorage.setItem(STORAGE_KEY_POINTS, String(state.points));
}

// ─── REWARD GOAL ──────────────────────────────────────────────────────────────

function loadGoal() {
    return parseInt(localStorage.getItem(STORAGE_KEY_GOAL) || '2000', 10);
}

function saveGoal(goal) {
    localStorage.setItem(STORAGE_KEY_GOAL, String(goal));
}

function updateGoalDisplay() {
    const goal = loadGoal();
    const ptsEl = document.getElementById('stat-points');
    const points = ptsEl ? parseInt(String(ptsEl.textContent).replace(/[^\d]/g, ''), 10) || 0 : 0;
    const isReached = points >= goal;

    window.rewardGoal = goal;

    const goalValEl = document.getElementById('stat-points-goal-val');
    const goalValAnalyticsEl = document.getElementById('stat-points-goal-val-analytics');
    if (goalValEl) goalValEl.textContent = goal.toLocaleString();
    if (goalValAnalyticsEl) goalValAnalyticsEl.textContent = goal.toLocaleString();

    const goalTextEl = document.getElementById('stat-points-goal-text');
    if (goalTextEl) {
        let badge = goalTextEl.querySelector('.goal-reached-badge');
        if (isReached && !badge) {
            badge = document.createElement('span');
            badge.className = 'goal-reached-badge';
            badge.textContent = ' ✓ Goal Reached!';
            goalTextEl.appendChild(badge);
        } else if (!isReached && badge) {
            badge.remove();
        }
    }

    const goalFooterEl = document.getElementById('stat-points-goal-analytics');
    if (goalFooterEl) {
        let badge = goalFooterEl.querySelector('.goal-reached-badge');
        if (isReached && !badge) {
            badge = document.createElement('span');
            badge.className = 'goal-reached-badge';
            badge.textContent = ' ✓ Reached!';
            goalFooterEl.appendChild(badge);
        } else if (!isReached && badge) {
            badge.remove();
        }
    }

    // Keep analytics ring percentage in sync with dynamic goal
    const ringEl = document.getElementById('stat-points-ring');
    const ringValEl = document.getElementById('stat-points-val');
    if (ringValEl && ringEl) {
        const pct = Math.min((points / goal) * 100, 100);
        ringValEl.textContent = points.toLocaleString();
        ringEl.style.setProperty('--ring-pct', `${pct}%`);
    }
}

window.increaseRewardGoal = function () {
    const currentGoal = loadGoal();
    const input = prompt(
        `Current goal: ${currentGoal.toLocaleString()} pts\nIncrease by how many points?`,
        '500'
    );
    if (input === null) return;
    const increment = parseInt(input, 10);
    if (isNaN(increment) || increment <= 0) {
        if (typeof window.showToast === 'function') {
            window.showToast('Invalid Amount', 'Please enter a positive number', 'error');
        }
        return;
    }
    const newGoal = currentGoal + increment;
    saveGoal(newGoal);
    updateGoalDisplay();
    if (typeof window.showToast === 'function') {
        window.showToast('Goal Updated', `Reward goal increased to ${newGoal.toLocaleString()} pts`, 'success');
    }
};

window.decreaseRewardGoal = function () {
    const currentGoal = loadGoal();
    const input = prompt(
        `Current goal: ${currentGoal.toLocaleString()} pts\nDecrease by how many points?`,
        '200'
    );
    if (input === null) return;
    const decrement = parseInt(input, 10);
    if (isNaN(decrement) || decrement <= 0) {
        if (typeof window.showToast === 'function') {
            window.showToast('Invalid Amount', 'Please enter a positive number', 'error');
        }
        return;
    }
    const newGoal = Math.max(1, currentGoal - decrement);
    if (newGoal === currentGoal) {
        if (typeof window.showToast === 'function') {
            window.showToast('Minimum Goal', 'Goal cannot go below 1', 'error');
        }
        return;
    }
    saveGoal(newGoal);
    updateGoalDisplay();
    if (typeof window.showToast === 'function') {
        window.showToast('Goal Updated', `Reward goal decreased to ${newGoal.toLocaleString()} pts`, 'success');
    }
};

// ─── SESSION GOAL ─────────────────────────────────────────────────────────────

function loadSessionGoal() {
    return parseInt(localStorage.getItem('fp_sessions_goal') || '200', 10);
}

function saveSessionGoal(goal) {
    localStorage.setItem('fp_sessions_goal', String(goal));
}

function updateSessionGoalDisplay() {
    const goal = loadSessionGoal();
    const sessEl = document.getElementById('stat-sessions');
    const count = sessEl ? parseInt(String(sessEl.textContent).replace(/[^\d]/g, ''), 10) || 0 : 0;
    const isReached = count >= goal;

    window.sessionGoal = goal;

    const goalValEl = document.getElementById('stat-sessions-goal-val');
    const goalValAnalyticsEl = document.getElementById('stat-sessions-goal-val-analytics');
    if (goalValEl) goalValEl.textContent = goal.toLocaleString();
    if (goalValAnalyticsEl) goalValAnalyticsEl.textContent = goal.toLocaleString();

    const goalTextEl = document.getElementById('stat-sessions-goal-text');
    if (goalTextEl) {
        let badge = goalTextEl.querySelector('.goal-reached-badge');
        if (isReached && !badge) {
            badge = document.createElement('span');
            badge.className = 'goal-reached-badge';
            badge.textContent = ' ✓ Goal Reached!';
            goalTextEl.appendChild(badge);
        } else if (!isReached && badge) {
            badge.remove();
        }
    }

    const goalFooterEl = document.getElementById('stat-sessions-goal-analytics');
    if (goalFooterEl) {
        let badge = goalFooterEl.querySelector('.goal-reached-badge');
        if (isReached && !badge) {
            badge = document.createElement('span');
            badge.className = 'goal-reached-badge';
            badge.textContent = ' ✓ Reached!';
            goalFooterEl.appendChild(badge);
        } else if (!isReached && badge) {
            badge.remove();
        }
    }

    // Keep analytics ring percentage in sync with dynamic goal
    const ringEl = document.getElementById('stat-sessions-ring');
    const ringValEl = document.getElementById('stat-sessions-val');
    if (ringValEl && ringEl) {
        const pct = Math.min((count / goal) * 100, 100);
        ringValEl.textContent = count.toLocaleString();
        ringEl.style.setProperty('--ring-pct', `${pct}%`);
    }
}

window.increaseSessionGoal = function () {
    const currentGoal = loadSessionGoal();
    const input = prompt(
        `Current session goal: ${currentGoal.toLocaleString()} sessions\nIncrease by how many?`,
        '100'
    );
    if (input === null) return;
    const increment = parseInt(input, 10);
    if (isNaN(increment) || increment <= 0) {
        if (typeof window.showToast === 'function') {
            window.showToast('Invalid Amount', 'Please enter a positive number', 'error');
        }
        return;
    }
    const newGoal = currentGoal + increment;
    saveSessionGoal(newGoal);
    updateSessionGoalDisplay();
    if (typeof window.showToast === 'function') {
        window.showToast('Goal Updated', `Session goal increased to ${newGoal.toLocaleString()} sessions`, 'success');
    }
};

window.decreaseSessionGoal = function () {
    const currentGoal = loadSessionGoal();
    const input = prompt(
        `Current session goal: ${currentGoal.toLocaleString()} sessions\nDecrease by how many?`,
        '50'
    );
    if (input === null) return;
    const decrement = parseInt(input, 10);
    if (isNaN(decrement) || decrement <= 0) {
        if (typeof window.showToast === 'function') {
            window.showToast('Invalid Amount', 'Please enter a positive number', 'error');
        }
        return;
    }
    const newGoal = Math.max(1, currentGoal - decrement);
    if (newGoal === currentGoal) {
        if (typeof window.showToast === 'function') {
            window.showToast('Minimum Goal', 'Goal cannot go below 1', 'error');
        }
        return;
    }
    saveSessionGoal(newGoal);
    updateSessionGoalDisplay();
    if (typeof window.showToast === 'function') {
        window.showToast('Goal Updated', `Session goal decreased to ${newGoal.toLocaleString()} sessions`, 'success');
    }
};

// ─── MANUAL ADD: Sessions ─────────────────────────────────────────────────────

window.addSessions = function () {
    if (!appState) return;
    const sessEl = document.getElementById('stat-sessions');
    const currentTotal = sessEl ? parseInt(String(sessEl.textContent).replace(/[^\d]/g, ''), 10) || 0 : appState.total;
    const input = prompt(
        `Current total sessions: ${currentTotal}\nAdd how many sessions?`,
        '5'
    );
    if (input === null) return;
    const increment = parseInt(input, 10);
    if (isNaN(increment) || increment <= 0) {
        if (typeof window.showToast === 'function') {
            window.showToast('Invalid Amount', 'Please enter a positive number', 'error');
        }
        return;
    }
    const newTotal = currentTotal + increment;
    appState.total = newTotal;
    saveStorage(appState);

    if (typeof window.updateDashboardStats === 'function') {
        window.updateDashboardStats({
            totalSessions: newTotal,
            sessionsDone: newTotal,
        });
    }

    if (typeof window.syncAnalyticsRings === 'function') {
        window.syncAnalyticsRings(newTotal, appState.points);
    }

    if (sessEl) flashEl(sessEl);
    updateSessionGoalDisplay();
    if (typeof window.showToast === 'function') {
        window.showToast('Sessions Added', `+${increment} sessions logged`, 'success');
    }
};

// ─── MANUAL ADD: Reward Points ────────────────────────────────────────────────

window.addPointsManually = function () {
    if (!appState) return;
    const ptsEl = document.getElementById('stat-points');
    const currentPoints = ptsEl ? parseInt(String(ptsEl.textContent).replace(/[^\d]/g, ''), 10) || 0 : appState.points;
    const input = prompt(
        `Current reward points: ${currentPoints.toLocaleString()}\nAdd how many points?`,
        '100'
    );
    if (input === null) return;
    const increment = parseInt(input, 10);
    if (isNaN(increment) || increment <= 0) {
        if (typeof window.showToast === 'function') {
            window.showToast('Invalid Amount', 'Please enter a positive number', 'error');
        }
        return;
    }
    const newPoints = currentPoints + increment;
    appState.points = newPoints;
    saveStorage(appState);

    if (typeof window.updateDashboardStats === 'function') {
        window.updateDashboardStats({ rewardPoints: newPoints });
    }

    if (typeof window.syncAnalyticsRings === 'function') {
        window.syncAnalyticsRings(appState.total, newPoints);
    }

    if (ptsEl) flashEl(ptsEl);
    updateGoalDisplay();
    if (typeof window.showToast === 'function') {
        window.showToast('Points Added', `+${increment} reward points`, 'success');
    }
};

// ─── SESSION LOGGING ──────────────────────────────────────────────────────────

let appState = null; // loaded on DOMContentLoaded

/**
 * Attempt to log 1 session.
 * Returns true if session was accepted, false if daily quota already met.
 */
function logSession() {
    if (!appState) return false;
    if (appState.today >= MAX_SESSIONS_PER_DAY) {
        console.info('[FitPulse] Daily session quota reached — no more updates today.');
        return false;
    }

    const prevTotal  = appState.total;
    const prevPoints = appState.points;

    appState.today  += 1;
    appState.total  += 1;
    appState.points += POINTS_PER_SESSION;

    saveStorage(appState);

    // ── Update Sessions card ──────────────────────────────────────────────
    const sessEl = document.getElementById('stat-sessions');
    const sessValEl = document.getElementById('stat-sessions-val');
    animateCount(sessEl,    prevTotal,  appState.total,  900);
    animateCount(sessValEl, prevTotal,  appState.total,  900);
    if (sessEl) flashEl(sessEl);

    // ── Update Points card ────────────────────────────────────────────────
    const ptsEl = document.getElementById('stat-points');
    const ptsValEl = document.getElementById('stat-points-val');
    animateCount(ptsEl,    prevPoints, appState.points, 1200);
    animateCount(ptsValEl, prevPoints, appState.points, 1200);
    if (ptsEl) flashEl(ptsEl);
    updateGoalDisplay();

    // ── Show a discreet toast notification ───────────────────────────────
    if (typeof window.showToast === 'function') {
        window.showToast(
            'Session Logged',
            `+${POINTS_PER_SESSION} pts earned · ${MAX_SESSIONS_PER_DAY - appState.today} session${MAX_SESSIONS_PER_DAY - appState.today !== 1 ? 's' : ''} remaining today`,
            'success'
        );
    }

    console.info(`[FitPulse] Session logged — today: ${appState.today}/${MAX_SESSIONS_PER_DAY}, total: ${appState.total}, points: ${appState.points}`);
    return true;
}

// ─── EXPIRY CARD RENDERER ─────────────────────────────────────────────────────

function renderExpiryCard(expiryDateStr) {
    const days   = daysUntil(expiryDateStr);
    const status = statusFromDays(days);

    const daysEl   = document.getElementById('stat-expiry-days');
    const statusEl = document.getElementById('membership-status');

    if (daysEl) {
        daysEl.textContent = days > 0 ? `${days} Days` : 'Expired';
    }
    renderStatus(statusEl, status);
}

window.addEventListener('DOMContentLoaded', () => {
    if (!window.mockData) {
        console.error('[app.js] window.mockData missing — is data.js loaded first?');
        return;
    }

        const data = window.mockData;

    // ── Load persisted state ──────────────────────────────────────────────
    appState = loadStorage();

    // ── Welcome name — prefer profile from settings tab ────────────────────
    const welcomeNameEl = document.getElementById('welcomeName');
    if (welcomeNameEl) {
        let displayName = data.userProfile.name || 'Guest';
        try {
            const savedProfile = JSON.parse(localStorage.getItem('fitpulse-profile'));
            if (savedProfile?.fullName) {
                displayName = savedProfile.fullName;
            }
        } catch { /* ignore */ }
        if (data.userProfile) data.userProfile.name = displayName;
        welcomeNameEl.textContent = displayName.split(' ')[0];
    }

    // ── Active Plan card ──────────────────────────────────────────────────
    const activePlanEl = document.getElementById('stat-active-plan');
    const planExpiryEl = document.getElementById('stat-plan-expiry');
    if (activePlanEl) activePlanEl.textContent = data.userProfile.membershipPlan;
    if (planExpiryEl) planExpiryEl.textContent = `Valid till ${data.userProfile.expiryDate}`;

    // ── Expiry In card — computed from real date ───────────────────────────
    renderExpiryCard(data.userProfile.expiryDate);

    // ── Sessions card — from localStorage ─────────────────────────────────
    const sessEl    = document.getElementById('stat-sessions');
    const sessValEl = document.getElementById('stat-sessions-val');
    const heroSessEl = document.getElementById('heroSessions');
    if (sessEl) {
        const currentVal = parseInt(sessEl.textContent.replace(/[^\d]/g, ''), 10) || 0;
        if (currentVal !== appState.total) {
            animateCount(sessEl, currentVal, appState.total, 1000);
        }
    }
    if (heroSessEl) {
        heroSessEl.textContent = String(appState.total);
        animateCount(heroSessEl, 0, appState.total, 700);
    }
    if (sessValEl) animateCount(sessValEl, 0, appState.total, 1000);

    // ── Session goal display ────────────────────────────────────────────────
    updateSessionGoalDisplay();

    let sessObsTimer = null;
    const sessObserver = new MutationObserver(() => {
        if (sessObsTimer) clearTimeout(sessObsTimer);
        sessObsTimer = setTimeout(() => updateSessionGoalDisplay(), 50);
    });
    if (sessEl) sessObserver.observe(sessEl, { characterData: true, childList: true, subtree: true });

    const bindIncreaseSess = (id) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); window.increaseSessionGoal(); });
    };
    bindIncreaseSess('increaseSessionGoalBtn');
    bindIncreaseSess('increaseSessionGoalBtnAnalytics');

    const bindDecreaseSess = (id) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); window.decreaseSessionGoal(); });
    };
    bindDecreaseSess('decreaseSessionGoalBtn');
    bindDecreaseSess('decreaseSessionGoalBtnAnalytics');

    const addSessBtn = document.getElementById('addSessionsBtn');
    if (addSessBtn) addSessBtn.addEventListener('click', (e) => { e.preventDefault(); window.addSessions(); });

    // ── Points card — from localStorage ───────────────────────────────────
    const ptsEl    = document.getElementById('stat-points');
    const ptsValEl = document.getElementById('stat-points-val');
    if (ptsEl) {
        const currentVal = parseInt(ptsEl.textContent.replace(/[^\d]/g, ''), 10) || 0;
        if (currentVal !== appState.points) {
            animateCount(ptsEl, currentVal, appState.points, 1200);
        }
    }
    if (ptsValEl) animateCount(ptsValEl, 0, appState.points, 1200);

    // ── Reward goal display ────────────────────────────────────────────────
    updateGoalDisplay();

    // Watch the points element for realtime-engine updates
    let ptsObsTimer = null;
    const ptsObserver = new MutationObserver(() => {
        if (ptsObsTimer) clearTimeout(ptsObsTimer);
        ptsObsTimer = setTimeout(() => updateGoalDisplay(), 50);
    });
    if (ptsEl) ptsObserver.observe(ptsEl, { characterData: true, childList: true, subtree: true });

    // Bind increase-goal buttons
    const bindIncrease = (id) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); window.increaseRewardGoal(); });
    };
    bindIncrease('increaseGoalBtn');
    bindIncrease('increaseGoalBtnAnalytics');

    const bindDecrease = (id) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); window.decreaseRewardGoal(); });
    };
    bindDecrease('decreaseGoalBtn');
    bindDecrease('decreaseGoalBtnAnalytics');

    const addPtsBtn = document.getElementById('addPointsBtn');
    if (addPtsBtn) addPtsBtn.addEventListener('click', (e) => { e.preventDefault(); window.addPointsManually(); });

    // ── Analytics ring stats ───────────────────────────────────────────────
    const attendanceValEl = document.getElementById('stat-attendance-val');
    const hoursValEl      = document.getElementById('stat-hours-val');
    if (attendanceValEl) attendanceValEl.textContent = data.membershipStats.attendanceRate;
    if (hoursValEl)      hoursValEl.textContent      = data.membershipStats.totalHoursBurned;

    // ── Re-check expiry every hour (tab might stay open) ──────────────────
    setInterval(() => {
        const expiry = window.mockData?.userProfile?.expiryDate || data.userProfile.expiryDate;
        renderExpiryCard(expiry);
    }, 3_600_000);

    window.addRewardPoints = function(pts) {
        if (!appState) return;
        const ptsEl = document.getElementById('stat-points');
        const ptsValEl = document.getElementById('stat-points-val');
        const currentPoints = ptsEl ? parseInt(String(ptsEl.textContent).replace(/[^\d]/g, ''), 10) || 0 : appState.points;
        const prevPoints = currentPoints;
        appState.points = currentPoints + pts;
        saveStorage(appState);
        animateCount(ptsEl, prevPoints, appState.points, 800);
        animateCount(ptsValEl, prevPoints, appState.points, 800);
        if (ptsEl) flashEl(ptsEl);
        updateGoalDisplay();
        if (typeof window.syncAnalyticsRings === 'function') {
            window.syncAnalyticsRings(appState.total, appState.points);
        }
        
        if (typeof window.showToast === 'function') {
            window.showToast('Task Completed!', `+${pts} reward points earned`, 'success');
        }
    };

    console.info(
        `[FitPulse] Dashboard ready · sessions today: ${appState.today}/${MAX_SESSIONS_PER_DAY} · points: ${appState.points}`
    );
});

