import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';
import { Card } from './Card';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 'var(--space-lg)', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--color-bg-primary)' }}>
                    <Card>
                        <h2 style={{ color: 'var(--color-danger)', marginTop: 0 }}>Something went wrong.</h2>
                        <p>
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <div style={{ marginTop: 'var(--space-md)' }}>
                            <Button onClick={this.handleReload}>
                                Reload Application
                            </Button>
                        </div>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
