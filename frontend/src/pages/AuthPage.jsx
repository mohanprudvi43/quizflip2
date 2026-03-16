import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const AuthPage = () => {
  const [mode, setMode] = useState("login");
  const [loginRole, setLoginRole] = useState("learner");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const notice = sessionStorage.getItem("qf_session_notice");
    if (notice) {
      setError(notice);
      sessionStorage.removeItem("qf_session_notice");
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = mode === "register" ? "/auth/register" : "/auth/login";
      const payload = mode === "register" ? form : { email: form.email, password: form.password };
      const { data } = await api.post(url, payload);
      login(data);
      navigate(data.user.role === "admin" ? "/admin" : "/domains");
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-6 p-6 lg:grid-cols-[1fr_420px] lg:p-8">
      <section className="panel hidden min-h-[420px] lg:block">
        <p className="text-xs uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">Quizflip2 Access</p>
        <h1 className="mt-4 font-display text-5xl leading-tight">Sign in to continue your adaptive path.</h1>
        <p className="mt-4 max-w-lg text-slate-600 dark:text-slate-300">
          Learners unlock personalized learning, while admins get visibility into domain performance and quiz quality.
        </p>
      </section>

      <form onSubmit={submit} className="panel w-full space-y-4">
        <div className="grid grid-cols-3 rounded-xl bg-slate-100/80 p-1 text-sm dark:bg-slate-800/70">
          <button
            type="button"
            className={`rounded-lg px-3 py-2 ${mode === "login" && loginRole === "learner" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}
            onClick={() => {
              setMode("login");
              setLoginRole("learner");
            }}
          >
            Learner Login
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-2 ${mode === "login" && loginRole === "admin" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}
            onClick={() => {
              setMode("login");
              setLoginRole("admin");
              setForm((prev) => ({ ...prev, email: prev.email || "admin@quizflip2.com" }));
            }}
          >
            Admin Login
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-2 ${mode === "register" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <h1 className="font-display text-3xl md:text-4xl">
          {mode === "register" ? "Create Learner Account" : loginRole === "admin" ? "Admin Sign In" : "Learner Sign In"}
        </h1>
        {mode === "login" && loginRole === "admin" ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">Use your admin credentials to access analytics and content management.</p>
        ) : null}
        {mode === "register" && (
          <input
            className="input-field"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        )}
        <input
          className="input-field"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="input-field"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button className="btn-primary w-full py-3" type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : mode === "register"
              ? "Register"
              : loginRole === "admin"
                ? "Login as Admin"
                : "Login as Learner"}
        </button>
      </form>
    </div>
  );
};

export default AuthPage;
