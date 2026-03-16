import StudyDashboardLayout from "./StudyDashboardLayout.jsx";

const AppShell = ({ children, focusMode = false, showHeader = true }) => {
  return (
    <StudyDashboardLayout focusMode={focusMode} showHeader={showHeader}>
      {children}
    </StudyDashboardLayout>
  );
};

export default AppShell;
