import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../hooks/useUser.js";
import { addJob, deleteJob, getJob, listJobs, updateJob } from "../services/store.js";

const tags = ["visos", "neuroniniai tinklai", "administravimas", "DI produktai", "kita"];

function when(iso) {
  return new Date(iso).toLocaleDateString("lt-LT", { day: "numeric", month: "long" });
}

export default function Jobs() {
  const [tag, setTag] = useState("visos");
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    listJobs()
      .then((rows) => {
        if (live) setJobs(rows);
      })
      .catch((err) => {
        if (live) setError(err.message);
      });
    return () => {
      live = false;
    };
  }, []);

  const visible = (jobs || []).filter((job) => tag === "visos" || job.tag === tag);

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <p className="kicker">Lenta</p>
          <h1>Darbas</h1>
        </div>
        <Link className="primary" to="/jobs/new">Pasiūlyti darbą</Link>
      </div>
      <div className="filters" role="group" aria-label="Sritis">
        {tags.map((item) => (
          <button className="ghost" key={item} type="button" aria-pressed={tag === item} onClick={() => setTag(item)}>
            {item}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      {jobs === null && !error && <p className="note">Kraunama…</p>}
      <div className="board">
        {jobs && visible.length === 0 && <p className="note">Šioje srityje kol kas tuščia.</p>}
        {visible.map((job) => (
          <Link className="row" key={job.id} to={`/jobs/${job.id}`}>
            <span className="tag">{job.tag}</span>
            <strong>{job.title}</strong>
            <span className="meta">{job.company} · {job.place} · {when(job.createdAt)}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

function JobFields({ job }) {
  return (
    <>
      <label>Ką reikia padaryti
        <input name="title" required maxLength={120} defaultValue={job?.title || ""} />
      </label>
      <label>Kas siūlo
        <input name="company" required maxLength={80} defaultValue={job?.company || ""} />
      </label>
      <label>Kur
        <input name="place" placeholder="nuotoliniu būdu arba miestas" maxLength={80} defaultValue={job?.place || ""} />
      </label>
      <label>Sritis
        <select name="tag" defaultValue={job?.tag || "neuroniniai tinklai"}>
          <option>neuroniniai tinklai</option>
          <option>administravimas</option>
          <option>DI produktai</option>
          <option>kita</option>
        </select>
      </label>
      <label>Aprašymas
        <textarea name="description" required maxLength={2000} defaultValue={job?.description || ""} />
      </label>
    </>
  );
}

export function JobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useUser();
  const [job, setJob] = useState(undefined);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    getJob(id)
      .then((row) => {
        if (live) setJob(row);
      })
      .catch((err) => {
        if (live) setError(err.message);
      });
    return () => {
      live = false;
    };
  }, [id]);

  async function onUpdate(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const next = await updateJob(id, {
        title: data.get("title"),
        company: data.get("company"),
        place: data.get("place"),
        tag: data.get("tag"),
        description: data.get("description")
      });
      setJob(next);
      setEditing(false);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDelete() {
    if (!confirm("Ištrinti šį skelbimą?")) return;
    try {
      await deleteJob(id);
      navigate("/jobs");
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !job) return <main className="page"><p className="error">{error}</p></main>;
  if (job === undefined) return <main className="page"><p className="note">Kraunama…</p></main>;
  if (!job) return <main className="page"><h1>Tokio darbo nėra.</h1></main>;
  const own = user?.id === job.authorId;

  return (
    <main className="page">
      <p className="kicker">{job.tag}</p>
      <h1>{job.title}</h1>
      <p className="meta">{job.company} · {job.place} · pasiūlė {job.authorName} · {when(job.createdAt)}</p>
      {error && <p className="error">{error}</p>}
      {editing ? (
        <form className="form" onSubmit={onUpdate}>
          <JobFields job={job} />
          <div className="actions">
            <button className="primary" type="submit">Išsaugoti</button>
            <button className="ghost" type="button" onClick={() => setEditing(false)}>Atšaukti</button>
          </div>
        </form>
      ) : (
        <article className="sheet"><p>{job.description}</p></article>
      )}
      {own && !editing && (
        <div className="actions">
          <button className="ghost" type="button" onClick={() => setEditing(true)}>Redaguoti</button>
          <button className="ghost" type="button" onClick={onDelete}>Trinti</button>
        </div>
      )}
    </main>
  );
}

export function NewJob() {
  const navigate = useNavigate();
  const user = useUser();
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const job = await addJob({
        title: data.get("title"),
        company: data.get("company"),
        place: data.get("place"),
        tag: data.get("tag"),
        description: data.get("description")
      });
      navigate(`/jobs/${job.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return (
      <main className="page">
        <h1>Pirmiausia registracija</h1>
        <p className="lede">Darbą pasiūlyti gali tik dalyvis.</p>
        <Link className="primary" to="/register">Sukurti paskyrą</Link>
      </main>
    );
  }

  return (
    <main className="page">
      <p className="kicker">Naujas skelbimas</p>
      <h1>Pasiūlyti darbą</h1>
      <form className="form" onSubmit={onSubmit}>
        {error && <p className="error">{error}</p>}
        <JobFields />
        <button className="primary" type="submit">Paskelbti</button>
      </form>
    </main>
  );
}
