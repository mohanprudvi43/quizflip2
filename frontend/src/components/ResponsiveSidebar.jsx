import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flame,
  LayoutDashboard,
  PenLine,
  Trophy,
  X
} from "lucide-react";

const learnerLinks = [
  { to: "/domains", label: "Domains", icon: BookOpen },
  { to: "/learn", label: "ConceptCards", icon: Brain },
  { to: "/quiz", label: "Quiz", icon: PenLine },
  { to: "/practice", label: "Practice", icon: LayoutDashboard },
  { to: "/progress", label: "Progress", icon: ChevronRight },
  { to: "/streak", label: "Streak", icon: Flame },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy }
];

const adminLinks = [
  { to: "/admin", label: "Admin Dashboard", icon: Crown }
];

const NavItem = ({ link, collapsed, onNavigate }) => {
  const Icon = link.icon;

  return (
    <NavLink
      to={link.to}
      onClick={onNavigate}
      title={collapsed ? link.label : undefined}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
          isActive
            ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
            : "text-slate-700 hover:bg-white/80 dark:text-slate-100 dark:hover:bg-slate-800/60"
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed ? <span className="truncate">{link.label}</span> : null}
    </NavLink>
  );
};

const ResponsiveSidebar = ({ userRole = "learner", collapsed, mobileOpen, onToggleCollapse, onCloseMobile, hidden = false }) => {
  if (hidden) return null;

  const links = useMemo(() => (userRole === "admin" ? adminLinks : learnerLinks), [userRole]);

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen border-r border-white/40 bg-white/70 p-3 backdrop-blur-xl transition-transform duration-300 dark:border-slate-700/60 dark:bg-slate-900/75 lg:sticky lg:z-20 ${
          collapsed ? "w-20" : "w-72"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-full flex-col">
          <div className="mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-3 text-white">
            <div className={collapsed ? "hidden" : "block"}>
              <h2 className="font-display text-xl">Quizflip2</h2>
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-50">Study Mode</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="rounded-lg p-1.5 transition hover:bg-white/20"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-lg p-1.5 transition hover:bg-white/20 lg:hidden"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <nav className="space-y-2">
            {links.map((link) => (
              <NavItem key={link.to} link={link} collapsed={collapsed} onNavigate={onCloseMobile} />
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/60 bg-white/50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
            {collapsed ? "" : "Tip: Use <- and -> keys for quick card navigation."}
          </div>
        </div>
      </aside>

      <nav className="fixed bottom-3 left-3 right-3 z-30 grid grid-cols-4 gap-2 rounded-2xl border border-white/70 bg-white/90 p-2 shadow-xl backdrop-blur lg:hidden dark:border-slate-700 dark:bg-slate-900/85">
        {links.slice(0, 4).map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={`mobile-${link.to}`}
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-700 dark:text-slate-200"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default ResponsiveSidebar;
