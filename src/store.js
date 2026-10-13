const KEY = "ceh.lt.1";
const SESSION = "ceh.session";

const listeners = new Set();

function empty() {
  return { users: [], jobs: [], topics: [], replies: [] };
}

function seed() {
  const studio = "11111111-1111-4111-8111-111111111111";
  const desk = "22222222-2222-4222-8222-222222222222";
  return {
    users: [
      { id: studio, name: "Studija Šiaurė", email: "studio@ceh.local", passwordHash: "", createdAt: "2026-10-01T09:00:00.000Z" },
      { id: desk, name: "Redakcija", email: "desk@ceh.local", passwordHash: "", createdAt: "2026-10-02T09:00:00.000Z" }
    ],
    jobs: [
      {
        id: "job-bot",
        authorId: studio,
        title: "Reikia žmogaus, kuris svetainei sukurtų pokalbių robotą",
        company: "Studija Šiaurė",
        place: "nuotoliniu būdu",
        tag: "neuroniniai tinklai",
        description: "Svetainė jau yra. Reikia prijungti atsakymus į dažnus klientų klausimus ir sudėtingus pokalbius perduoti gyvam operatoriui.",
        createdAt: "2026-10-10T08:00:00.000Z"
      },
      {
        id: "job-admin",
        authorId: desk,
        title: "Svetainės administratorius, kuris moka dirbti su DI įrankiais",
        company: "Redakcija",
        place: "Vilnius arba nuotoliniu būdu",
        tag: "administravimas",
        description: "Prižiūrėti publikacijas, formas ir puslapių greitį. DI galima naudoti darbe, bet sprendimus vis tiek tikrina žmogus.",
        createdAt: "2026-10-11T08:00:00.000Z"
      }
    ],
    topics: [
      {
        id: "topic-models",
        authorId: desk,
        title: "Kur tikrinate tekstą, kurį parašė modelis?",
        body: "Įdomu, kokia tvarka pas tuos, kas skelbia medžiagą: pirma modelio juodraštis, paskui būtina patikra, ar atvirkščiai.",
        createdAt: "2026-10-09T12:00:00.000Z"
      }
    ],
    replies: [
      {
        id: "reply-1",
        topicId: "topic-models",
        authorId: studio,
        body: "Pas mus modelis rašo juodraštį, o prieš publikavimą tekstą perskaito redaktorius. Be to neleidžiame.",
        createdAt: "2026-10-09T15:00:00.000Z"
      }
    ]
  };
}

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && Array.isArray(saved.users)) return saved;
  } catch {
    /* pradedame nuo pavyzdžių */
  }
  const data = seed();
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  listeners.forEach((listener) => listener());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return sessionUserId();
}

function sessionUserId() {
  return localStorage.getItem(SESSION) || "";
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function publicUser(user) {
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email };
}

let cachedSession = undefined;
let cachedUser = null;

export function currentUser() {
  const id = sessionUserId();
  if (cachedSession === id) return cachedUser;
  cachedSession = id;
  cachedUser = publicUser(read().users.find((user) => user.id === id));
  return cachedUser;
}

export function authorName(authorId) {
  return read().users.find((user) => user.id === authorId)?.name || "Dalyvis";
}

export async function register({ name, email, password }) {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (cleanName.length < 2) throw new Error("Vardą sudaro bent 2 raidės.");
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new Error("El. paštas netinka.");
  if (!password || password.length < 6) throw new Error("Slaptažodį sudaro bent 6 simboliai.");
  const data = read();
  if (data.users.some((user) => user.email === cleanEmail)) {
    throw new Error("Šis el. paštas jau užregistruotas.");
  }
  const user = {
    id: crypto.randomUUID(),
    name: cleanName,
    email: cleanEmail,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString()
  };
  data.users.push(user);
  write(data);
  localStorage.setItem(SESSION, user.id);
  listeners.forEach((listener) => listener());
  return publicUser(user);
}

export async function login(email, password) {
  const cleanEmail = email.trim().toLowerCase();
  const data = read();
  const user = data.users.find((item) => item.email === cleanEmail);
  if (!user || !user.passwordHash || user.passwordHash !== await hashPassword(password || "")) {
    throw new Error("Neteisingas el. paštas arba slaptažodis.");
  }
  localStorage.setItem(SESSION, user.id);
  listeners.forEach((listener) => listener());
  return publicUser(user);
}

export function logout() {
  localStorage.removeItem(SESSION);
  listeners.forEach((listener) => listener());
}

export function listJobs() {
  return read().jobs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getJob(id) {
  return read().jobs.find((job) => job.id === id) || null;
}

export function addJob({ title, company, place, tag, description }) {
  const user = currentUser();
  if (!user) throw new Error("Pirmiausia prisijunkite, kad galėtumėte pasiūlyti darbą.");
  const cleanTitle = title.trim();
  const cleanCompany = company.trim();
  const cleanDescription = description.trim();
  if (cleanTitle.length < 4) throw new Error("Parašykite, kokio darbo reikia.");
  if (!cleanCompany) throw new Error("Parašykite, kas siūlo darbą.");
  if (cleanDescription.length < 10) throw new Error("Trumpai aprašykite užduotį, bent vienu sakiniu.");
  const data = read();
  const job = {
    id: crypto.randomUUID(),
    authorId: user.id,
    title: cleanTitle,
    company: cleanCompany,
    place: place.trim() || "nuotoliniu būdu",
    tag: tag || "kita",
    description: cleanDescription,
    createdAt: new Date().toISOString()
  };
  data.jobs.push(job);
  write(data);
  return job;
}

export function listTopics() {
  const data = read();
  return data.topics
    .map((topic) => ({
      ...topic,
      replies: data.replies.filter((reply) => reply.topicId === topic.id).length
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getTopic(id) {
  const data = read();
  const topic = data.topics.find((item) => item.id === id);
  if (!topic) return null;
  const replies = data.replies
    .filter((reply) => reply.topicId === id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return { ...topic, replies };
}

export function addTopic({ title, body }) {
  const user = currentUser();
  if (!user) throw new Error("Pirmiausia prisijunkite, kad atidarytumėte temą.");
  const cleanTitle = title.trim();
  const cleanBody = body.trim();
  if (cleanTitle.length < 4) throw new Error("Suteikite temai trumpą pavadinimą.");
  if (cleanBody.length < 10) throw new Error("Parašykite, apie ką norite kalbėti.");
  const data = read();
  const topic = {
    id: crypto.randomUUID(),
    authorId: user.id,
    title: cleanTitle,
    body: cleanBody,
    createdAt: new Date().toISOString()
  };
  data.topics.push(topic);
  write(data);
  return topic;
}

export function addReply(topicId, body) {
  const user = currentUser();
  if (!user) throw new Error("Pirmiausia prisijunkite, kad atsakytumėte.");
  if (!getTopic(topicId)) throw new Error("Tokios temos nėra.");
  const cleanBody = body.trim();
  if (cleanBody.length < 2) throw new Error("Parašykite atsakymą.");
  const data = read();
  const reply = {
    id: crypto.randomUUID(),
    topicId,
    authorId: user.id,
    body: cleanBody,
    createdAt: new Date().toISOString()
  };
  data.replies.push(reply);
  write(data);
  return reply;
}
