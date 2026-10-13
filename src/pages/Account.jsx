import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser.js";
import { deleteAccount, updateProfile } from "../services/store.js";

export default function Account() {
  const user = useUser();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  async function onUpdate(event) {
    event.preventDefault();
    setSaved("");
    try {
      await updateProfile(new FormData(event.currentTarget).get("name"));
      setError("");
      setSaved("Vardas išsaugotas.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDelete() {
    if (!confirm("Ištrinti paskyrą, skelbimus, temas ir atsakymus?")) return;
    try {
      await deleteAccount();
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return (
      <main className="page">
        <h1>Pirmiausia prisijunkite</h1>
        <Link className="primary" to="/login">Prisijungti</Link>
      </main>
    );
  }

  return (
    <main className="page">
      <p className="kicker">Paskyra</p>
      <h1>{user.name}</h1>
      <p className="note">{user.email}</p>
      {error && <p className="error">{error}</p>}
      {saved && <p className="note">{saved}</p>}
      <form className="form" onSubmit={onUpdate}>
        <label>Vardas
          <input name="name" required minLength={2} maxLength={40} defaultValue={user.name} />
        </label>
        <button className="primary" type="submit">Išsaugoti vardą</button>
      </form>
      <div className="actions">
        <button className="ghost" type="button" onClick={onDelete}>Ištrinti paskyrą</button>
      </div>
    </main>
  );
}
