// It is Mock Data or fake database.
const mockData = {
    userProfile: {
        name: "Devansh Mittal",
        membershipPlan: "Premium Pro",
        expiryDate: "December 31, 2026",
        status: "Active"
    },
    membershipStats: {
        activePlan: "Gold Member",
        expiryStatus: "Valid",
        sessionsCount: 42,
        rewardPoints: 1250
    },
    recentActivities: [
        { date: "2026-05-10", activity: "Morning Yoga" },
        { date: "2026-05-12", activity: "Weight Training" }
    ]
};

window.mockData = mockData;
