import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../hooks/useUser.js";
import {
  addReply,
  addTopic,
  deleteReply,
  deleteTopic,
  getTopic,
  listTopics,
  updateReply,
  updateTopic
} from "../services/store.js";

function when(iso) {
  return new Date(iso).toLocaleString("lt-LT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function Forum() {
  const [topics, setTopics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    listTopics()
      .then((rows) => {
        if (live) setTopics(rows);
      })
      .catch((err) => {
        if (live) setError(err.message);
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <p className="kicker">Pokalbis</p>
          <h1>Forumas</h1>
        </div>
        <Link className="primary" to="/forum/new">Nauja tema</Link>
      </div>
      {error && <p className="error">{error}</p>}
      {topics === null && !error && <p className="note">Kraunama…</p>}
      <div className="board">
        {topics && topics.length === 0 && <p className="note">Temų dar nėra. Atidarykite pirmąją.</p>}
        {(topics || []).map((topic) => (
          <Link className="row" key={topic.id} to={`/forum/${topic.id}`}>
            <strong>{topic.title}</strong>
            <span className="meta">{topic.authorName} · atsakymų: {topic.replies} · {when(topic.createdAt)}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

export function TopicPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useUser();
  const [topic, setTopic] = useState(undefined);
  const [editing, setEditing] = useState(false);
  const [replyEdit, setReplyEdit] = useState(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");

  function load() {
    return getTopic(id).then(setTopic);
  }

  useEffect(() => {
    let live = true;
    getTopic(id)
      .then((row) => {
        if (live) setTopic(row);
      })
      .catch((err) => {
        if (live) setError(err.message);
      });
    return () => {
      live = false;
    };
  }, [id]);

  async function onReply(event) {
    event.preventDefault();
    try {
      const next = await addReply(id, text);
      setTopic(next);
      setText("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function onUpdateTopic(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const next = await updateTopic(id, { title: data.get("title"), body: data.get("body") });
      setTopic(next);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDeleteTopic() {
    if (!confirm("Ištrinti temą ir jos atsakymus?")) return;
    try {
      await deleteTopic(id);
      navigate("/forum");
    } catch (err) {
      setError(err.message);
    }
  }

  async function onUpdateReply(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await updateReply(replyEdit, data.get("body"));
      setReplyEdit(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDeleteReply(replyId) {
    if (!confirm("Ištrinti atsakymą?")) return;
    try {
      await deleteReply(replyId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && topic === undefined) return <main className="page"><p className="error">{error}</p></main>;
  if (topic === undefined) return <main className="page"><p className="note">Kraunama…</p></main>;
  if (!topic) return <main className="page"><h1>Tokios temos nėra.</h1></main>;
  const ownTopic = user?.id === topic.authorId;

  return (
    <main className="page">
      <p className="kicker">Tema</p>
      {editing ? (
        <form className="form" onSubmit={onUpdateTopic}>
          <label>Pavadinimas
            <input name="title" required maxLength={140} defaultValue={topic.title} />
          </label>
          <label>Žinutė
            <textarea name="body" required maxLength={4000} defaultValue={topic.body} />
          </label>
          <div className="actions">
            <button className="primary" type="submit">Išsaugoti</button>
            <button className="ghost" type="button" onClick={() => setEditing(false)}>Atšaukti</button>
          </div>
        </form>
      ) : (
        <>
          <h1>{topic.title}</h1>
          <p className="meta">{topic.authorName} · {when(topic.createdAt)}</p>
        </>
      )}
      {error && <p className="error">{error}</p>}
      {!editing && (
        <article className="sheet">
          <p>{topic.body}</p>
          {topic.replies.map((reply) => (
            <div className="reply" key={reply.id}>
              <p className="meta">{reply.authorName} · {when(reply.createdAt)}</p>
              {replyEdit === reply.id ? (
                <form onSubmit={onUpdateReply}>
                  <textarea name="body" required defaultValue={reply.body} />
                  <div className="actions">
                    <button className="ghost" type="submit">Išsaugoti</button>
                    <button className="ghost" type="button" onClick={() => setReplyEdit(null)}>Atšaukti</button>
                  </div>
                </form>
              ) : (
                <p>{reply.body}</p>
              )}
              {user?.id === reply.authorId && replyEdit !== reply.id && (
                <div className="actions">
                  <button className="ghost" type="button" onClick={() => setReplyEdit(reply.id)}>Redaguoti</button>
                  <button className="ghost" type="button" onClick={() => onDeleteReply(reply.id)}>Trinti</button>
                </div>
              )}
            </div>
          ))}
        </article>
      )}
      {ownTopic && !editing && (
        <div className="actions">
          <button className="ghost" type="button" onClick={() => setEditing(true)}>Redaguoti temą</button>
          <button className="ghost" type="button" onClick={onDeleteTopic}>Trinti temą</button>
        </div>
      )}
      {user ? (
        <form className="form" onSubmit={onReply}>
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
  const user = useUser();
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const topic = await addTopic({ title: data.get("title"), body: data.get("body") });
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
