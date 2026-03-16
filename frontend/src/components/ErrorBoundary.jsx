import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Unexpected UI error" };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="panel mx-auto mt-10 max-w-2xl border-red-200/60 bg-red-50/85 text-red-800 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-200">
          <h2 className="font-display text-2xl">Something went wrong</h2>
          <p className="mt-2 text-sm">{this.state.message}</p>
          <button
            type="button"
            className="btn-primary mt-4 bg-red-600 hover:bg-red-500"
            onClick={() => {
              localStorage.removeItem("qf_user");
              localStorage.removeItem("qf_token");
              window.location.href = "/";
            }}
          >
            Reset session
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
