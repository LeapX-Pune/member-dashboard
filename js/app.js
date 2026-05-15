// js/app.js

window.addEventListener('DOMContentLoaded', () => {
    // Check if our "Filing Cabinet" exists
    if (!window.mockData) {
        console.error("Data.js is missing!");
        return;
    }

    // This is our main "Worker" function that puts data on the screen
    const injectData = () => {
        const data = window.mockData;

        // 1. Name Injection (with "Guest" protection)
        const nameEl = document.getElementById('user-name');
        if (nameEl) {
            // If name is empty (""), use "Guest Member" instead
            nameEl.textContent = data.userProfile.name || "Guest Member";
        }

        // 2. Status Styling (The "If/Then" logic)
        const statusEl = document.getElementById('membership-status');
        if (statusEl) {
            const currentStatus = data.userProfile.status;
            statusEl.textContent = currentStatus;

            // Remove any old colors first
            statusEl.classList.remove('text-green', 'text-red', 'text-orange');

            // Apply new colors based on the status word
            if (currentStatus === "Active") {
                statusEl.style.color = "green";
            } else if (currentStatus === "Expired") {
                statusEl.style.color = "red";
            } else if (currentStatus === "Expiring Soon") {
                statusEl.style.color = "orange";
            }
        }

        // 3. Stats Injection (Sessions and Points) [cite: 113]
        const sessionsEl = document.getElementById('stat-sessions');
        const pointsEl = document.getElementById('stat-points');

        if (sessionsEl) sessionsEl.textContent = data.membershipStats.sessionsCount;
        if (pointsEl) pointsEl.textContent = data.membershipStats.rewardPoints;
    };

    // Run the function!
    injectData();
});
