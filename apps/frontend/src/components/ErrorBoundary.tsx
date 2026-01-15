'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
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
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] p-4 text-center">
                    <div className="rounded-lg bg-white p-8 shadow-lg border border-[var(--color-border)] max-w-md">
                        <h2 className="text-2xl font-bold text-[var(--color-error)] mb-4">Something went wrong</h2>
                        <p className="text-[var(--color-text-soft)] mb-6">
                            An unexpected error occurred. Please try refreshing the page.
                        </p>
                        <button
                            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-md hover:bg-[var(--color-primary-hover)] transition-colors"
                            onClick={() => {
                                this.setState({ hasError: false });
                                window.location.reload();
                            }}
                        >
                            Refresh Page
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <pre className="mt-4 overflow-auto rounded bg-gray-100 p-2 text-left text-xs text-red-600 max-h-40">
                                {this.state.error.message}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
