import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="bg-indigo-700 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow">
      <Link to="/" className="text-xl font-bold tracking-tight">
        CareerPilot AI
      </Link>
      <div className="flex items-center gap-4 flex-wrap text-sm font-medium">
        {user ? (
          <>
            <Link to="/dashboard" className="hover:text-indigo-200 transition">Dashboard</Link>
            <Link to="/jobs" className="hover:text-indigo-200 transition">Jobs</Link>
            <span className="text-indigo-300 hidden sm:inline">{user.full_name}</span>
            <button
              onClick={handleLogout}
              className="bg-white text-indigo-700 px-3 py-1 rounded hover:bg-indigo-100 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-indigo-200 transition">Login</Link>
            <Link
              to="/signup"
              className="bg-white text-indigo-700 px-3 py-1 rounded hover:bg-indigo-100 transition"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
