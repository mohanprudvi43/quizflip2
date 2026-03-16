import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("qf_user");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (_error) {
      localStorage.removeItem("qf_user");
      localStorage.removeItem("qf_token");
      localStorage.removeItem("qf_refresh_token");
      return null;
    }
  });

  const login = (payload) => {
    localStorage.setItem("qf_token", payload.token);
    localStorage.setItem("qf_user", JSON.stringify(payload.user));
    setUser(payload.user);
  };

  const logout = () => {
    localStorage.removeItem("qf_token");
    localStorage.removeItem("qf_user");
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, logout }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
