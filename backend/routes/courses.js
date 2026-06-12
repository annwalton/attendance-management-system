const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET all courses
router.get('/', auth(), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.course_id, c.course_name, c.course_code, c.semester,
             d.dept_name, u.name AS teacher_name, u.user_id AS teacher_id
      FROM courses c
      JOIN departments d ON c.dept_id = d.dept_id
      LEFT JOIN users u ON c.teacher_id = u.user_id
      ORDER BY c.course_code
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET courses by teacher
router.get('/teacher/:id', auth(['admin', 'teacher']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.course_id, c.course_name, c.course_code, c.semester, d.dept_name
      FROM courses c JOIN departments d ON c.dept_id = d.dept_id
      WHERE c.teacher_id = ?
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create course (admin)
router.post('/', auth(['admin']), async (req, res) => {
  const { course_name, course_code, dept_id, teacher_id, semester } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO courses (course_name, course_code, dept_id, teacher_id, semester) VALUES (?,?,?,?,?)',
      [course_name, course_code, dept_id, teacher_id, semester]
    );
    res.status(201).json({ message: 'Course created', course_id: result.insertId });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update course (admin)
router.put('/:id', auth(['admin']), async (req, res) => {
  const { course_name, course_code, dept_id, teacher_id, semester } = req.body;
  try {
    await db.query(
      'UPDATE courses SET course_name=?, course_code=?, dept_id=?, teacher_id=?, semester=? WHERE course_id=?',
      [course_name, course_code, dept_id, teacher_id, semester, req.params.id]
    );
    res.json({ message: 'Course updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE course (admin)
router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    await db.query('DELETE FROM courses WHERE course_id=?', [req.params.id]);
    res.json({ message: 'Course deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET students enrolled in a course
router.get('/:id/students', auth(['admin', 'teacher']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.student_id, u.name, s.roll_no
      FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      JOIN users u ON s.student_id = u.user_id
      WHERE e.course_id = ?
      ORDER BY s.roll_no
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST enroll student in course (admin)
router.post('/:id/enroll', auth(['admin']), async (req, res) => {
  const { student_id } = req.body;
  try {
    await db.query('INSERT INTO enrollments (student_id, course_id) VALUES (?,?)',
      [student_id, req.params.id]);
    res.status(201).json({ message: 'Student enrolled' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET departments
router.get('/departments/all', auth(), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM departments');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
