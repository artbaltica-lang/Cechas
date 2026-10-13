import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { addJob, authorName, currentUser, getJob, listJobs } from "../store.js";

const tags = ["visos", "neuroniniai tinklai", "administravimas", "DI produktai", "kita"];

function when(iso) {
  return new Date(iso).toLocaleDateString("lt-LT", { day: "numeric", month: "long" });
}

export default function Jobs() {
  const [tag, setTag] = useState("visos");
  const jobs = useMemo(() => {
    const all = listJobs();
    return tag === "visos" ? all : all.filter((job) => job.tag === tag);
  }, [tag]);

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
      <div className="board">
        {jobs.length === 0 && <p className="note">Šioje srityje kol kas tuščia.</p>}
        {jobs.map((job) => (
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

export function JobPage() {
  const { id } = useParams();
  const job = getJob(id);
  if (!job) return <main className="page"><h1>Tokio darbo nėra.</h1></main>;
  return (
    <main className="page">
      <p className="kicker">{job.tag}</p>
      <h1>{job.title}</h1>
      <p className="meta">{job.company} · {job.place} · pasiūlė {authorName(job.authorId)} · {when(job.createdAt)}</p>
      <article className="sheet"><p>{job.description}</p></article>
    </main>
  );
}

export function NewJob() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const user = currentUser();

  async function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const job = addJob({
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
        <label>Ką reikia padaryti
          <input name="title" required maxLength={120} />
        </label>
        <label>Kas siūlo
          <input name="company" required maxLength={80} />
        </label>
        <label>Kur
          <input name="place" placeholder="nuotoliniu būdu arba miestas" maxLength={80} />
        </label>
        <label>Sritis
          <select name="tag" defaultValue="neuroniniai tinklai">
            <option>neuroniniai tinklai</option>
            <option>administravimas</option>
            <option>DI produktai</option>
            <option>kita</option>
          </select>
        </label>
        <label>Aprašymas
          <textarea name="description" required maxLength={2000} />
        </label>
        <button className="primary" type="submit">Paskelbti</button>
      </form>
    </main>
  );
}
