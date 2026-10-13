import { useSyncExternalStore } from "react";
import { Link, NavLink, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { currentUser, logout, subscribe } from "./store.js";
import Home from "./pages/Home.jsx";
import Jobs, { JobPage, NewJob } from "./pages/Jobs.jsx";
import Forum, { NewTopic, TopicPage } from "./pages/Forum.jsx";
import { Login, Register } from "./pages/Auth.jsx";

function useUser() {
  return useSyncExternalStore(subscribe, currentUser, currentUser);
}

function Layout() {
  const user = useUser();
  const navigate = useNavigate();

  function onLogout() {
    logout();
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
              <span className="who">{user.name}</span>
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

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/new" element={<NewJob />} />
        <Route path="jobs/:id" element={<JobPage />} />
        <Route path="forum" element={<Forum />} />
        <Route path="forum/new" element={<NewTopic />} />
        <Route path="forum/:id" element={<TopicPage />} />
        <Route path="register" element={<Register />} />
        <Route path="login" element={<Login />} />
      </Route>
    </Routes>
  );
}
