import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export interface SnackbarProps {
	message: string;
	type: 'success' | 'error' | 'info';
	open: boolean;
	onClose: () => void;
	autoHideDuration?: number;
}

export const Snackbar: React.FC<SnackbarProps> = ({
	message,
	type,
	open,
	onClose,
	autoHideDuration = 4000,
}) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (open) {
			setIsVisible(true);
			const timer = setTimeout(() => {
				setIsVisible(false);
				setTimeout(onClose, 300); // Wait for animation to complete
			}, autoHideDuration);

			return () => clearTimeout(timer);
		} else {
			setIsVisible(false);
		}
	}, [open, autoHideDuration, onClose]);

	if (!open) return null;

	const getIcon = () => {
		switch (type) {
			case 'success':
				return <CheckCircle className='w-5 h-5 text-green-600' />;
			case 'error':
				return <XCircle className='w-5 h-5 text-red-600' />;
			default:
				return null;
		}
	};

	const getBgColor = () => {
		switch (type) {
			case 'success':
				return 'bg-green-50 border-green-200';
			case 'error':
				return 'bg-red-50 border-red-200';
			default:
				return 'bg-blue-50 border-blue-200';
		}
	};

	return (
		<div
			className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out ${
				isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
			}`}
		>
			<div
				className={`flex items-center gap-2 px-3 py-2 rounded border shadow-lg min-w-72 max-w-sm ${getBgColor()}`}
			>
				{getIcon()}
				<span className='flex-1 text-sm font-medium text-gray-900'>{message}</span>
				<button
					onClick={() => {
						setIsVisible(false);
						setTimeout(onClose, 300);
					}}
					className='text-gray-400 hover:text-gray-600 transition-colors'
				>
					<X className='w-4 h-4' />
				</button>
			</div>
		</div>
	);
};
