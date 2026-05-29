// Randomized member database — generated once per user, persisted in localStorage.
// Subsequent loads reuse the stored seed so values stay stable for the same credentials.
(function () {
    // ── User-specific storage keys ───────────────────────────────────────────
    // The active user's name is hardcoded in allUsers below; we derive a stable
    // per-user key so the same user always sees the same seeded data.
    var ACTIVE_USER    = "Sauryaman Bisen";
    var USER_KEY       = ACTIVE_USER.toLowerCase().replace(/\s+/g, '_');
    var SEED_MOCKDATA_KEY = 'fp_seed_mockdata_' + USER_KEY;
    var SEED_USERS_KEY    = 'fp_seed_allusers_' + USER_KEY;
    var SEED_VERSION      = 2;

    // ── DOM renderer (defined early so both paths can call it) ──────────────
    window.renderActiveDashboard = function () {
        var data = window.mockData;
        if (!data) {
            console.error("Dashboard error: Mock data dataset not found.");
            return;
        }
        try {
            var welcomeContainer = document.getElementById('welcomeName');
            if (welcomeContainer) {
                var currentName = data.userProfile.name ? data.userProfile.name.trim() : "";
                welcomeContainer.textContent = currentName !== "" ? currentName : "Guest Member";
            }

            var displayPlanName = document.getElementById('stat-active-plan');
            var displayPlanExpiry = document.getElementById('stat-plan-expiry');
            var displayPlanStatus = document.getElementById('membership-status');

            if (displayPlanName) displayPlanName.textContent = data.userProfile.membershipPlan;
            if (displayPlanExpiry) {
                var expiryDate = new Date(data.userProfile.expiryDate);
                var formatted = !isNaN(expiryDate.getTime())
                    ? expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : data.userProfile.expiryDate;
                displayPlanExpiry.textContent = "Valid till " + formatted;
            }

            if (displayPlanStatus) {
                var currentStatus = data.userProfile.status;
                if (typeof window.calculateMembershipStatus === 'function' && data.userProfile.expiryDate) {
                    try {
                        var computed = window.calculateMembershipStatus(data.userProfile.expiryDate);
                        currentStatus = computed.status;
                    } catch (e) { /* ignore */ }
                }
                displayPlanStatus.textContent = currentStatus;
            }

            var countPlanOverview = document.getElementById('stat-active-plan');
            if (countPlanOverview) countPlanOverview.textContent = data.membershipStats.activePlan;

            var countSessions = document.getElementById('stat-sessions');
            var countPoints = document.getElementById('stat-points');
            if (countSessions) {
                var total = parseInt(localStorage.getItem('fp_total_sessions') || String(data.membershipStats.sessionsCount), 10);
                countSessions.textContent = String(total);
            }
            if (countPoints) {
                var pts = parseInt(localStorage.getItem('fp_reward_points') || String(data.membershipStats.rewardPoints), 10);
                countPoints.textContent = pts.toLocaleString();
            }
        } catch (error) {
            console.error("DOM injection failed:", error);
        }
    };

    // ── Plan change helper — updates mockData, allUsers, and persists seed ─
    window.updateMembershipPlan = function (planName) {
        if (!window.mockData || !window.allUsers) return;
        window.mockData.userProfile.membershipPlan = planName;
        window.mockData.membershipStats.activePlan  = planName;
        window.allUsers[0].plan = planName;
        try {
            localStorage.setItem(SEED_MOCKDATA_KEY, JSON.stringify(window.mockData));
            localStorage.setItem(SEED_USERS_KEY, JSON.stringify(window.allUsers));
        } catch (e) {}
        window.renderActiveDashboard();
    };

    // ── Try to restore an already-generated seed (per-user) ─────────────────
    var storedMockdata = localStorage.getItem(SEED_MOCKDATA_KEY);
    var storedUsers    = localStorage.getItem(SEED_USERS_KEY);

    if (storedMockdata && storedUsers) {
        var parsed = JSON.parse(storedMockdata);
        if (parsed._seedVersion === SEED_VERSION) {
            window.mockData = parsed;
            window.allUsers = JSON.parse(storedUsers);
            window.renderActiveDashboard();
            return;
        }
        localStorage.removeItem(SEED_MOCKDATA_KEY);
        localStorage.removeItem(SEED_USERS_KEY);
        try { localStorage.removeItem('fp_total_sessions'); } catch (e) {}
        try { localStorage.removeItem('fp_reward_points'); } catch (e) {}
    }

    // ── First-time seed generation (runs once per user) ─────────────────────
    var rand = function (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; };
    var pick = function (arr) { return arr[rand(0, arr.length - 1)]; };

    var plans    = ["Elite Premium", "Basic Tier", "Pro Club", "Gold", "Premium Pro", "Platinum Plus", "Gold Standard"];
    var statuses = ["Active", "Active", "Active", "Expiring Soon", "Expired"];

    // Active user has fixed reward points (300) and total sessions (80).
    // Everyone else is randomized.
    var allUsers = [
        { name: "Sauryaman Bisen", plan: pick(plans), sessions: 80,           points: 300,              status: "Active" },
        { name: "Ksitij",          plan: pick(plans), sessions: rand(8, 20),  points: rand(200, 400),   status: "Active" },
        { name: "Pulak Shah",      plan: pick(plans), sessions: rand(25, 45), points: rand(500, 900),   status: pick(statuses) },
        { name: "Sankap Tiwari",   plan: pick(plans), sessions: rand(35, 55), points: rand(800, 1400),  status: pick(statuses) },
        { name: "Anikit Bhalke",   plan: pick(plans), sessions: rand(45, 65), points: rand(1000, 1800), status: pick(statuses) },
        { name: "Sai Shendege",    plan: pick(plans), sessions: rand(3, 10),  points: rand(50, 200),    status: "Expired" },
        { name: "Rehan Azim",      plan: pick(plans), sessions: rand(60, 85), points: rand(1500, 2500), status: "Active" },
        { name: "",                plan: "N/A",       sessions: 0,            points: 0,                status: "Unknown" }
    ];

    function randomFutureDate(monthsMin, monthsMax) {
        var d = new Date();
        d.setMonth(d.getMonth() + rand(monthsMin, monthsMax));
        d.setDate(rand(1, 28));
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    function randomPastDate(monthsAgoMin, monthsAgoMax) {
        var d = new Date();
        d.setMonth(d.getMonth() - rand(monthsAgoMin, monthsAgoMax));
        d.setDate(rand(1, 28));
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    function randomDateStrWithin(daysBack) {
        var d = new Date();
        d.setDate(d.getDate() - rand(0, daysBack));
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var dd = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + dd;
    }

    function randomTimeStr() {
        var h = rand(6, 20);
        var m = rand(0, 3) * 15;
        var ampm = h < 12 ? 'AM' : 'PM';
        var hh = h % 12 || 12;
        return String(hh).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ' ' + ampm;
    }

    var activityList = [
        "High-Intensity Interval Training", "Vinyasa Yoga & Breathwork",
        "Barbell Deadlift & Powerlifting", "Cardio Kickboxing Session",
        "Swimming Laps & Endurance Development", "Pilates Core Fusion",
        "CrossFit Metcon Challenge", "Boxing Technique & Sparring",
        "Spinning Endurance Ride", "Bodyweight Strength Circuit",
        "Kettlebell HIIT Blast", "Zumba Dance Fitness",
        "Resistance Band Full Body", "TRX Suspension Training",
        "Olympic Weightlifting Technique"
    ];

    var durations = ["30 mins", "45 mins", "50 mins", "60 mins", "75 mins", "90 mins"];
    var trainers  = ["Coach Alex", "Sarah Jenkins", "Marcus Iron", "Priya Verma", "Aarav Sharma", "Self Guided"];

    // Build 8 recent activities spread over the last 30 days (randomized once)
    var recentActivities = [];
    var usedKeys = new Set();
    for (var i = 0; i < 8; i++) {
        var key;
        do {
            var d = randomDateStrWithin(30);
            var t = randomTimeStr();
            key = d + t;
        } while (usedKeys.has(key));
        usedKeys.add(key);
        recentActivities.push({
            date: key.slice(0, 10),
            time: key.slice(10),
            activity: pick(activityList),
            duration: pick(durations),
            trainer: pick(trainers)
        });
    }
    recentActivities.sort(function (a, b) { return b.date.localeCompare(a.date) || b.time.localeCompare(a.time); });

    // ── Chart seed — randomized once per user, then frozen ──────────────────

    function randomWeeklyData() {
        var arr = [];
        for (var i = 0; i < 7; i++) arr.push(rand(0, 5));
        return arr;
    }
    function randomMonthlyData() {
        var arr = [];
        for (var i = 0; i < 4; i++) arr.push(rand(6, 28));
        return arr;
    }
    function randomYearlyData() {
        var arr = [];
        for (var i = 0; i < 12; i++) arr.push(rand(20, 95));
        return arr;
    }

    function buildDoughnutData(sessionTotal) {
        var used = Math.round(sessionTotal * rand(60, 90) / 100);
        var pending = rand(1, 6);
        var available = Math.max(1, sessionTotal - used - pending);
        return [used, available, pending];
    }

    var weeklyLine   = randomWeeklyData();
    var monthlyLine  = randomMonthlyData();
    var yearlyLine   = randomYearlyData();

    var ws = weeklyLine.reduce(function (a, b) { return a + b; }, 0);
    var ms = monthlyLine.reduce(function (a, b) { return a + b; }, 0);
    var ys = yearlyLine.reduce(function (a, b) { return a + b; }, 0);

    var expiryDate   = randomFutureDate(3, 18);
    var memberSince  = randomPastDate(12, 36);

    var mockData = {
        userProfile: {
            name: allUsers[0].name,
            membershipPlan: allUsers[0].plan,
            expiryDate: expiryDate,
            status: allUsers[0].status,
            memberSince: memberSince
        },
        membershipStats: {
            activePlan: allUsers[0].plan,
            expiryStatus: "Valid",
            sessionsCount: allUsers[0].sessions,
            rewardPoints: allUsers[0].points,
            attendanceRate: rand(65, 99) + "%",
            totalHoursBurned: rand(80, 250),
            expiryOverview: "Valid till " + expiryDate
        },
        activity_weekly: {
            labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            data: weeklyLine
        },
        activity_monthly: {
            labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
            data: monthlyLine
        },
        activity_yearly: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            data: yearlyLine
        },
        doughnut_weekly: {
            labels: ["Used Sessions", "Available Sessions", "Pending Approval"],
            data: buildDoughnutData(ws)
        },
        doughnut_monthly: {
            labels: ["Used Sessions", "Available Sessions", "Pending Approval"],
            data: buildDoughnutData(ms)
        },
        doughnut_yearly: {
            labels: ["Used Sessions", "Available Sessions", "Pending Approval"],
            data: buildDoughnutData(ys)
        },
        recentActivities: recentActivities,
        _seedVersion: SEED_VERSION
    };

    // Persist the seed under user-specific keys so the same credentials
    // always restore the same values.
    try {
        localStorage.setItem(SEED_MOCKDATA_KEY, JSON.stringify(mockData));
        localStorage.setItem(SEED_USERS_KEY, JSON.stringify(allUsers));
    } catch (e) {}

    window.mockData = mockData;
    window.allUsers = allUsers;
})();
