import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Erreur non rattrapée :", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-red-100 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-500 text-3xl font-black">!</span>
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-3">Une erreur est survenue</h2>
            <p className="text-gray-500 font-medium mb-6">
              L’application a rencontré un problème inattendu. Rechargez la page pour continuer.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-xs bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 overflow-x-auto text-red-600">
                {String(this.state.error?.stack || this.state.error)}
              </pre>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn btn-primary w-full py-4 text-lg"
            >
              Recharger l’application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
