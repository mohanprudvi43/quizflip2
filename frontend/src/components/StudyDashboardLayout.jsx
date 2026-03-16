import { useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import ResponsiveSidebar from "./ResponsiveSidebar.jsx";

const StudyDashboardLayout = ({ children, focusMode = false, showHeader = true }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const shellMargin = useMemo(() => {
    if (focusMode) return "lg:ml-0";
    if (mobileOpen) return "lg:ml-72";
    return collapsed ? "lg:ml-20" : "lg:ml-72";
  }, [collapsed, mobileOpen, focusMode]);

  return (
    <div className="relative min-h-screen">
      <ResponsiveSidebar
        userRole={user?.role || "learner"}
        hidden={focusMode}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`min-h-screen transition-all duration-300 ${shellMargin}`}>
        <main className={`mx-auto min-h-screen px-4 pb-8 pt-4 md:px-6 ${focusMode ? "max-w-[1500px]" : "max-w-[1400px] md:pt-6"}`}>
          {showHeader ? (
            <header className={`panel relative mb-4 flex items-center justify-between gap-3 overflow-hidden md:mb-6 ${focusMode ? "py-3" : ""}`}>
              <div className="pointer-events-none absolute -right-20 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-cyan-300/40 to-blue-300/20 blur-2xl" />
              <div className="flex items-center gap-3">
                {!focusMode ? (
                  <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="btn-secondary p-2 lg:hidden"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                ) : null}
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Focused Learning</p>
                  <h1 className="mt-1 font-display text-xl md:text-2xl">{user?.name || "Learner"}</h1>
                  <p className="text-xs text-slate-500">{user?.role || "learner"}</p>
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-2">
                <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white md:flex">
                  {String(user?.name || "L").charAt(0).toUpperCase()}
                </div>
                <ThemeToggle />
                <button onClick={logout} className="btn-secondary" type="button">
                  Logout
                </button>
              </div>
            </header>
          ) : null}

          {children}
        </main>
      </div>
    </div>
  );
};

export default StudyDashboardLayout;
