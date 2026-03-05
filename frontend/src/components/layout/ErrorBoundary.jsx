import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center text-center p-6">
          <div className="border border-gold-600/30 p-10 max-w-md bg-white/5 backdrop-blur-md">
            <h1 className="text-3xl font-serif text-gold-500 mb-4">Our Apologies</h1>
            <p className="text-gray-400 text-sm font-light leading-relaxed mb-8">
              We encountered an unexpected issue while loading this page. Please refresh your browser or return to the homepage.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-gold-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors rounded-sm"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children; 
  }
}

export default ErrorBoundary;