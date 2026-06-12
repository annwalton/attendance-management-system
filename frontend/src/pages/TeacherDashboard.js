import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function MarkAttendance() {
  const { authFetch, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    authFetch(`/api/courses/teacher/${user.user_id}`).then(r => r.json()).then(setCourses);
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    authFetch(`/api/courses/${selectedCourse}/students`).then(r => r.json()).then(data => {
      setStudents(data);
      const init = {};
      data.forEach(s => { init[s.student_id] = 'present'; });
      setStatuses(init);
    });
    authFetch(`/api/attendance/sessions/${selectedCourse}`).then(r => r.json()).then(setSessions);
  }, [selectedCourse]);

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => { updated[s.student_id] = status; });
    setStatuses(updated);
  };

  const handleSubmit = async () => {
    const records = students.map(s => ({ student_id: s.student_id, status: statuses[s.student_id] }));
    const res = await authFetch('/api/attendance/session', {
      method: 'POST',
      body: JSON.stringify({ course_id: selectedCourse, session_date: date, records })
    });
    const data = await res.json();
    setMsg({ text: data.message, type: res.ok ? 'success' : 'error' });
    if (res.ok) {
      authFetch(`/api/attendance/sessions/${selectedCourse}`).then(r => r.json()).then(setSessions);
    }
  };

  const statusColors = { present: '#10b981', absent: '#ef4444', late: '#f59e0b' };

  return (
    <div className="page">
      <h2>Mark Attendance</h2>

      <div className="form-row">
        <div className="field">
          <label>Course</label>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
            <option value="">-- Select Course --</option>
            {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_code} – {c.course_name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      {students.length > 0 && (
        <>
          <div className="mark-all-row">
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{students.length} students enrolled</span>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn-sm green" onClick={() => markAll('present')}>All Present</button>
              <button className="btn-sm red" onClick={() => markAll('absent')}>All Absent</button>
            </div>
          </div>

          <div className="student-attendance-grid">
            {students.map(s => (
              <div key={s.student_id} className="student-row">
                <div className="student-info">
                  <span className="roll">{s.roll_no}</span>
                  <span className="sname">{s.name}</span>
                </div>
                <div className="status-btns">
                  {['present','absent','late'].map(st => (
                    <button
                      key={st}
                      className={`status-btn ${statuses[s.student_id] === st ? 'selected' : ''}`}
                      style={statuses[s.student_id] === st ? { background: statusColors[st], borderColor: statusColors[st] } : {}}
                      onClick={() => setStatuses({...statuses, [s.student_id]: st})}
                    >
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {msg.text && <div className={msg.type === 'success' ? 'success-box' : 'error-box'}>{msg.text}</div>}
          <button className="btn-primary" style={{ marginTop: 20 }} onClick={handleSubmit}>
            Submit Attendance
          </button>
        </>
      )}

      {sessions.length > 0 && (
        <>
          <h3 style={{ marginTop: 40 }}>Past Sessions</h3>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Present</th><th>Absent</th><th>Late</th><th>Total</th></tr></thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.session_id}>
                  <td>{s.session_date?.split('T')[0]}</td>
                  <td><span className="badge green">{s.present_count}</span></td>
                  <td><span className="badge red">{s.absent_count}</span></td>
                  <td><span className="badge yellow">{s.late_count}</span></td>
                  <td>{s.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function TeacherReports() {
  const { authFetch, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [report, setReport] = useState([]);

  useEffect(() => {
    authFetch(`/api/courses/teacher/${user.user_id}`).then(r => r.json()).then(setCourses);
  }, []);

  const loadReport = async () => {
    const res = await authFetch(`/api/attendance/course/${selectedCourse}/report`);
    setReport(await res.json());
  };

  const pctColor = (pct) => pct >= 75 ? 'green' : pct >= 60 ? 'yellow' : 'red';

  return (
    <div className="page">
      <h2>Attendance Reports</h2>
      <div className="form-row">
        <div className="field">
          <label>Select Course</label>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
            <option value="">-- Select --</option>
            {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_code} – {c.course_name}</option>)}
          </select>
        </div>
        <button className="btn-primary" style={{ alignSelf:'flex-end' }} onClick={loadReport} disabled={!selectedCourse}>
          Load Report
        </button>
      </div>

      {report.length > 0 && (
        <table className="data-table">
          <thead><tr><th>Roll No</th><th>Name</th><th>Classes Held</th><th>Attended</th><th>%</th></tr></thead>
          <tbody>
            {report.map(r => (
              <tr key={r.student_id}>
                <td>{r.roll_no}</td>
                <td>{r.student_name}</td>
                <td>{r.total_classes}</td>
                <td>{r.attended}</td>
                <td><span className={`badge ${pctColor(r.attendance_percentage)}`}>{r.attendance_percentage ?? 0}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const teacherLinks = [
  { path: '/teacher', label: 'Mark Attendance' },
  { path: '/teacher/reports', label: 'Reports' },
];

export default function TeacherDashboard() {
  return (
    <div className="app-layout">
      <Navbar links={teacherLinks} />
      <div className="content">
        <Routes>
          <Route index element={<MarkAttendance />} />
          <Route path="reports" element={<TeacherReports />} />
        </Routes>
      </div>
    </div>
  );
}
