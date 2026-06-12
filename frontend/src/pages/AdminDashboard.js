import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

// ---- Overview Cards ----
function AdminOverview() {
  const { authFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [defaulters, setDefaulters] = useState([]);

  useEffect(() => {
    authFetch('/api/attendance/stats/overview').then(r => r.json()).then(setStats);
    authFetch('/api/attendance/defaulters').then(r => r.json()).then(setDefaulters);
  }, []);

  return (
    <div className="page">
      <h2>Overview</h2>
      <div className="stat-cards">
        {[
          { label: 'Students', value: stats?.students, color: '#3b82f6' },
          { label: 'Courses', value: stats?.courses, color: '#8b5cf6' },
          { label: 'Sessions Held', value: stats?.sessions, color: '#10b981' },
          { label: 'Defaulters', value: stats?.defaulters, color: '#ef4444' },
        ].map(s => (
          <div className="stat-card" key={s.label} style={{ borderColor: s.color }}>
            <div className="stat-value" style={{ color: s.color }}>{stats ? s.value : '—'}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 36 }}>Defaulters (Below 75%)</h3>
      <table className="data-table">
        <thead><tr><th>Roll No</th><th>Name</th><th>Course</th><th>Attendance %</th></tr></thead>
        <tbody>
          {defaulters.length === 0
            ? <tr><td colSpan={4} className="empty">No defaulters 🎉</td></tr>
            : defaulters.map(d => (
              <tr key={d.student_id + '-' + d.course_id}>
                <td>{d.roll_no}</td>
                <td>{d.student_name}</td>
                <td>{d.course_name}</td>
                <td><span className="badge red">{d.attendance_percentage}%</span></td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Students Management ----
function AdminStudents() {
  const { authFetch } = useAuth();
  const [students, setStudents] = useState([]);
  const [depts, setDepts] = useState([]);
  const [form, setForm] = useState({ name:'', email:'', roll_no:'', dept_id:'', semester:1 });
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    authFetch('/api/students').then(r => r.json()).then(setStudents);
    authFetch('/api/courses/departments/all').then(r => r.json()).then(setDepts);
  };
  useEffect(load, []);

  const handleAdd = async () => {
    const res = await authFetch('/api/students', {
      method: 'POST', body: JSON.stringify({ ...form, password: 'password123' })
    });
    const data = await res.json();
    setMsg(data.message);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete student?')) return;
    await authFetch(`/api/students/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Students</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Student'}
        </button>
      </div>
      {msg && <div className="success-box">{msg}</div>}

      {showForm && (
        <div className="form-card">
          <h3>New Student</h3>
          <div className="form-grid">
            {[['name','Name'],['email','Email'],['roll_no','Roll No']].map(([k,l]) => (
              <div className="field" key={k}>
                <label>{l}</label>
                <input value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} />
              </div>
            ))}
            <div className="field">
              <label>Department</label>
              <select value={form.dept_id} onChange={e => setForm({...form, dept_id: e.target.value})}>
                <option value="">Select</option>
                {depts.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Semester</label>
              <select value={form.semester} onChange={e => setForm({...form, semester: e.target.value})}>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button className="btn-primary" onClick={handleAdd}>Add Student</button>
        </div>
      )}

      <table className="data-table">
        <thead><tr><th>Roll No</th><th>Name</th><th>Email</th><th>Dept</th><th>Sem</th><th>Action</th></tr></thead>
        <tbody>
          {students.map(s => (
            <tr key={s.student_id}>
              <td>{s.roll_no}</td><td>{s.name}</td><td>{s.email}</td>
              <td>{s.dept_name}</td><td>{s.semester}</td>
              <td><button className="btn-danger-sm" onClick={() => handleDelete(s.student_id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Courses Management ----
function AdminCourses() {
  const { authFetch } = useAuth();
  const [courses, setCourses] = useState([]);
  const [depts, setDepts] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ course_name:'', course_code:'', dept_id:'', teacher_id:'', semester:5 });
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    authFetch('/api/courses').then(r => r.json()).then(setCourses);
    authFetch('/api/courses/departments/all').then(r => r.json()).then(setDepts);
    // Fetch teachers via students endpoint workaround: use users list
    authFetch('/api/students').then(r => r.json()); // dummy, teachers from courses data
    // Extract teachers from courses
    authFetch('/api/courses').then(r => r.json()).then(data => {
      const teacherMap = {};
      data.forEach(c => { if (c.teacher_id) teacherMap[c.teacher_id] = c.teacher_name; });
      setTeachers(Object.entries(teacherMap).map(([id, name]) => ({ user_id: id, name })));
    });
  };
  useEffect(load, []);

  const handleAdd = async () => {
    await authFetch('/api/courses', { method: 'POST', body: JSON.stringify(form) });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete course?')) return;
    await authFetch(`/api/courses/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Courses</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Course'}
        </button>
      </div>
      {showForm && (
        <div className="form-card">
          <h3>New Course</h3>
          <div className="form-grid">
            <div className="field"><label>Course Name</label>
              <input value={form.course_name} onChange={e => setForm({...form, course_name: e.target.value})} />
            </div>
            <div className="field"><label>Code</label>
              <input value={form.course_code} onChange={e => setForm({...form, course_code: e.target.value})} />
            </div>
            <div className="field"><label>Department</label>
              <select value={form.dept_id} onChange={e => setForm({...form, dept_id: e.target.value})}>
                <option value="">Select</option>
                {depts.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
              </select>
            </div>
            <div className="field"><label>Semester</label>
              <select value={form.semester} onChange={e => setForm({...form, semester: e.target.value})}>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button className="btn-primary" onClick={handleAdd}>Add Course</button>
        </div>
      )}
      <table className="data-table">
        <thead><tr><th>Code</th><th>Name</th><th>Dept</th><th>Sem</th><th>Teacher</th><th>Action</th></tr></thead>
        <tbody>
          {courses.map(c => (
            <tr key={c.course_id}>
              <td><code>{c.course_code}</code></td><td>{c.course_name}</td>
              <td>{c.dept_name}</td><td>{c.semester}</td>
              <td>{c.teacher_name || '—'}</td>
              <td><button className="btn-danger-sm" onClick={() => handleDelete(c.course_id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const adminLinks = [
  { path: '/admin', label: 'Overview' },
  { path: '/admin/students', label: 'Students' },
  { path: '/admin/courses', label: 'Courses' },
];

export default function AdminDashboard() {
  return (
    <div className="app-layout">
      <Navbar links={adminLinks} />
      <div className="content">
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="courses" element={<AdminCourses />} />
        </Routes>
      </div>
    </div>
  );
}
