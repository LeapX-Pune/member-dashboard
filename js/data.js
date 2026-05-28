//Updated
// Global database of club members - Shared with Student 6 for simulation loops
const allUsers = [
    { name: "Sauryaman Bisen", plan: "Elite Premium", sessions: 88, points: 400, status: "Active" },
    { name: "Ksitij", plan: "Basic Tier", sessions: 12, points: 350, status: "Active" },
    { name: "Pulak Shah", plan: "Pro Club", sessions: 30, points: 800, status: "Expiring Soon" },
    { name: "Sankap Tiwari", plan: "Garib Premium", sessions: 45, points: 1200, status: "Active" },
    { name: "Anikit Bhalke", plan: "Premium Pro", sessions: 55, points: 1500, status: "Active" },
    { name: "Sai Shendege", plan: "Basic Tier", sessions: 5, points: 100, status: "Expired" },
    { name: "Rehan Azim", plan: "Elite Premium", sessions: 72, points: 1900, status: "Active" },
    { name: "", plan: "N/A", sessions: 0, points: 0, status: "Unknown" }
];

// Current active user data and analytics datasets used by Pod 2 and Pod 3
const mockData = {
    userProfile: {
        name: allUsers[0].name,
        membershipPlan: allUsers[0].plan,
        expiryDate: "August 16, 2026",
        status: allUsers[0].status,
        memberSince: "January 15, 2024"
    },
    membershipStats: {
        activePlan: allUsers[0].plan,
        expiryStatus: "Valid",
        sessionsCount: allUsers[0].sessions,
        rewardPoints: allUsers[0].points,
        attendanceRate: "94%",
        totalHoursBurned: 142,
        expiryOverview: "Valid till Dec 2026"
    },
    // Chart datasets (consumed by Students 7, 8, and 9)
    activity_weekly: {
        labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        data: [1, 2, 0, 3, 2, 4, 1]
    },
    activity_monthly: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        data: [12, 15, 8, 22]
    },
    activity_yearly: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        data: [45, 52, 60, 38, 42, 50, 30, 22, 55, 68, 74, 90]
    },

    // --- Doughnut Chart Data ---
    doughnut_weekly: {
        labels: ["Used Sessions", "Available Sessions", "Pending Approval"],
        data: [13, 2, 1]
    },
    doughnut_monthly: {
        labels: ["Used Sessions", "Available Sessions", "Pending Approval"],
        data: [57, 18, 5]
    },
    doughnut_yearly: {
        labels: ["Used Sessions", "Available Sessions", "Pending Approval"],
        data: [626, 84, 16]
    },

    // --- Activity Log ---
    recentActivities: [
        { date: "2026-05-15", time: "08:30 AM", activity: "High-Intensity Interval Training", duration: "45 mins", trainer: "Coach Alex" },
        { date: "2026-05-14", time: "06:15 PM", activity: "Vinyasa Yoga & Breathwork", duration: "60 mins", trainer: "Sarah Jenkins" },
        { date: "2026-05-12", time: "07:00 AM", activity: "Barbell Deadlift & Powerlifting", duration: "90 mins", trainer: "Marcus Iron" },
        { date: "2026-05-10", time: "05:30 PM", activity: "Cardio Kickboxing Session", duration: "45 mins", trainer: "Coach Alex" },
        { date: "2026-05-08", time: "09:00 AM", activity: "Swimming Laps & Endurance Development", duration: "50 mins", trainer: "Self Guided" }
    ]
};

// Expose variables to the window object so other team modules can access them cleanly
window.mockData = mockData;
window.allUsers = allUsers;

// Maps mockData properties onto the HTML element IDs from Student 4's layout
window.renderActiveDashboard = () => {
    const data = window.mockData;

    if (!data) {
        console.error("Dashboard error: Mock data dataset not found.");
        return;
    }

    try {
        // 1. Welcome Header (Handles empty names fallback cleanly)
        const welcomeContainer = document.getElementById('welcomeName');
        if (welcomeContainer) {
            const currentName = data.userProfile.name ? data.userProfile.name.trim() : "";
            welcomeContainer.textContent = currentName !== "" ? currentName : "Guest Member";
        }

        // 2. Membership Card Information
        const displayPlanName = document.getElementById('stat-active-plan');
        const displayPlanExpiry = document.getElementById('stat-plan-expiry');
        const displayPlanStatus = document.getElementById('membership-status');

        if (displayPlanName) displayPlanName.textContent = data.userProfile.membershipPlan;
        if (displayPlanExpiry) {
            const expiryDate = new Date(data.userProfile.expiryDate);
            const formatted = !isNaN(expiryDate.getTime())
                ? expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : data.userProfile.expiryDate;
            displayPlanExpiry.textContent = `Valid till ${formatted}`;
        }

        // 3. Status badge — leave styling to app.js and realtime-engine which compute from expiry date
        if (displayPlanStatus) {
            let currentStatus = data.userProfile.status;
            if (typeof window.calculateMembershipStatus === 'function' && data.userProfile.expiryDate) {
                try {
                    const computed = window.calculateMembershipStatus(data.userProfile.expiryDate);
                    currentStatus = computed.status;
                } catch (e) { /* ignore */ }
            }
            displayPlanStatus.textContent = currentStatus;
        }

        // 4. Overview Numeric Statistics Row — refresh from localStorage
        const countPlanOverview = document.getElementById('stat-active-plan');

        if (countPlanOverview) countPlanOverview.textContent = data.membershipStats.activePlan;

        const countSessions = document.getElementById('stat-sessions');
        const countPoints = document.getElementById('stat-points');
        if (countSessions) {
            const total = parseInt(localStorage.getItem('fp_total_sessions') || String(data.membershipStats.sessionsCount), 10);
            countSessions.textContent = String(total);
        }
        if (countPoints) {
            const pts = parseInt(localStorage.getItem('fp_reward_points') || String(data.membershipStats.rewardPoints), 10);
            countPoints.textContent = pts.toLocaleString();
        }

        // 5. Render Recent Activities Feed dynamically
        const activityLogWrapper = document.getElementById('activityList');
        if (activityLogWrapper) {
            activityLogWrapper.innerHTML = ""; // Clear existing structural layout placeholders

            if (data.recentActivities && data.recentActivities.length > 0) {
                data.recentActivities.slice(0, 4).forEach(session => {
                    const recordRow = document.createElement('div');
                    recordRow.className = "activity-row-item activity-list-item-row";
                    
                    recordRow.style.display = "flex";
                    recordRow.style.justifyContent = "space-between";
                    recordRow.style.alignItems = "center";
                    recordRow.style.padding = "12px";
                    recordRow.style.borderBottom = "1px solid #e5e7eb";

                    recordRow.innerHTML = `
                        <div style="display: flex; flex-direction: column;" class="activity-meta-group">
                            <span style="font-weight: 600; color: #1f2937;" class="activity-title-text">${session.activity}</span>
                            <span style="font-size: 13px; color: #6b7280;" class="activity-location-tag">Staff: ${session.trainer} &bull; ${session.time || ''}</span>
                        </div>
                        <div style="text-align: right; display: flex; flex-direction: column;">
                            <span style="font-weight: 500; color: #4b5563; font-size: 14px;">${session.date}</span>
                            <span style="font-size: 13px; color: #9ca3af;" class="activity-duration-badge">${session.duration}</span>
                        </div>
                    `;
                    activityLogWrapper.appendChild(recordRow);
                });
            } else {
                activityLogWrapper.innerHTML = `<div style="padding: 24px; text-align: center; color: #9ca3af;">No recent activities logged.</div>`;
            }
        }
    } catch (error) {
        console.error("DOM injection failed:", error);
    }
};
