# 🎓 Attendance Management System

A full-stack, role-based web application for managing student attendance across courses — built with React, Node.js/Express, and MySQL.

---

## 📌 Overview

Managing attendance manually is slow, error-prone, and hard to report on. This system digitizes the entire workflow — from admin setup to real-time student dashboards — with strict role-based access at every layer.

Three roles. One system. No spreadsheets.

---

## ✨ Features

### 👤 Admin
- Create and manage student and teacher accounts
- Set up courses and assign teachers
- View attendance records across all courses

### 👩‍🏫 Teacher
- Mark attendance for enrolled students per session
- View course-wise attendance history

### 🎒 Student
- View real-time attendance percentage per course
- Track session-level attendance history

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Axios |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | Role-based access control (RBAC) |

---

## 🗂️ Project Structure

```
attendance-management-system/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Admin, Teacher, Student views
│   │   └── api/             # Axios API calls
├── server/                  # Express backend
│   ├── routes/              # API route definitions
│   ├── controllers/         # Business logic
│   ├── models/              # MySQL schema & queries
│   └── middleware/          # Auth & role guards
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+
- MySQL 8+
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/annwalton/attendance-management-system.git
cd attendance-management-system
```

### 2. Set up the database
```bash
# Create a MySQL database
mysql -u root -p
CREATE DATABASE attendance_db;
```

Import the schema:
```bash
mysql -u root -p attendance_db < server/schema.sql
```

### 3. Configure environment variables

Create a `.env` file in the `server/` directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=attendance_db
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 4. Install dependencies & run

```bash
# Backend
cd server
npm install
npm start

# Frontend (in a new terminal)
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` · Backend on `http://localhost:5000`

---

## 🔐 Role Access Summary

| Feature | Admin | Teacher | Student |
|---|:---:|:---:|:---:|
| Manage users | ✅ | ❌ | ❌ |
| Manage courses | ✅ | ❌ | ❌ |
| Mark attendance | ❌ | ✅ | ❌ |
| View own attendance | ❌ | ❌ | ✅ |
| View all records | ✅ | ❌ | ❌ |

---

## 🚧 Roadmap

- [ ] Email/SMS notifications for low attendance
- [ ] Export attendance reports as CSV/PDF
- [ ] Mobile-responsive redesign
- [ ] Docker containerization

---

## 👩‍💻 Author

**Ann Mary Walton** · [GitHub](https://github.com/annwalton) · [LinkedIn](https://linkedin.com/in/ann-mary-walton)
