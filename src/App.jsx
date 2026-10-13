import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Jobs, { JobPage, NewJob } from "./pages/Jobs.jsx";
import Forum, { NewTopic, TopicPage } from "./pages/Forum.jsx";
import { Login, Register } from "./pages/Auth.jsx";
import Account from "./pages/Account.jsx";

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
        <Route path="paskyra" element={<Account />} />
      </Route>
    </Routes>
  );
}
