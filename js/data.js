
// 1. ALL REGISTERED USERS 
const allUsers = [
    { name: "Sankap Tiwari", plan: "Premium Pro", sessions: 45, points: 1250, status: "Active" },
    { name: "Ksitij", plan: "Basic", sessions: 12, points: 350, status: "Active" },
    { name: "Shouryaman Bisen", plan: "Elite", sessions: 88, points: 2500, status: "Active" },
    { name: "Pulak Shah", plan: "Pro", sessions: 30, points: 800, status: "Expiring Soon" },
    { name: "Anikit Bhalke", plan: "Premium", sessions: 55, points: 1500, status: "Active" },
    { name: "Sai Shendege", plan: "Basic", sessions: 5, points: 100, status: "Expired" },
    { name: "Rehan Azim", plan: "Elite", sessions: 72, points: 1900, status: "Active" },
    { name: "", plan: "N/A", sessions: 0, points: 0, status: "Unknown" }
];

// 2. THE MASTER MOCK DATA OBJECT
const mockData = {
    // Basic Profile 
    userProfile: {
        name: allUsers[0].name,
        membershipPlan: allUsers[0].plan,
        expiryDate: "December 31, 2026",
        status: allUsers[0].status,
        memberSince: "January 2024"
    },

    // Numeric Stats for Overview Cards
    membershipStats: {
        activePlan: allUsers[0].plan,
        expiryStatus: "Valid",
        sessionsCount: allUsers[0].sessions,
        rewardPoints: allUsers[0].points,
        totalHours: 124,
        avgHeartRate: 72
    },

    // DATA FOR CHARTS
    
    // Line Chart: Activity Trends 
    activity_weekly: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        data: [1, 2, 0, 3, 2, 4, 1] // Hours spent per day
    },
    activity_monthly: {
        labels: Array.from({length: 30}, (_, i) => `Day ${i + 1}`),
        data: [1, 2, 0, 3, 2, 4, 1, 0, 2, 3, 1, 5, 0, 1, 2, 3, 4, 1, 0, 2, 3, 1, 1, 2, 0, 3, 2, 4, 1, 2]
    },
    activity_yearly: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        data: [20, 18, 25, 30, 22, 15, 10, 5, 20, 28, 35, 40]
    },

    // Doughnut Chart: Usage Distribution 
    membershipUsage: {
        labels: ["Used Sessions", "Available Sessions", "Pending"],
        data: [45, 15, 5] // Must total the plan limit
    },

    // LONG ACTIVITY LOG (For "Live" feel) 
    recentActivities: [
        { date: "2026-05-15", time: "09:00 AM", activity: "High Intensity Interval Training", duration: "45m" },
        { date: "2026-05-14", time: "06:30 PM", activity: "Yoga Flow & Meditation", duration: "60m" },
        { date: "2026-05-12", time: "07:00 AM", activity: "Heavy Strength Training", duration: "90m" },
        { date: "2026-05-10", time: "05:00 PM", activity: "Swimming Laps", duration: "30m" },
        { date: "2026-05-08", time: "08:15 AM", activity: "Morning Cardio (Run)", duration: "40m" },
        { date: "2026-05-07", time: "06:00 PM", activity: "Zumba Class", duration: "60m" },
        { date: "2026-05-05", time: "07:30 AM", activity: "Personal Training Session", duration: "60m" },
        { date: "2026-05-03", time: "10:00 AM", activity: "Cycling / Spin Class", duration: "45m" }
    ]
};

// GLOBAL EXPORTS
window.mockData = mockData;
window.allUsers = allUsers;
