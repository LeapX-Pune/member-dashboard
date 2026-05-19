// Global database of club members - Shared with Student 6 for simulation loops
const allUsers = [
    { name: "Sankap Tiwari", plan: "Premium Pro", sessions: 45, points: 1200, status: "Active" },
    { name: "Ksitij", plan: "Basic Tier", sessions: 12, points: 350, status: "Active" },
    { name: "Shouryaman Bisen", plan: "Elite VIP", sessions: 88, points: 2500, status: "Active" },
    { name: "Pulak Shah", plan: "Pro Club", sessions: 30, points: 800, status: "Expiring Soon" },
    { name: "Anikit Bhalke", plan: "Premium Pro", sessions: 55, points: 1500, status: "Active" },
    { name: "Sai Shendege", plan: "Basic Tier", sessions: 5, points: 100, status: "Expired" },
    { name: "Rehan Azim", plan: "Elite VIP", sessions: 72, points: 1900, status: "Active" },
    { name: "", plan: "N/A", sessions: 0, points: 0, status: "Unknown" }
];

// Current active user data and analytics datasets used by Pod 2 and Pod 3
const mockData = {
    userProfile: {
        name: allUsers[0].name,
        membershipPlan: allUsers[0].plan,
        expiryDate: "December 31, 2026",
        status: allUsers[0].status,
        memberSince: "January 15, 2024"
    },
    membershipStats: {
        activePlan: allUsers[0].plan,
        expiryStatus: "Valid",
        sessionsCount: allUsers[0].sessions,
        rewardPoints: allUsers[0].points,
        attendanceRate: "94%",
        totalHoursBurned: 142
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
    membershipUsage: {
        labels: ["Used Sessions", "Available Sessions", "Pending Approval"],
        data: [45, 15, 5]
    },
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
        const welcomeContainer = document.getElementById('user-name') || document.getElementById('welcome-message');
        if (welcomeContainer) {
            const currentName = data.userProfile.name ? data.userProfile.name.trim() : "";
            welcomeContainer.textContent = currentName !== "" ? `Welcome back, ${currentName}` : "Guest Member";
        }

        // 2. Membership Card Information
        const displayPlanName = document.getElementById('membership-plan') || document.getElementById('card-plan-name');
        const displayPlanExpiry = document.getElementById('membership-expiry') || document.getElementById('card-expiry-date');
        const displayPlanStatus = document.getElementById('membership-status') || document.getElementById('card-status-badge');

        if (displayPlanName) displayPlanName.textContent = data.userProfile.membershipPlan;
        if (displayPlanExpiry) displayPlanExpiry.textContent = `Expires: ${data.userProfile.expiryDate}`;

        // 3. Status badge text and conditional style bindings
        if (displayPlanStatus) {
            const currentStatus = data.userProfile.status;
            displayPlanStatus.textContent = currentStatus;
            
            displayPlanStatus.removeAttribute('style'); // Clear previous inline styles on updates
            displayPlanStatus.className = "status-badge";

            if (currentStatus === "Active") {
                displayPlanStatus.style.color = "#22c55e";
                displayPlanStatus.classList.add('status-active');
            } else if (currentStatus === "Expiring Soon") {
                displayPlanStatus.style.color = "#f59e0b";
                displayPlanStatus.classList.add('status-expiring');
            } else if (currentStatus === "Expired") {
                displayPlanStatus.style.color = "#ef4444";
                displayPlanStatus.classList.add('status-expired');
            } else {
                displayPlanStatus.style.color = "#6b7280";
                displayPlanStatus.classList.add('status-unknown');
            }
        }

        // 4. Overview Numeric Statistics Row
        const countSessions = document.getElementById('stat-sessions') || document.getElementById('stat-sessions-count');
        const countPoints = document.getElementById('stat-points') || document.getElementById('stat-reward-points');
        const countPlanOverview = document.getElementById('stat-active-plan');
        const countExpiryOverview = document.getElementById('stat-expiry-overview');

        if (countSessions) countSessions.textContent = data.membershipStats.sessionsCount;
        if (countPoints) countPoints.textContent = data.membershipStats.rewardPoints;
        if (countPlanOverview) countPlanOverview.textContent = data.membershipStats.activePlan;
        if (countExpiryOverview) countExpiryOverview.textContent = data.membershipStats.expiryOverview;

        // 5. Render Recent Activities Feed dynamically
        const activityLogWrapper = document.getElementById('activity-list') || document.getElementById('recent-activities-list');
        if (activityLogWrapper) {
            activityLogWrapper.innerHTML = ""; // Clear existing structural layout placeholders

            if (data.recentActivities && data.recentActivities.length > 0) {
                data.recentActivities.forEach(session => {
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