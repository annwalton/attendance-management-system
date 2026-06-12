const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// POST create session + mark attendance (teacher)
router.post('/session', auth(['teacher', 'admin']), async (req, res) => {
  const { course_id, session_date, records } = req.body;
  // records: [{ student_id, status }]
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Check for duplicate session
    const [existing] = await conn.query(
      'SELECT session_id FROM attendance_sessions WHERE course_id=? AND session_date=?',
      [course_id, session_date]
    );
    if (existing.length) {
      await conn.rollback();
      return res.status(400).json({ message: 'Session already exists for this date' });
    }

    const [sessionResult] = await conn.query(
      'INSERT INTO attendance_sessions (course_id, session_date, created_by) VALUES (?,?,?)',
      [course_id, session_date, req.user.user_id]
    );
    const session_id = sessionResult.insertId;

    for (const r of records) {
      await conn.query(
        'INSERT INTO attendance_records (session_id, student_id, status) VALUES (?,?,?)',
        [session_id, r.student_id, r.status]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Attendance marked', session_id });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally { conn.release(); }
});

// GET sessions for a course
router.get('/sessions/:course_id', auth(['teacher', 'admin']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.session_id, s.session_date, s.created_at,
             u.name AS marked_by,
             COUNT(r.record_id) AS total,
             SUM(r.status = 'present') AS present_count,
             SUM(r.status = 'absent') AS absent_count,
             SUM(r.status = 'late') AS late_count
      FROM attendance_sessions s
      JOIN users u ON s.created_by = u.user_id
      LEFT JOIN attendance_records r ON r.session_id = s.session_id
      WHERE s.course_id = ?
      GROUP BY s.session_id
      ORDER BY s.session_date DESC
    `, [req.params.course_id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET records for a session
router.get('/session/:session_id/records', auth(['teacher', 'admin']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.record_id, r.status, s.student_id, u.name, st.roll_no
      FROM attendance_records r
      JOIN students st ON r.student_id = st.student_id
      JOIN users u ON st.student_id = u.user_id
      LEFT JOIN attendance_sessions s ON r.session_id = s.session_id
      WHERE r.session_id = ?
    `, [req.params.session_id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update a single record
router.put('/record/:record_id', auth(['teacher', 'admin']), async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE attendance_records SET status=? WHERE record_id=?',
      [status, req.params.record_id]);
    res.json({ message: 'Record updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET attendance summary for a student (all courses)
router.get('/student/:student_id/summary', auth(), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM attendance_summary WHERE student_id = ?',
      [req.params.student_id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET attendance report for a course (all students)
router.get('/course/:course_id/report', auth(['teacher', 'admin']), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM attendance_summary WHERE course_id = ? ORDER BY attendance_percentage ASC',
      [req.params.course_id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET defaulters list
router.get('/defaulters', auth(['admin', 'teacher']), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM defaulters ORDER BY attendance_percentage ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET overall stats (admin dashboard)
router.get('/stats/overview', auth(['admin']), async (req, res) => {
  try {
    const [[studentCount]] = await db.query('SELECT COUNT(*) AS count FROM students');
    const [[courseCount]]  = await db.query('SELECT COUNT(*) AS count FROM courses');
    const [[sessionCount]] = await db.query('SELECT COUNT(*) AS count FROM attendance_sessions');
    const [[defaulterCount]] = await db.query('SELECT COUNT(DISTINCT student_id) AS count FROM defaulters');
    res.json({
      students: studentCount.count,
      courses: courseCount.count,
      sessions: sessionCount.count,
      defaulters: defaulterCount.count
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
