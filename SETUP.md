# AttendX – Setup Guide (VS Code)

## Prerequisites
Install these before starting:
- Node.js (v18+): https://nodejs.org
- MySQL (v8+): https://dev.mysql.com/downloads/installer/
- VS Code: already installed ✓
- Git (optional): https://git-scm.com

---

## Step 1: Set up the Database

1. Open MySQL Workbench or MySQL CLI
2. Run the schema file:
   ```
   mysql -u root -p < database/schema.sql
   ```
   Or paste the contents of `database/schema.sql` into MySQL Workbench and execute.

---

## Step 2: Set up the Backend

```bash
cd backend
npm install
```

Edit `.env` and set your MySQL password:
```
DB_PASSWORD=your_mysql_password
JWT_SECRET=any_long_random_string_here
```

Start the backend:
```bash
npm run dev   # uses nodemon (auto-restarts on changes)
```
Backend runs at: http://localhost:5000

---

## Step 3: Set up the Frontend

Open a NEW terminal:
```bash
cd frontend
npm install
npm start
```
Frontend runs at: http://localhost:3000

---

## Step 4: Login

Open http://localhost:3000 in your browser.

| Role    | Email                  | Password     |
|---------|------------------------|--------------|
| Admin   | admin@college.edu      | password123  |
| Teacher | priya@college.edu      | password123  |
| Student | arjun@student.edu      | password123  |

---

## VS Code Tips

### Recommended Extensions
- **ESLint** – code linting
- **Prettier** – auto-formatting
- **MySQL** (by cweijan) – run SQL from VS Code
- **Thunder Client** – test your API endpoints

### Run Both Servers Simultaneously
Use VS Code's Split Terminal:
- Terminal 1: `cd backend && npm run dev`
- Terminal 2: `cd frontend && npm start`

---

## Project Structure

```
attendance-app/
├── database/
│   └── schema.sql           ← Run this first
├── backend/
│   ├── .env                 ← Your DB credentials
│   ├── server.js            ← Express entry point
│   ├── db.js                ← MySQL connection pool
│   ├── middleware/
│   │   └── auth.js          ← JWT middleware
│   └── routes/
│       ├── auth.js          ← Login API
│       ├── students.js      ← Student CRUD
│       ├── courses.js       ← Course CRUD
│       └── attendance.js    ← Attendance APIs
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js           ← Routing
        ├── context/
        │   └── AuthContext.js   ← Login state
        ├── pages/
        │   ├── Login.js
        │   ├── AdminDashboard.js
        │   ├── TeacherDashboard.js
        │   └── StudentDashboard.js
        └── components/
            └── Navbar.js
```

---

## API Endpoints Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/students | All students |
| POST | /api/students | Add student |
| GET | /api/courses | All courses |
| GET | /api/courses/teacher/:id | Teacher's courses |
| GET | /api/courses/:id/students | Students in course |
| POST | /api/attendance/session | Mark attendance |
| GET | /api/attendance/student/:id/summary | Student's attendance % |
| GET | /api/attendance/course/:id/report | Course-wise report |
| GET | /api/attendance/defaulters | Below 75% list |
| GET | /api/attendance/stats/overview | Admin dashboard stats |

---

## Common Issues

**"Cannot connect to MySQL"**
→ Check `.env` credentials. Make sure MySQL service is running.

**"Port 3000 already in use"**
→ Run `npx kill-port 3000` or change the port.

**CORS error in browser**
→ Make sure backend is running on port 5000, frontend on 3000.

**"Invalid token" after login**
→ Make sure JWT_SECRET in .env is set and not empty.
