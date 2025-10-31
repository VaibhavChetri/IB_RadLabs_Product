/**
 * Error Boundary Component
 * Catches React errors and displays user-friendly error messages
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from './ui/Card';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
		};
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		// Log error to console in development
		console.error('ErrorBoundary caught an error:', error, errorInfo);

		// Call custom error handler if provided
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}

		// In production, you would send this to an error logging service
		// e.g., Sentry, LogRocket, etc.
	}

	handleReset = (): void => {
		this.setState({
			hasError: false,
			error: null,
		});
	};

	render(): ReactNode {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<Card className='p-6'>
					<div className='text-center space-y-4'>
						<h2 className='text-xl font-semibold text-red-600'>Something went wrong</h2>
						<p className='text-gray-600'>
							{this.state.error?.message || 'An unexpected error occurred'}
						</p>
						<button
							onClick={this.handleReset}
							className='px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors'
						>
							Try Again
						</button>
					</div>
				</Card>
			);
		}

		return this.props.children;
	}
}
