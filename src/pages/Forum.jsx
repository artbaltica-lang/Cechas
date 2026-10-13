import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { addReply, addTopic, authorName, currentUser, getTopic, listTopics } from "../store.js";

function when(iso) {
  return new Date(iso).toLocaleString("lt-LT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function Forum() {
  const topics = listTopics();
  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <p className="kicker">Pokalbis</p>
          <h1>Forumas</h1>
        </div>
        <Link className="primary" to="/forum/new">Nauja tema</Link>
      </div>
      <div className="board">
        {topics.length === 0 && <p className="note">Temų dar nėra. Atidarykite pirmąją.</p>}
        {topics.map((topic) => (
          <Link className="row" key={topic.id} to={`/forum/${topic.id}`}>
            <strong>{topic.title}</strong>
            <span className="meta">{authorName(topic.authorId)} · atsakymų: {topic.replies} · {when(topic.createdAt)}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

export function TopicPage() {
  const { id } = useParams();
  const topic = getTopic(id);
  const user = currentUser();
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [, refresh] = useState(0);

  if (!topic) return <main className="page"><h1>Tokios temos nėra.</h1></main>;

  function onSubmit(event) {
    event.preventDefault();
    try {
      addReply(id, text);
      setText("");
      setError("");
      refresh((value) => value + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  const fresh = getTopic(id);

  return (
    <main className="page">
      <p className="kicker">Tema</p>
      <h1>{fresh.title}</h1>
      <p className="meta">{authorName(fresh.authorId)} · {when(fresh.createdAt)}</p>
      <article className="sheet">
        <p>{fresh.body}</p>
        {fresh.replies.map((reply) => (
          <div className="reply" key={reply.id}>
            <p className="meta">{authorName(reply.authorId)} · {when(reply.createdAt)}</p>
            <p>{reply.body}</p>
          </div>
        ))}
      </article>
      {user ? (
        <form className="form" onSubmit={onSubmit}>
          {error && <p className="error">{error}</p>}
          <label>Atsakymas
            <textarea value={text} onChange={(event) => setText(event.target.value)} required />
          </label>
          <button className="primary" type="submit">Atsakyti</button>
        </form>
      ) : (
        <p className="note">Norėdami atsakyti, <Link to="/login">prisijunkite</Link> arba <Link to="/register">registruokitės</Link>.</p>
      )}
    </main>
  );
}

export function NewTopic() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const user = currentUser();

  function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const topic = addTopic({ title: data.get("title"), body: data.get("body") });
      navigate(`/forum/${topic.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return (
      <main className="page">
        <h1>Pirmiausia registracija</h1>
        <p className="lede">Temą atidaro cecho dalyvis.</p>
        <Link className="primary" to="/register">Sukurti paskyrą</Link>
      </main>
    );
  }

  return (
    <main className="page">
      <p className="kicker">Forumas</p>
      <h1>Nauja tema</h1>
      <form className="form" onSubmit={onSubmit}>
        {error && <p className="error">{error}</p>}
        <label>Pavadinimas
          <input name="title" required maxLength={140} />
        </label>
        <label>Žinutė
          <textarea name="body" required maxLength={4000} />
        </label>
        <button className="primary" type="submit">Paskelbti</button>
      </form>
    </main>
  );
}
