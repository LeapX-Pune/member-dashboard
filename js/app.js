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
    };
}

function saveStorage(state) {
    localStorage.setItem(STORAGE_KEY_TODAY,  String(state.today));
    localStorage.setItem(STORAGE_KEY_TOTAL,  String(state.total));
    localStorage.setItem(STORAGE_KEY_POINTS, String(state.points));
}

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

    // ── Show a discreet toast notification ───────────────────────────────
    showToast(
        '🏋️ Session Logged',
        `+${POINTS_PER_SESSION} pts earned · ${MAX_SESSIONS_PER_DAY - appState.today} session${MAX_SESSIONS_PER_DAY - appState.today !== 1 ? 's' : ''} remaining today`,
        'success'
    );

    console.info(`[FitPulse] Session logged — today: ${appState.today}/${MAX_SESSIONS_PER_DAY}, total: ${appState.total}, points: ${appState.points}`);
    return true;
}

// ─── TOAST ────────────────────────────────────────────────────────────────────

function showToast(title, message, type = 'info') {
    // Only show toasts if the dashboard is visible
    const dashboard = document.getElementById('dashboardContainer');
    if (!dashboard || dashboard.style.display === 'none' || dashboard.style.display === '') return;

    // Reuse existing toast container if present (from script.js), or create one
    let container = document.getElementById('fp-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'fp-toast-container';
        container.style.cssText = `
            position:fixed; bottom:1.5rem; right:1.5rem; z-index:99998;
            display:flex; flex-direction:column; gap:0.6rem;
            pointer-events:none;
        `;
        document.body.appendChild(container);
    }

    const colours = {
        success: { bg: '#0f2d1a', border: '#22c55e', icon: '✔' },
        info:    { bg: '#0d1f33', border: '#3b82f6', icon: 'ℹ' },
        warn:    { bg: '#2d1e00', border: '#f59e0b', icon: '⚠' }
    };
    const c = colours[type] || colours.info;

    const toast = document.createElement('div');
    toast.style.cssText = `
        pointer-events:auto;
        background:${c.bg};
        border:1.5px solid ${c.border};
        border-radius:14px;
        padding:0.85rem 1.1rem;
        min-width:260px;
        max-width:320px;
        display:flex;
        gap:0.75rem;
        align-items:flex-start;
        box-shadow:0 8px 32px rgba(0,0,0,0.45);
        animation:fpToastIn 0.35s cubic-bezier(.34,1.56,.64,1) forwards;
        opacity:0;
        transform:translateY(12px);
    `;
    toast.innerHTML = `
        <span style="font-size:1.1rem;line-height:1.3;color:${c.border};">${c.icon}</span>
        <div style="display:flex;flex-direction:column;gap:2px;">
            <span style="font-weight:700;font-size:0.88rem;color:#f9fafb;">${title}</span>
            <span style="font-size:0.78rem;color:#9ca3af;line-height:1.4;">${message}</span>
        </div>
    `;
    container.appendChild(toast);

    // Auto-dismiss
    setTimeout(() => {
        toast.style.animation = 'fpToastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
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

    // ── Inject toast keyframes once ───────────────────────────────────────
    if (!document.getElementById('fp-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'fp-toast-styles';
        style.textContent = `
            @keyframes fpToastIn  { to { opacity:1; transform:translateY(0); } }
            @keyframes fpToastOut { to { opacity:0; transform:translateY(8px); } }
            .live-update {
                animation: fpFlash 0.6s ease forwards !important;
            }
            @keyframes fpFlash {
                0%   { opacity:1; }
                25%  { opacity:0.35; color:var(--accent,#e8813a); transform:scale(1.08); }
                100% { opacity:1; transform:scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    // ── Load persisted state ──────────────────────────────────────────────
    appState = loadStorage();

    // ── Welcome name ──────────────────────────────────────────────────────
    const welcomeNameEl = document.getElementById('welcomeName');
    if (welcomeNameEl) {
        welcomeNameEl.textContent = (data.userProfile.name || 'Guest').split(' ')[0];
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
    if (sessEl)    animateCount(sessEl,    0, appState.total, 1000);
    if (sessValEl) animateCount(sessValEl, 0, appState.total, 1000);

    // ── Points card — from localStorage ───────────────────────────────────
    const ptsEl    = document.getElementById('stat-points');
    const ptsValEl = document.getElementById('stat-points-val');
    if (ptsEl)    animateCount(ptsEl,    0, appState.points, 1200);
    if (ptsValEl) animateCount(ptsValEl, 0, appState.points, 1200);

    // ── Analytics ring stats ───────────────────────────────────────────────
    const attendanceValEl = document.getElementById('stat-attendance-val');
    const hoursValEl      = document.getElementById('stat-hours-val');
    if (attendanceValEl) attendanceValEl.textContent = data.membershipStats.attendanceRate;
    if (hoursValEl)      hoursValEl.textContent      = data.membershipStats.totalHoursBurned;

    // ── Re-check expiry every hour (tab might stay open) ──────────────────
    setInterval(() => renderExpiryCard(data.userProfile.expiryDate), 3_600_000);

    window.addRewardPoints = function(pts) {
        if (!appState) return;
        const prevPoints = appState.points;
        appState.points += pts;
        saveStorage(appState);
        
        const ptsEl = document.getElementById('stat-points');
        const ptsValEl = document.getElementById('stat-points-val');
        animateCount(ptsEl, prevPoints, appState.points, 800);
        animateCount(ptsValEl, prevPoints, appState.points, 800);
        if (ptsEl) flashEl(ptsEl);
        
        if (typeof showToast === 'function') {
            showToast('Task Completed!', `+${pts} reward points earned`, 'success');
        }
    };

    console.info(
        `[FitPulse] Dashboard ready · sessions today: ${appState.today}/${MAX_SESSIONS_PER_DAY} · points: ${appState.points}`
    );
});

