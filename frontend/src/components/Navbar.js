import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar({ links }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">🎓 <span>AttendX</span></div>
      <div className="nav-links">
        {links.map(l => (
          <NavLink key={l.path} to={l.path} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            {l.label}
          </NavLink>
        ))}
      </div>
      <div className="nav-user">
        <span className={`role-badge ${user?.role}`}>{user?.role}</span>
        <span className="user-name">{user?.name}</span>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
}
