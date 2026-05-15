
window.addEventListener('DOMContentLoaded', () => {
    // 1. Verify Data Exists
    if (!window.mockData) {
        console.error("Critical Error: mockData not found!");
        return;
    }

    // This function can be called again later if the data changes
    const renderDashboard = () => {
        const data = window.mockData;

        // --- NAME INJECTION 
        const nameEl = document.getElementById('user-name');
        if (nameEl) {
            // If name is blank, show "Guest Member"
            nameEl.textContent = data.userProfile.name || "Guest Member";
        }

        // --- MEMBERSHIP CARD 
        const planEl = document.getElementById('membership-plan');
        const expiryEl = document.getElementById('membership-expiry');
        const statusEl = document.getElementById('membership-status');

        if (planEl) planEl.textContent = data.userProfile.membershipPlan;
        if (expiryEl) expiryEl.textContent = data.userProfile.expiryDate;

        // --- STATUS COLOR CODING 
        if (statusEl) {
            statusEl.textContent = data.userProfile.status;
            // Clear existing styles
            statusEl.style.color = ""; 
            
            // Apply logic based on status
            if (data.userProfile.status === "Active") statusEl.style.color = "#22c55e"; // Green
            if (data.userProfile.status === "Expired") statusEl.style.color = "#ef4444"; // Red
            if (data.userProfile.status === "Expiring Soon") statusEl.style.color = "#f59e0b"; // Orange
        }

        // --- STATISTICS 
        const sessionEl = document.getElementById('stat-sessions');
        const pointsEl = document.getElementById('stat-points');

        if (sessionEl) sessionEl.textContent = data.membershipStats.sessionsCount;
        if (pointsEl) pointsEl.textContent = data.membershipStats.rewardPoints;

        // --- RECENT ACTIVITY LIST 
        const activityList = document.getElementById('activity-list');
        if (activityList) {
            activityList.innerHTML = ""; 
            data.recentActivities.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${item.date}</span> - <strong>${item.activity}</strong>`;
                activityList.appendChild(li);
            });
        }
    };

    renderDashboard();
});
