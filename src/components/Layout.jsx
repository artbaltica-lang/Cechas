import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser.js";
import { logout } from "../services/store.js";

export default function Layout() {
  const user = useUser();
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="shell">
      <header className="site-header">
        <Link className="brand" to="/">Cechas</Link>
        <nav className="nav" aria-label="Skyriai">
          <NavLink to="/jobs">Darbas</NavLink>
          <NavLink to="/forum">Forumas</NavLink>
          {user ? (
            <>
              <NavLink to="/paskyra">{user.name}</NavLink>
              <button className="ghost" type="button" onClick={onLogout}>Atsijungti</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Prisijungti</NavLink>
              <NavLink className="primary" to="/register">Registracija</NavLink>
            </>
          )}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
