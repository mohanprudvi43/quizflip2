import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const learnerLinks = [
  ["/domains", "Domains"],
  ["/create-cards", "Create Cards"],
  ["/learn", "Flashcards"],
  ["/quiz", "Quiz"],
  ["/practice", "Practice"],
  ["/progress", "Progress"],
  ["/streak", "Streak"],
  ["/leaderboard", "Leaderboard"]
];

const adminLinks = [
  ["/admin", "Admin Dashboard"],
  ["/create-cards", "Create Cards"],
  ["/domains", "Domains"]
];

const Sidebar = () => {
  const { user } = useAuth();
  const links = user?.role === "admin" ? adminLinks : learnerLinks;

  return (
    <>
      <aside className="panel sticky top-4 hidden h-[calc(100vh-2rem)] w-72 lg:block">
        <div className="rounded-2xl bg-gradient-to-br from-blue-500/90 to-cyan-500/80 p-4 text-white shadow-glow">
          <h2 className="font-display text-2xl">Quizflip2</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-blue-50">Adaptive learning platform</p>
        </div>
        <nav className="mt-6 space-y-2">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-glow"
                    : "text-slate-700 hover:bg-white/70 dark:text-slate-100 dark:hover:bg-slate-700/40"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <nav className="fixed bottom-3 left-3 right-3 z-30 grid grid-cols-4 gap-2 rounded-2xl border border-white/70 bg-white/90 p-2 shadow-xl backdrop-blur md:grid-cols-6 lg:hidden dark:border-slate-700 dark:bg-slate-900/80">
        {links.slice(0, 6).map(([to, label]) => (
          <NavLink
            key={`mobile-${to}`}
            to={to}
            className={({ isActive }) =>
              `rounded-xl px-2 py-2 text-center text-xs font-semibold ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 dark:text-slate-200"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
