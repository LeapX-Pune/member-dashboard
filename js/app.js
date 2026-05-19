//updated
const AppController = {
    config: {
        version: "1.2.0",
        debug: true
    },

    // Runs foundational script setups in order
    init() {
        this.log("Initializing dashboard application...");

        // 1. Fire content parsing engine 
        this.initDataModule();

        // 2. Set up single-page tab handling structures 
        this.initNavigationModule();

        // 3. Render analytical graph elements
        this.initChartsModule();
    },

    //  template layout rendering machine
    initDataModule() {
        if (typeof window.renderActiveDashboard === "function") {
            window.renderActiveDashboard();
        } else {
            console.error("Error: window.renderActiveDashboard is missing from application paths.");
        }
    },

    // Fallback checks prevent crashes if teammates' tab scripts haven't loaded yet
    initNavigationModule() {
        const tabRouter = window.initializeTabRouter || window.initTabSystem;
        if (typeof tabRouter === "function") {
            tabRouter();
        } else {
            this.warn("Tabs router (js/tabs.js) not ready or implemented yet.");
        }
    },

    // Fallback checks prevent crashes if teammates' chart scripts haven't loaded yet
    initChartsModule() {
        const chartEngine = window.initializeChartCanvasEngines || window.renderAnalyticsCharts || window.initChartEngine;
        if (typeof chartEngine === "function") {
            chartEngine();
        } else {
            this.warn("Charts engine (js/charts.js) not ready or implemented yet.");
        }
    },

    log(msg) {
        if (this.config.debug) console.log(`[App] ${msg}`);
    },

    warn(msg) {
        console.warn(`[App Warning] ${msg}`);
    }
};

// Delays system configuration execution until the document structure resolves fully
document.addEventListener("DOMContentLoaded", () => {
    AppController.init();
});
