
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

// REAL-TIME SIMULATION
const stats = window.mockData.membershipStats;
// Dom Elements
const sessionsEl = document.getElementById('stat-sessions');
const pointsEl = document.getElementById('stat-points');
const statusEl = document.getElementById('membership-status');
// Status option
const statuses = [
    "Active",
    "Expiring Soon",
    "Expired"
];
// Animation Function
function animateElement(element) {
if (!element) return;

    element.classList.add('live-update');

    setTimeout(() => {
        element.classList.remove('live-update');
    }, 500);
}
// Update points
function updatePoints() {

    const randomChange =
        Math.floor(Math.random() * 20) - 5;

    stats.rewardPoints += randomChange;

    if (stats.rewardPoints < 0) {
        stats.rewardPoints = 0;
    }

    if (pointsEl) {
        pointsEl.textContent = stats.rewardPoints;
        animateElement(pointsEl);
    }
}
// Update Session
function updateSessions() {

    stats.sessionsCount += 1;

    if (sessionsEl) {
        sessionsEl.textContent = stats.sessionsCount;
        animateElement(sessionsEl);
    }
}
// Update status
function updateStatus() {

    const randomStatus =
        statuses[
            Math.floor(Math.random() * statuses.length)
        ];

    window.mockData.userProfile.status =
        randomStatus;

if (statusEl) {
 statusEl.textContent = randomStatus;
// Reset colors
        statusEl.style.color = "";
// Status colors
        if (randomStatus === "Active") {
            statusEl.style.color = "#22c55e";
        }

        if (randomStatus === "Expired") {
            statusEl.style.color = "#ef4444";
        }

        if (randomStatus === "Expiring Soon") {
            statusEl.style.color = "#f59e0b";
        }
         animateElement(statusEl);
    }
}
// Main loop
setInterval(() => {

    const randomUpdate =
        Math.floor(Math.random() * 3);

    switch(randomUpdate) {

        case 0:
            updatePoints();
            break;

        case 1:
            updateSessions();
            break;

        case 2:
            updateStatus();
            break;
    }

}, 2000);