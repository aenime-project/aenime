import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-[60vh] flex flex-col justify-center items-center p-6 text-center text-white">
          <h2 className="text-2xl font-bold text-[#B24B92] mb-3">Something went wrong</h2>
          <p className="text-gray-400 mb-5 max-w-md">
            An unexpected error occurred while loading this section.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#B24B92] text-black font-semibold px-5 py-2 rounded-full hover:opacity-90 transition"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
