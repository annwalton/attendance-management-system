-- ============================================
-- STUDENT ATTENDANCE MANAGEMENT SYSTEM
-- Database Schema + Sample Data
-- ============================================

CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

-- 1. USERS (admin, teacher, student)
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'student') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEPARTMENTS
CREATE TABLE departments (
  dept_id INT PRIMARY KEY AUTO_INCREMENT,
  dept_name VARCHAR(100) NOT NULL,
  dept_code VARCHAR(10) NOT NULL UNIQUE
);

-- 3. COURSES
CREATE TABLE courses (
  course_id INT PRIMARY KEY AUTO_INCREMENT,
  course_name VARCHAR(100) NOT NULL,
  course_code VARCHAR(20) NOT NULL UNIQUE,
  dept_id INT NOT NULL,
  teacher_id INT,
  semester INT NOT NULL,
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id),
  FOREIGN KEY (teacher_id) REFERENCES users(user_id)
);

-- 4. STUDENTS (extends users)
CREATE TABLE students (
  student_id INT PRIMARY KEY,
  roll_no VARCHAR(20) NOT NULL UNIQUE,
  dept_id INT NOT NULL,
  semester INT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

-- 5. ENROLLMENTS (student <-> course)
CREATE TABLE enrollments (
  enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrolled_on DATE DEFAULT (CURRENT_DATE),
  UNIQUE(student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

-- 6. ATTENDANCE SESSIONS (one per class held)
CREATE TABLE attendance_sessions (
  session_id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  session_date DATE NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(course_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- 7. ATTENDANCE RECORDS
CREATE TABLE attendance_records (
  record_id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  student_id INT NOT NULL,
  status ENUM('present', 'absent', 'late') NOT NULL DEFAULT 'absent',
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, student_id),
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(session_id),
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- ============================================
-- USEFUL VIEWS
-- ============================================

-- Attendance percentage per student per course
CREATE VIEW attendance_summary AS
SELECT
  s.student_id,
  u.name AS student_name,
  s.roll_no,
  c.course_id,
  c.course_name,
  c.course_code,
  COUNT(ar.record_id) AS total_classes,
  SUM(CASE WHEN ar.status = 'present' THEN 1
           WHEN ar.status = 'late' THEN 1 ELSE 0 END) AS attended,
  ROUND(
    SUM(CASE WHEN ar.status = 'present' THEN 1
             WHEN ar.status = 'late' THEN 1 ELSE 0 END) * 100.0 /
    NULLIF(COUNT(ar.record_id), 0), 2
  ) AS attendance_percentage
FROM students s
JOIN users u ON s.student_id = u.user_id
JOIN enrollments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
LEFT JOIN attendance_sessions asn ON asn.course_id = c.course_id
LEFT JOIN attendance_records ar ON ar.session_id = asn.session_id AND ar.student_id = s.student_id
GROUP BY s.student_id, u.name, s.roll_no, c.course_id, c.course_name, c.course_code;

-- Defaulters (below 75%)
CREATE VIEW defaulters AS
SELECT * FROM attendance_summary
WHERE attendance_percentage < 75 AND total_classes > 0;

-- ============================================
-- SAMPLE DATA
-- ============================================

INSERT INTO departments VALUES
(1, 'Computer Science & Engineering', 'CSE'),
(2, 'Electronics & Communication', 'ECE'),
(3, 'Mechanical Engineering', 'ME');

-- Passwords are hashed "password123" (bcrypt) - replace in production
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User',        'admin@college.edu',    '$2b$10$rQZ9uAVUE.A9Z1k1o1Wf5OJ6lH3mBpQkN8vXwY2dR4sT7cE0iM1Gy', 'admin'),
('Dr. Priya Nair',    'priya@college.edu',    '$2b$10$rQZ9uAVUE.A9Z1k1o1Wf5OJ6lH3mBpQkN8vXwY2dR4sT7cE0iM1Gy', 'teacher'),
('Prof. Rahul Menon', 'rahul@college.edu',    '$2b$10$rQZ9uAVUE.A9Z1k1o1Wf5OJ6lH3mBpQkN8vXwY2dR4sT7cE0iM1Gy', 'teacher'),
('Arjun Kumar',       'arjun@student.edu',   '$2b$10$rQZ9uAVUE.A9Z1k1o1Wf5OJ6lH3mBpQkN8vXwY2dR4sT7cE0iM1Gy', 'student'),
('Sneha Pillai',      'sneha@student.edu',   '$2b$10$rQZ9uAVUE.A9Z1k1o1Wf5OJ6lH3mBpQkN8vXwY2dR4sT7cE0iM1Gy', 'student'),
('Rohan Das',         'rohan@student.edu',   '$2b$10$rQZ9uAVUE.A9Z1k1o1Wf5OJ6lH3mBpQkN8vXwY2dR4sT7cE0iM1Gy', 'student'),
('Meera Krishnan',    'meera@student.edu',   '$2b$10$rQZ9uAVUE.A9Z1k1o1Wf5OJ6lH3mBpQkN8vXwY2dR4sT7cE0iM1Gy', 'student');

INSERT INTO students VALUES
(4, 'CSE21001', 1, 5),
(5, 'CSE21002', 1, 5),
(6, 'CSE21003', 1, 5),
(7, 'CSE21004', 1, 5);

INSERT INTO courses (course_name, course_code, dept_id, teacher_id, semester) VALUES
('Database Management Systems', 'CS501', 1, 2, 5),
('Operating Systems',           'CS502', 1, 3, 5),
('Computer Networks',           'CS503', 1, 2, 5);

INSERT INTO enrollments (student_id, course_id) VALUES
(4,1),(4,2),(4,3),
(5,1),(5,2),(5,3),
(6,1),(6,2),(6,3),
(7,1),(7,2),(7,3);
