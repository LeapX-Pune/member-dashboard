# 🏋️ Gym / Club Membership Management Dashboard

A modern and responsive Gym & Club Membership Management Dashboard built using HTML, CSS, and JavaScript.

The project supports:
- Desktop 💻
- Tablet 📱
- Mobile 📲

The dashboard includes:
- Settings management
- Dark/light theme system
- Profile management
- Skeleton loaders
- Error-state handling
- Responsive navigation UI

---

# 🚀 Project Overview

This project is designed to simulate a real-world gym or club management dashboard where users can manage settings, profile information, notifications, and dashboard preferences.

The system focuses on:
- Responsive UI/UX
- Dynamic JavaScript interactions
- State handling
- Modern frontend dashboard design

---

# ✨ Main Features

## ⚙️ Settings Tab
- Responsive settings interface
- Tab-based navigation
- Mini-page section switching

---

## 🌙 Theme Toggle
- Light / Dark mode support
- Theme persistence using localStorage
- Global theme switching

---

## 👤 Profile Management
Users can:
- Save personal details
- Edit profile information
- Persist data using localStorage

### Profile Fields
- Full Name
- Email Address
- Phone Number
- Age
- Gender

### Validation Features
- Email format validation
- 10-digit phone number validation

---

## 🔔 Notification Preferences
- Membership notifications
- Email alerts
- Push notification preferences

---

## 🚪 Logout System
- Logout success banner
- Loading state while signing out
- localStorage/session cleanup

---

# 💀 Skeleton Loaders

Skeleton loaders are displayed before dashboard content loads.

Purpose:
- Improve user experience
- Prevent blank-screen loading
- Simulate real dashboard data fetching

Implemented using:
- CSS shimmer animation
- JavaScript setTimeout()

---

# 🚨 Error-State Handling

The dashboard includes dynamic error banners for handling failures gracefully.

## Supported Error States

### ⚠ No Data
Displayed when dataset is empty.

Example:
```txt
⚠ No membership data available
```

---

### 🌐 No Internet
Displayed when network failure is simulated.

Example:
```txt
⚠ No internet connection
```

---

### 📊 Invalid Chart Data
Displayed when chart data is malformed or missing.

Example:
```txt
⚠ Invalid chart data detected
```

These banners prevent broken layouts and improve user feedback.

---

# 📱 Responsive Design

The dashboard is optimized for:
- Desktop
- Tablet
- Mobile devices

Responsive improvements include:
- Flexible layouts
- Adaptive spacing
- Mobile navigation support
- Responsive settings panel

---

# 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript (Vanilla JS)
- localStorage API

---

# 📂 Folder Structure

```txt
project-root/
│
├── index.html
├── style.css
├── script.js
├── README.md
│
├── assets/
│   ├── images/
│   └── icons/
│
└── charts/
    └── charts.js
```

---

# ▶️ How to Launch the Project

## Option 1 — Open Directly

Open:

```txt
index.html
```

in your browser.

---

## Option 2 — Run Using Local Server (Recommended)

Using VS Code Live Server:

1. Open project folder in VS Code
2. Install Live Server extension
3. Right click `index.html`
4. Click:

```txt
Open with Live Server
```

---

# 🧪 Testing Instructions

## ✅ Functional Testing

Verify:
- Tab switching works correctly
- Theme toggle changes global theme
- Theme persists after reload
- Profile form validation works
- Skeleton loader appears on load
- Error banners display properly
- Logout system works
- Mobile responsiveness works

---

## ✅ Error-State Testing

Test these conditions manually:

| Condition | Expected Result |
|---|---|
| Empty dataset | No data banner appears |
| Simulated failed fetch | No internet banner appears |
| Invalid chart data | Invalid chart banner appears |

---

## ✅ Browser Console Testing

Open DevTools and verify:

```txt
No JavaScript errors in console
```

---

## ✅ Mobile Testing

Use:
- Chrome DevTools responsive mode
- Real mobile device testing

---


# 🔗 Important Files

| File | Purpose |
|---|---|
| `index.html` | Main dashboard structure |
| `style.css` | Styling and responsive UI |
| `script.js` | JavaScript functionality |
| `charts/charts.js` | Chart.js implementation |

---

# 📌 Future Improvements

- Backend integration
- Database support
- User authentication
- Attendance tracking
- Membership analytics
- API integration
- Real-time notifications

---

# 👤 Author

Developed by Sai 

---
