import { Component } from 'react';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import Button from './ui/Button.jsx';

// Last line of defence: a render error shows a recoverable screen, not a blank page
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-danger-soft">
          <TriangleAlert className="size-6 text-danger" />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          An unexpected error occurred while showing this page. Reloading usually fixes it — your saved content is safe.
        </p>
        <div className="mt-6 flex gap-2">
          <Button onClick={() => window.location.reload()}>
            <RotateCcw className="size-4" />
            Reload page
          </Button>
          <Button variant="secondary" onClick={() => (window.location.href = '/')}>
            Go home
          </Button>
        </div>
      </div>
    );
  }
}
