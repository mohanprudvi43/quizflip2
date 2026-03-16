import { useState } from "react";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));

  const toggle = () => {
    document.documentElement.classList.toggle("dark");
    const nextDark = document.documentElement.classList.contains("dark");
    setIsDark(nextDark);
    localStorage.setItem(
      "qf_theme",
      nextDark ? "dark" : "light"
    );
  };

  return (
    <button
      onClick={toggle}
      className="btn-ghost"
      type="button"
    >
      {isDark ? "Light" : "Dark"} Mode
    </button>
  );
};

export default ThemeToggle;
