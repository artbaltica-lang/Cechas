import { supabase } from "./supabaseClient.js";

const listeners = new Set();
let user = null;
let started = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function setUser(next) {
  user = next;
  emit();
}

function requireClient() {
  if (!supabase) throw new Error("Nėra prisijungimo prie bazės. Patikrinkite .env.");
  return supabase;
}

function fail(error) {
  if (!error) return;
  const text = error.message || "";
  if (error.code === "23505" || /already registered/i.test(text)) {
    throw new Error("Šis el. paštas jau užregistruotas.");
  }
  if (error.code === "42501" || /row-level security/i.test(text)) {
    throw new Error("Šio įrašo keisti negalima.");
  }
  if (/invalid login credentials/i.test(text)) {
    throw new Error("El. paštas arba slaptažodis netinka.");
  }
  if (/email not confirmed/i.test(text)) {
    throw new Error("Pirmiausia patvirtinkite laišką pašte.");
  }
  throw new Error(text || "Bazė nepriėmė užklausos.");
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function currentUser() {
  return user;
}

async function refreshProfile(authUser) {
  const client = requireClient();
  const { data, error } = await client
    .from("profiles")
    .select("id, name, email")
    .eq("id", authUser.id)
    .maybeSingle();
  fail(error);
  setUser(data
    ? { id: data.id, name: data.name, email: data.email }
    : { id: authUser.id, name: authUser.user_metadata?.name || "Dalyvis", email: authUser.email });
}

export function startAuth() {
  if (started) return;
  started = true;
  const client = supabase;
  if (!client) return;
  client.auth.getSession().then(({ data }) => {
    if (data.session) refreshProfile(data.session.user);
  });
  client.auth.onAuthStateChange((_event, session) => {
    if (!session) setUser(null);
    else refreshProfile(session.user);
  });
}

export async function register({ name, email, password }) {
  const client = requireClient();
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (cleanName.length < 2) throw new Error("Vardą sudaro bent 2 raidės.");
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new Error("El. paštas netinka.");
  if (!password || password.length < 6) throw new Error("Slaptažodį sudaro bent 6 simboliai.");
  const { data, error } = await client.auth.signUp({
    email: cleanEmail,
    password,
    options: { data: { name: cleanName } }
  });
  fail(error);
  if (!data.session) {
    throw new Error("Paskyra sukurta. Patvirtinkite laišką pašte, tada prisijunkite.");
  }
  await refreshProfile(data.session.user);
  return currentUser();
}

export async function login(email, password) {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: password || ""
  });
  fail(error);
  await refreshProfile(data.session.user);
  return currentUser();
}

export async function logout() {
  if (supabase) await supabase.auth.signOut();
  setUser(null);
}

export async function updateProfile(name) {
  const client = requireClient();
  if (!user) throw new Error("Pirmiausia prisijunkite.");
  const cleanName = name.trim();
  if (cleanName.length < 2) throw new Error("Vardą sudaro bent 2 raidės.");
  const { data, error } = await client
    .from("profiles")
    .update({ name: cleanName })
    .eq("id", user.id)
    .select("id, name, email");
  fail(error);
  if (!data?.length) throw new Error("Vardo pakeisti nepavyko.");
  setUser({ id: data[0].id, name: data[0].name, email: data[0].email });
  return currentUser();
}

export async function deleteAccount() {
  const client = requireClient();
  if (!user) throw new Error("Pirmiausia prisijunkite.");
  const { error } = await client.rpc("delete_own_account");
  fail(error);
  await logout();
}

async function namesFor(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const { data, error } = await requireClient().from("profile_names").select("id, name").in("id", unique);
  fail(error);
  return Object.fromEntries((data || []).map((row) => [row.id, row.name]));
}

function withName(row, names) {
  return { ...row, authorName: names[row.authorId] || "Dalyvis" };
}

export async function listJobs() {
  const { data, error } = await requireClient()
    .from("jobs")
    .select("id, author_id, title, company, place, tag, description, created_at")
    .order("created_at", { ascending: false });
  fail(error);
  const names = await namesFor((data || []).map((row) => row.author_id));
  return (data || []).map((row) => withName(mapJob(row), names));
}

export async function getJob(id) {
  const { data, error } = await requireClient()
    .from("jobs")
    .select("id, author_id, title, company, place, tag, description, created_at")
    .eq("id", id)
    .maybeSingle();
  fail(error);
  if (!data) return null;
  const names = await namesFor([data.author_id]);
  return withName(mapJob(data), names);
}

export async function addJob({ title, company, place, tag, description }) {
  const client = requireClient();
  if (!user) throw new Error("Pirmiausia prisijunkite, kad galėtumėte pasiūlyti darbą.");
  const cleanTitle = title.trim();
  const cleanCompany = company.trim();
  const cleanDescription = description.trim();
  if (cleanTitle.length < 4) throw new Error("Parašykite, kokio darbo reikia.");
  if (!cleanCompany) throw new Error("Parašykite, kas siūlo darbą.");
  if (cleanDescription.length < 10) throw new Error("Trumpai aprašykite užduotį, bent vienu sakiniu.");
  const { data, error } = await client
    .from("jobs")
    .insert({
      author_id: user.id,
      title: cleanTitle,
      company: cleanCompany,
      place: place.trim() || "nuotoliniu būdu",
      tag: tag || "kita",
      description: cleanDescription
    })
    .select("id")
    .single();
  fail(error);
  return getJob(data.id);
}

export async function updateJob(id, { title, company, place, tag, description }) {
  if (!user) throw new Error("Pirmiausia prisijunkite.");
  const { data, error } = await requireClient()
    .from("jobs")
    .update({
      title: title.trim(),
      company: company.trim(),
      place: place.trim() || "nuotoliniu būdu",
      tag: tag || "kita",
      description: description.trim()
    })
    .eq("id", id)
    .select("id");
  fail(error);
  if (!data?.length) throw new Error("Šio skelbimo keisti negalima.");
  return getJob(id);
}

export async function deleteJob(id) {
  if (!user) throw new Error("Pirmiausia prisijunkite.");
  const { data, error } = await requireClient().from("jobs").delete().eq("id", id).select("id");
  fail(error);
  if (!data?.length) throw new Error("Šio skelbimo trinti negalima.");
}

export async function listTopics() {
  const client = requireClient();
  const { data, error } = await client
    .from("topics")
    .select("id, author_id, title, body, created_at")
    .order("created_at", { ascending: false });
  fail(error);
  const { data: replies, error: repliesError } = await client.from("replies").select("topic_id");
  fail(repliesError);
  const counts = {};
  for (const reply of replies || []) counts[reply.topic_id] = (counts[reply.topic_id] || 0) + 1;
  const names = await namesFor((data || []).map((row) => row.author_id));
  return (data || []).map((row) => ({
    ...withName(mapTopic(row), names),
    replies: counts[row.id] || 0
  }));
}

export async function getTopic(id) {
  const client = requireClient();
  const { data, error } = await client
    .from("topics")
    .select("id, author_id, title, body, created_at")
    .eq("id", id)
    .maybeSingle();
  fail(error);
  if (!data) return null;
  const { data: replies, error: repliesError } = await client
    .from("replies")
    .select("id, topic_id, author_id, body, created_at")
    .eq("topic_id", id)
    .order("created_at", { ascending: true });
  fail(repliesError);
  const names = await namesFor([data.author_id, ...(replies || []).map((row) => row.author_id)]);
  return {
    ...withName(mapTopic(data), names),
    replies: (replies || []).map((row) => withName(mapReply(row), names))
  };
}

export async function addTopic({ title, body }) {
  if (!user) throw new Error("Pirmiausia prisijunkite, kad atidarytumėte temą.");
  const cleanTitle = title.trim();
  const cleanBody = body.trim();
  if (cleanTitle.length < 4) throw new Error("Suteikite temai trumpą pavadinimą.");
  if (cleanBody.length < 10) throw new Error("Parašykite, apie ką norite kalbėti.");
  const { data, error } = await requireClient()
    .from("topics")
    .insert({ author_id: user.id, title: cleanTitle, body: cleanBody })
    .select("id")
    .single();
  fail(error);
  return getTopic(data.id);
}

export async function updateTopic(id, { title, body }) {
  if (!user) throw new Error("Pirmiausia prisijunkite.");
  const { data, error } = await requireClient()
    .from("topics")
    .update({ title: title.trim(), body: body.trim() })
    .eq("id", id)
    .select("id");
  fail(error);
  if (!data?.length) throw new Error("Šios temos keisti negalima.");
  return getTopic(id);
}

export async function deleteTopic(id) {
  if (!user) throw new Error("Pirmiausia prisijunkite.");
  const { data, error } = await requireClient().from("topics").delete().eq("id", id).select("id");
  fail(error);
  if (!data?.length) throw new Error("Šios temos trinti negalima.");
}

export async function addReply(topicId, body) {
  if (!user) throw new Error("Pirmiausia prisijunkite, kad atsakytumėte.");
  const cleanBody = body.trim();
  if (cleanBody.length < 2) throw new Error("Parašykite atsakymą.");
  const { error } = await requireClient()
    .from("replies")
    .insert({ topic_id: topicId, author_id: user.id, body: cleanBody });
  fail(error);
  return getTopic(topicId);
}

export async function updateReply(id, body) {
  if (!user) throw new Error("Pirmiausia prisijunkite.");
  const cleanBody = body.trim();
  if (cleanBody.length < 2) throw new Error("Parašykite atsakymą.");
  const { data, error } = await requireClient()
    .from("replies")
    .update({ body: cleanBody })
    .eq("id", id)
    .select("id");
  fail(error);
  if (!data?.length) throw new Error("Šio atsakymo keisti negalima.");
}

export async function deleteReply(id) {
  if (!user) throw new Error("Pirmiausia prisijunkite.");
  const { data, error } = await requireClient().from("replies").delete().eq("id", id).select("id");
  fail(error);
  if (!data?.length) throw new Error("Šio atsakymo trinti negalima.");
}

function mapJob(row) {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    company: row.company,
    place: row.place,
    tag: row.tag,
    description: row.description,
    createdAt: row.created_at
  };
}

function mapTopic(row) {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at
  };
}

function mapReply(row) {
  return {
    id: row.id,
    topicId: row.topic_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at
  };
}
