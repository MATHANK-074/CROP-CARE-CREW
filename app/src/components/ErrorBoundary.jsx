import React from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-700 mb-4">
              We've encountered an unexpected error. This could be due to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Network connectivity issues</li>
              <li>Invalid route or missing data</li>
              <li>Server-side errors</li>
              <li>Authentication problems</li>
            </ul>

            {this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded">
                <p className="text-sm font-mono text-red-800 overflow-auto">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded"
              >
                Reload Page
              </button>
              <Link
                to="/home"
                className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-center text-gray-800 font-medium rounded"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;