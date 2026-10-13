import { Link } from "react-router-dom";
import { listJobs, listTopics } from "../store.js";

export default function Home() {
  const jobs = listJobs().slice(0, 2);
  const topics = listTopics().slice(0, 2);

  return (
    <main className="page">
      <p className="kicker">Tiems, kas dirba su DI</p>
      <div className="split">
        <div>
          <h1>Darbas ir pokalbis vienoje vietoje.</h1>
          <p className="lede">
            Čia darbą siūlo ir ieško žmonės, kurie dirba su neuroniniais tinklais,
            administruoja svetaines ir kasdienius darbus atlieka kartu su dirbtiniu intelektu.
          </p>
        </div>
        <p className="note">
          Registracija jau veikia šioje naršyklėje. Bendra dalyvių bazė bus kitas žingsnis.
        </p>
      </div>
      <div className="paths">
        <Link className="tile" to="/jobs">
          <strong>Rasti darbą</strong>
          <span>Laisvos vietos IT, DI ir tiems, kas prižiūri svetaines.</span>
        </Link>
        <Link className="tile" to="/jobs/new">
          <strong>Pasiūlyti darbą</strong>
          <span>Trumpai aprašykite užduotį. Ją matys cecho dalyviai.</span>
        </Link>
        <Link className="tile" to="/forum">
          <strong>Pasikalbėti</strong>
          <span>Forumas: klausimai, patirtis ir atsakymai be skubos.</span>
        </Link>
      </div>
      <div className="section-head">
        <h2>Dabar lentoje</h2>
        <Link to="/jobs">Visi darbai</Link>
      </div>
      <div className="board">
        {jobs.map((job) => (
          <Link className="row" key={job.id} to={`/jobs/${job.id}`}>
            <strong>{job.title}</strong>
            <span className="meta">{job.company} · {job.place}</span>
          </Link>
        ))}
      </div>
      <div className="section-head">
        <h2>Forume</h2>
        <Link to="/forum">Visos temos</Link>
      </div>
      <div className="board">
        {topics.map((topic) => (
          <Link className="row" key={topic.id} to={`/forum/${topic.id}`}>
            <strong>{topic.title}</strong>
            <span className="meta">atsakymų: {topic.replies}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
