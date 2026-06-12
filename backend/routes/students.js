const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const auth = require('../middleware/auth');

// GET all students (admin, teacher)
router.get('/', auth(['admin', 'teacher']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.student_id, u.name, u.email, s.roll_no, d.dept_name, s.semester
      FROM students s
      JOIN users u ON s.student_id = u.user_id
      JOIN departments d ON s.dept_id = d.dept_id
      ORDER BY s.roll_no
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single student
router.get('/:id', auth(), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.student_id, u.name, u.email, s.roll_no, d.dept_name, d.dept_id, s.semester
      FROM students s
      JOIN users u ON s.student_id = u.user_id
      JOIN departments d ON s.dept_id = d.dept_id
      WHERE s.student_id = ?
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Student not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create student (admin)
router.post('/', auth(['admin']), async (req, res) => {
  const { name, email, password, roll_no, dept_id, semester } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const hash = await bcrypt.hash(password || 'password123', 10);
    const [userResult] = await conn.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)',
      [name, email, hash, 'student']
    );
    const userId = userResult.insertId;
    await conn.query(
      'INSERT INTO students (student_id, roll_no, dept_id, semester) VALUES (?,?,?,?)',
      [userId, roll_no, dept_id, semester]
    );
    await conn.commit();
    res.status(201).json({ message: 'Student created', student_id: userId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally { conn.release(); }
});

// PUT update student (admin)
router.put('/:id', auth(['admin']), async (req, res) => {
  const { name, email, roll_no, dept_id, semester } = req.body;
  try {
    await db.query('UPDATE users SET name=?, email=? WHERE user_id=?', [name, email, req.params.id]);
    await db.query('UPDATE students SET roll_no=?, dept_id=?, semester=? WHERE student_id=?',
      [roll_no, dept_id, semester, req.params.id]);
    res.json({ message: 'Student updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE student (admin)
router.delete('/:id', auth(['admin']), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM enrollments WHERE student_id=?', [req.params.id]);
    await conn.query('DELETE FROM students WHERE student_id=?', [req.params.id]);
    await conn.query('DELETE FROM users WHERE user_id=?', [req.params.id]);
    await conn.commit();
    res.json({ message: 'Student deleted' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally { conn.release(); }
});

// GET student's enrolled courses
router.get('/:id/courses', auth(), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.course_id, c.course_name, c.course_code, c.semester, u.name AS teacher_name
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      JOIN users u ON c.teacher_id = u.user_id
      WHERE e.student_id = ?
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
