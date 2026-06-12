import { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function AttendanceMeter({ percentage }) {
  const color = percentage >= 75 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 60, height: 8, borderRadius: 4,
        background: 'rgba(255,255,255,0.1)', overflow: 'hidden'
      }}>
        <div style={{ width: `${percentage}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <span className={`badge ${percentage >= 75 ? 'green' : percentage >= 60 ? 'yellow' : 'red'}`}>
        {percentage ?? 0}%
      </span>
    </div>
  );
}

export default function StudentDashboard() {
  const { authFetch, user } = useAuth();
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`/api/attendance/student/${user.user_id}/summary`)
      .then(r => r.json())
      .then(data => { setSummary(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const overall = summary.length
    ? Math.round(summary.reduce((s, c) => s + (c.attendance_percentage || 0), 0) / summary.length)
    : 0;

  const chartData = [{ name: 'Attendance', value: overall, fill: overall >= 75 ? '#10b981' : overall >= 60 ? '#f59e0b' : '#ef4444' }];

  const studentLinks = [{ path: '/student', label: 'My Attendance' }];

  return (
    <div className="app-layout">
      <Navbar links={studentLinks} />
      <div className="content">
        <div className="page">
          <h2>My Attendance</h2>

          <div className="student-overview">
            <div className="overview-gauge">
              <p className="gauge-label">Overall</p>
              <div style={{ width: 160, height: 160, margin: '0 auto' }}>
                <ResponsiveContainer>
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={chartData} startAngle={90} endAngle={90 - 3.6 * overall}>
                    <RadialBar dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <p className="gauge-pct">{overall}%</p>
              <p className="gauge-sub">{overall >= 75 ? '✅ Eligible' : '⚠️ Below minimum'}</p>
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 16 }}>
                {summary.length} courses enrolled
              </p>
              {loading ? <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p> : (
                <table className="data-table">
                  <thead><tr><th>Code</th><th>Course</th><th>Classes</th><th>Attended</th><th>Attendance</th></tr></thead>
                  <tbody>
                    {summary.map(c => (
                      <tr key={c.course_id}>
                        <td><code>{c.course_code}</code></td>
                        <td>{c.course_name}</td>
                        <td>{c.total_classes}</td>
                        <td>{c.attended}</td>
                        <td><AttendanceMeter percentage={c.attendance_percentage} /></td>
                      </tr>
                    ))}
                    {summary.length === 0 && (
                      <tr><td colSpan={5} className="empty">No attendance data yet</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="info-box" style={{ marginTop: 24 }}>
            <strong>ℹ️ Minimum attendance requirement:</strong> 75% per course.
            Students below this threshold may be barred from exams.
          </div>
        </div>
      </div>
    </div>
  );
}
