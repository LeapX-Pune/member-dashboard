/**
 * profile.js — Dynamic Editable User Profile System
 * ====================================================
 * Handles:
 *  1. Auto-generating user info from login email
 *  2. Persisting profile to localStorage
 *  3. Populating all dashboard UI elements with profile data
 *  4. Edit Profile modal — open / save / close
 *  5. Profile completion percentage
 *  6. Logout — clears session data
 *  7. Login protection — redirects if not logged in
 */

// ─────────────────────────────────────────────
// CONSTANTS & STORAGE KEYS
// ─────────────────────────────────────────────
const STORAGE_KEY_PROFILE = 'fitpulse-profile';
const STORAGE_KEY_SESSION = 'fitpulse-session';

// Fitness goal options for the dropdown
const FITNESS_GOALS = [
    'Build Muscle',
    'Lose Weight',
    'Improve Stamina',
    'Stay Active',
    'Train for Competition',
    'Improve Flexibility',
    'General Fitness',
];

// ─────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────

/** Capitalise the first letter of each word */
function toTitleCase(str) {
    return str
        .split(/[\s._\-]+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
        .trim();
}

/** Generate a random Indian mobile number */
function randomPhone() {
    const prefixes = ['98', '97', '96', '95', '99', '93', '91'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const mid = String(Math.floor(Math.random() * 90000000 + 10000000)).slice(0, 6);
    const end = String(Math.floor(Math.random() * 90 + 10));
    return `+91 ${prefix}${mid.slice(0, 4)} ${mid.slice(4)}${end}`;
}

/** Generate a random age between 18 and 35 */
function randomAge() {
    return Math.floor(Math.random() * 18) + 18;
}

/** Generate a unique membership ID like FIT2045 */
function randomMembershipId() {
    const num = Math.floor(Math.random() * 9000) + 1000;
    return `FIT${num}`;
}

/** Pick a random fitness goal */
function randomGoal() {
    return FITNESS_GOALS[Math.floor(Math.random() * FITNESS_GOALS.length)];
}

/** Get initials from a full name (up to 2 chars) */
function getInitials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

/** Build a ui-avatars.com URL for fallback */
function avatarUrl(name, bg = '1e1c1a', color = 'fff') {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=${color}&rounded=true&bold=true`;
}

/** Safe localStorage get */
function lsGet(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

/** Safe localStorage set */
function lsSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

/** Safe localStorage remove */
function lsRemove(key) {
    try { localStorage.removeItem(key); } catch { /* private mode */ }
}

// ─────────────────────────────────────────────
// PROFILE GENERATION
// ─────────────────────────────────────────────

/**
 * Generate a fresh profile from a login email.
 * @param {string} email
 * @returns {Object} profile
 */
function generateProfile(email) {
    const localPart = email.split('@')[0];         // e.g. "saurya.bisen_22"
    const fullName  = toTitleCase(localPart);      // e.g. "Saurya Bisen 22" → cleaned

    // Strip trailing numbers that sneak in from email aliases
    const cleanName = fullName.replace(/\s*\d+\s*$/, '').trim();

    return {
        fullName:     cleanName || 'Fitness Member',
        email:        email,
        phone:        randomPhone(),
        age:          randomAge(),
        membershipId: randomMembershipId(),
        goal:         randomGoal(),
        bio:          '',
        avatarUrl:    '',          // empty = use initials
        createdAt:    Date.now(),
    };
}

// ─────────────────────────────────────────────
// PROFILE LOAD / SAVE
// ─────────────────────────────────────────────

/** Load profile from localStorage, or null if none */
function loadProfile() {
    return lsGet(STORAGE_KEY_PROFILE);
}

/** Save profile object to localStorage */
function saveProfile(profile) {
    lsSet(STORAGE_KEY_PROFILE, profile);
}

// ─────────────────────────────────────────────
// SESSION HELPERS
// ─────────────────────────────────────────────

function saveSession(email) {
    lsSet(STORAGE_KEY_SESSION, { email, loggedInAt: Date.now() });
}

function loadSession() {
    return lsGet(STORAGE_KEY_SESSION);
}

function clearSession() {
    lsRemove(STORAGE_KEY_SESSION);
    lsRemove(STORAGE_KEY_PROFILE);
}

// ─────────────────────────────────────────────
// PROFILE COMPLETION %
// ─────────────────────────────────────────────

function calcCompletion(profile) {
    const fields = ['fullName', 'email', 'phone', 'age', 'goal', 'bio', 'avatarUrl'];
    let filled = 0;
    fields.forEach(f => {
        if (profile[f] && String(profile[f]).trim()) filled++;
    });
    return Math.round((filled / fields.length) * 100);
}

// ─────────────────────────────────────────────
// DOM POPULATION — update every element that
// references the user's name / info
// ─────────────────────────────────────────────

function populateDashboard(profile) {
    const initials = getInitials(profile.fullName);
    const hasAvatar = profile.avatarUrl && profile.avatarUrl.trim();

    // ── Navbar Avatar & Name ──
    const navAvatarImg = document.getElementById('userAvatar'); // this is now a div container
    const navAvatarInitials = document.getElementById('navAvatarInitials');
    const navUserName = document.getElementById('navUserName');
    
    if (navUserName) {
        navUserName.textContent = profile.fullName;
    }
    if (navAvatarInitials) {
        navAvatarInitials.textContent = initials;
    }
    
    if (navAvatarImg && navAvatarImg.tagName === 'IMG') {
        if (hasAvatar) {
            navAvatarImg.src = profile.avatarUrl;
            navAvatarImg.alt = profile.fullName;
        } else {
            navAvatarImg.src = avatarUrl(profile.fullName);
            navAvatarImg.alt = profile.fullName;
        }
    } else if (navAvatarImg && hasAvatar) {
        // If it's a div and user added an avatar URL, we could set a background image,
        // but for now, we just rely on initials or update its style.
        navAvatarInitials.style.display = 'none';
        navAvatarImg.style.backgroundImage = `url('${profile.avatarUrl}')`;
        navAvatarImg.style.backgroundSize = 'cover';
    } else if (navAvatarImg) {
        navAvatarInitials.style.display = 'block';
        navAvatarImg.style.backgroundImage = 'none';
    }

    // ── Profile Dropdown ──
    const dropdownName = document.getElementById('dropdownName');
    if (dropdownName) dropdownName.textContent = profile.fullName;

    const dropdownEmail = document.getElementById('dropdownEmail');
    if (dropdownEmail) dropdownEmail.textContent = profile.email;

    const dropdownPhone = document.getElementById('dropdownPhone');
    if (dropdownPhone) dropdownPhone.textContent = profile.phone;

    // ── Welcome Card ──
    const welcomeName = document.getElementById('welcomeName');
    if (welcomeName) {
        // Show only first name in the greeting
        welcomeName.textContent = profile.fullName.split(' ')[0];
    }

    // ── Settings Profile Card ──
    const settingsCardName = document.getElementById('settingsCardName');
    if (settingsCardName) settingsCardName.textContent = profile.fullName;

    const settingsCardEmail = document.getElementById('settingsCardEmail');
    if (settingsCardEmail) settingsCardEmail.textContent = profile.email;

    const settingsCardMid = document.getElementById('settingsCardMid');
    if (settingsCardMid) settingsCardMid.textContent = profile.membershipId;

    // Settings card avatar
    const settingsCardAvatar = document.getElementById('settingsCardAvatar');
    if (settingsCardAvatar) {
        if (hasAvatar) {
            settingsCardAvatar.innerHTML = `<img src="${profile.avatarUrl}" alt="${profile.fullName}">`;
        } else {
            settingsCardAvatar.textContent = initials;
        }
    }

    // ── Profile Form (readonly pre-fill in settings) ──
    const pfName  = document.getElementById('name');
    const pfEmail = document.getElementById('email');
    const pfPhone = document.getElementById('phone');
    const pfAge   = document.getElementById('age');

    if (pfName)  pfName.value  = profile.fullName;
    if (pfEmail) pfEmail.value = profile.email;
    if (pfPhone) pfPhone.value = profile.phone;
    if (pfAge)   pfAge.value   = profile.age;

    // ── Profile Completion Bar ──
    const pct = calcCompletion(profile);
    const pctBar  = document.getElementById('completionBar');
    const pctText = document.getElementById('completionPct');
    if (pctBar)  pctBar.style.width = pct + '%';
    if (pctText) pctText.textContent = pct + '%';

    // ── Activity list first item avatar ──
    const actFirstAvatar = document.getElementById('actFirstAvatar');
    if (actFirstAvatar) {
        actFirstAvatar.src = avatarUrl(profile.fullName, 'fce9d5', 'e8813a');
        actFirstAvatar.alt = profile.fullName;
    }
}

// ─────────────────────────────────────────────
// EDIT PROFILE MODAL
// ─────────────────────────────────────────────

function openEditModal(profile) {
    const overlay = document.getElementById('profileModalOverlay');
    if (!overlay) return;

    // Pre-fill modal fields
    const fields = {
        modalFullName:  profile.fullName,
        modalPhone:     profile.phone,
        modalAge:       profile.age,
        modalGoal:      profile.goal,
        modalBio:       profile.bio || '',
        modalAvatarUrl: profile.avatarUrl || '',
    };

    Object.entries(fields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    });

    // Update modal avatar preview
    updateModalAvatarPreview(profile.avatarUrl, profile.fullName);

    // Show overlay
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    const overlay = document.getElementById('profileModalOverlay');
    if (!overlay) return;
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
}

function updateModalAvatarPreview(url, name) {
    const preview = document.getElementById('modalAvatarPreview');
    if (!preview) return;
    if (url && url.trim()) {
        preview.innerHTML = `<img src="${url}" alt="${name}" onerror="this.parentElement.textContent='${getInitials(name)}'">`;
    } else {
        preview.textContent = getInitials(name || 'FM');
    }
}

/** Save changes from the modal and refresh the dashboard */
function saveModalChanges() {
    const profile = loadProfile();
    if (!profile) return;

    const newName  = (document.getElementById('modalFullName')?.value  || '').trim();
    const newPhone = (document.getElementById('modalPhone')?.value     || '').trim();
    const newAge   = parseInt(document.getElementById('modalAge')?.value) || profile.age;
    const newGoal  = (document.getElementById('modalGoal')?.value      || '').trim();
    const newBio   = (document.getElementById('modalBio')?.value       || '').trim();
    const newAvUrl = (document.getElementById('modalAvatarUrl')?.value || '').trim();

    profile.fullName  = newName  || profile.fullName;
    profile.phone     = newPhone || profile.phone;
    profile.age       = (newAge >= 10 && newAge <= 100) ? newAge : profile.age;
    profile.goal      = newGoal  || profile.goal;
    profile.bio       = newBio;
    profile.avatarUrl = newAvUrl;

    saveProfile(profile);
    populateDashboard(profile);
    closeEditModal();
    showToast('Profile updated successfully!');
}

// ─────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────

function showToast(message) {
    let toast = document.getElementById('profileToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'profileToast';
        toast.className = 'profile-toast';
        toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span id="profileToastMsg"></span>`;
        document.body.appendChild(toast);
    }
    document.getElementById('profileToastMsg').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────

function handleProfileLogout() {
    clearSession();
    // The existing script.js handleLogout() manages the UI hide/show,
    // so we just clear storage here. The event listener is added below
    // after DOMContentLoaded to avoid double-binding.
}

// ─────────────────────────────────────────────
// MAIN INIT — runs after DOMContentLoaded
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

    // ── 1. Intercept login form submit to capture email & generate profile ──
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', () => {
            const emailInput = document.getElementById('loginEmail');
            if (!emailInput || !emailInput.value.trim()) return;

            const email = emailInput.value.trim().toLowerCase();

            // Only generate a new profile if one doesn't exist for this email
            let profile = loadProfile();
            if (!profile || profile.email !== email) {
                profile = generateProfile(email);
                saveProfile(profile);
            }
            saveSession(email);
        }, { capture: true }); // capture: true so we run before script.js's submit handler
    }

    // ── 2. On dashboard show, populate all elements ──
    //    We watch for when dashboardContainer becomes visible via a MutationObserver
    const dashboardContainer = document.getElementById('dashboardContainer');

    function tryPopulate() {
        const profile = loadProfile();
        if (profile) populateDashboard(profile);
    }

    if (dashboardContainer) {
        // Populate immediately if already visible (e.g. on reload)
        if (dashboardContainer.style.display !== 'none') {
            tryPopulate();
        }

        // Watch for style changes (display: flex → shown)
        const observer = new MutationObserver(() => {
            if (dashboardContainer.style.display !== 'none') {
                tryPopulate();
            }
        });
        observer.observe(dashboardContainer, { attributes: true, attributeFilter: ['style'] });
    }

    // ── 3. Edit Profile modal triggers ──
    // "Edit Profile" button in profile dropdown
    const dropdownEditBtn = document.getElementById('dropdownEditProfileBtn');
    if (dropdownEditBtn) {
        dropdownEditBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Close the dropdown first
            const pd = document.getElementById('profileDropdown');
            if (pd) pd.style.display = 'none';
            openEditModal(loadProfile());
        });
    }

    // "Edit Profile" button in settings profile card
    const settingsEditBtn = document.getElementById('settingsEditProfileBtn');
    if (settingsEditBtn) {
        settingsEditBtn.addEventListener('click', () => {
            openEditModal(loadProfile());
        });
    }

    // Modal close button
    const modalCloseBtn = document.getElementById('profileModalCloseBtn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeEditModal);
    }

    // Click overlay background to close
    const modalOverlay = document.getElementById('profileModalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeEditModal();
        });
    }

    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeEditModal();
    });

    // Modal save button
    const modalSaveBtn = document.getElementById('profileModalSaveBtn');
    if (modalSaveBtn) {
        modalSaveBtn.addEventListener('click', saveModalChanges);
    }

    // Modal cancel button
    const modalCancelBtn = document.getElementById('profileModalCancelBtn');
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', closeEditModal);
    }

    // Live avatar preview update when URL changes
    const modalAvatarInput = document.getElementById('modalAvatarUrl');
    if (modalAvatarInput) {
        modalAvatarInput.addEventListener('input', () => {
            const profile = loadProfile();
            updateModalAvatarPreview(modalAvatarInput.value, profile?.fullName || '');
        });
    }

    // ── 4. Logout — clear session ──
    //    Piggyback on the sidebar and settings logout buttons
    ['sidebarLogoutBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', handleProfileLogout);
        }
    });
    // Settings panel logout button
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', handleProfileLogout);
    });

    // ── 5. Session guard — If user navigates back after logout ──
    //    We only enforce this if the dashboard is currently visible on load
    if (dashboardContainer && dashboardContainer.style.display !== 'none') {
        const session = loadSession();
        if (!session) {
            // Force back to login
            dashboardContainer.style.display = 'none';
            const loginOverlay = document.getElementById('login-overlay');
            if (loginOverlay) {
                loginOverlay.style.display = 'flex';
                loginOverlay.classList.remove('hidden');
            }
        } else {
            tryPopulate();
        }
    }
});
