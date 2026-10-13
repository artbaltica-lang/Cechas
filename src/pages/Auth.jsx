import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, register } from "../store.js";

export function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await register({
        name: data.get("name"),
        email: data.get("email"),
        password: data.get("password")
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="page">
      <p className="kicker">Dalyviai</p>
      <h1>Registracija</h1>
      <p className="lede">Vardas, el. paštas ir slaptažodis. Po to galima siūlyti darbą ir rašyti forume.</p>
      <form className="form" onSubmit={onSubmit}>
        {error && <p className="error">{error}</p>}
        <label>Vardas
          <input name="name" required minLength={2} maxLength={40} autoComplete="name" />
        </label>
        <label>El. paštas
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>Slaptažodis
          <input name="password" type="password" required minLength={6} autoComplete="new-password" />
        </label>
        <button className="primary" type="submit">Sukurti paskyrą</button>
      </form>
      <p className="note">Jau turite paskyrą? <Link to="/login">Prisijunkite</Link></p>
    </main>
  );
}

export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await login(data.get("email"), data.get("password"));
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="page">
      <p className="kicker">Dalyviai</p>
      <h1>Prisijungti</h1>
      <form className="form" onSubmit={onSubmit}>
        {error && <p className="error">{error}</p>}
        <label>El. paštas
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>Slaptažodis
          <input name="password" type="password" required minLength={6} autoComplete="current-password" />
        </label>
        <button className="primary" type="submit">Prisijungti</button>
      </form>
      <p className="note">Dar neturite paskyros? <Link to="/register">Registruokitės</Link></p>
    </main>
  );
}
