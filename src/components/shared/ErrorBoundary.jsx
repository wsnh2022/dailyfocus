import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('DailyFocus crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950">
          <div className="text-5xl mb-4">😵</div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Something went wrong</h2>
          <p className="text-slate-500 dark:text-slate-300 mb-6 text-sm">Your data is safe. Try reloading the app.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 px-8 py-3 rounded-2xl font-medium"
          >
            Reload DailyFocus
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
