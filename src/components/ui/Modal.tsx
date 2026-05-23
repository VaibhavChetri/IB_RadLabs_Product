/**
 * Lightweight, dependency-free Modal + SlideOver primitives.
 *
 *   <Modal open={x} onClose={fn} title="..." size="md">{children}</Modal>
 *   <SlideOver open={x} onClose={fn} title="..." width="lg">{children}</SlideOver>
 *
 * Behaviour: ESC closes, click-outside on backdrop closes, body scroll locked
 * while open, focus moved to the panel on open. No portal — renders inline; the
 * fixed positioning lifts it above the rest of the app.
 */

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

const SIZE_CLASS: Record<string, string> = {
	sm: 'max-w-md',
	md: 'max-w-2xl',
	lg: 'max-w-4xl',
	xl: 'max-w-6xl',
};

interface ModalProps {
	open: boolean;
	onClose: () => void;
	title?: React.ReactNode;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	footer?: React.ReactNode;
	children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, size = 'md', footer, children }) => {
	const panelRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', onKey);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		// move focus to panel
		setTimeout(() => panelRef.current?.focus(), 0);
		return () => {
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = prevOverflow;
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			className='fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50'
			role='dialog'
			aria-modal='true'
			onClick={onClose}
		>
			<div
				ref={panelRef}
				tabIndex={-1}
				className={cn(
					'w-full bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col outline-none',
					SIZE_CLASS[size] || SIZE_CLASS.md
				)}
				onClick={(e) => e.stopPropagation()}
			>
				{title && (
					<div className='flex items-center justify-between px-5 py-4 border-b border-gray-200'>
						<div className='text-lg font-semibold text-gray-900'>{title}</div>
						<button
							onClick={onClose}
							className='p-1 rounded hover:bg-gray-100 text-gray-500'
							aria-label='Close'
						>
							<X className='w-5 h-5' />
						</button>
					</div>
				)}
				<div className='flex-1 overflow-y-auto px-5 py-4'>{children}</div>
				{footer && <div className='px-5 py-3 border-t border-gray-200 bg-gray-50'>{footer}</div>}
			</div>
		</div>
	);
};

const SLIDE_WIDTH: Record<string, string> = {
	sm: 'max-w-md',
	md: 'max-w-xl',
	lg: 'max-w-2xl',
	xl: 'max-w-3xl',
};

interface SlideOverProps {
	open: boolean;
	onClose: () => void;
	title?: React.ReactNode;
	width?: 'sm' | 'md' | 'lg' | 'xl';
	footer?: React.ReactNode;
	children: React.ReactNode;
}

export const SlideOver: React.FC<SlideOverProps> = ({ open, onClose, title, width = 'lg', footer, children }) => {
	const panelRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', onKey);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		setTimeout(() => panelRef.current?.focus(), 0);
		return () => {
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = prevOverflow;
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			className='fixed inset-0 z-[1000] flex justify-end bg-black/50'
			role='dialog'
			aria-modal='true'
			onClick={onClose}
		>
			<div
				ref={panelRef}
				tabIndex={-1}
				className={cn(
					'w-full bg-white shadow-xl h-full flex flex-col outline-none',
					SLIDE_WIDTH[width] || SLIDE_WIDTH.lg
				)}
				onClick={(e) => e.stopPropagation()}
			>
				{title && (
					<div className='flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0'>
						<div className='text-lg font-semibold text-gray-900'>{title}</div>
						<button
							onClick={onClose}
							className='p-1 rounded hover:bg-gray-100 text-gray-500'
							aria-label='Close'
						>
							<X className='w-5 h-5' />
						</button>
					</div>
				)}
				<div className='flex-1 overflow-y-auto px-5 py-4'>{children}</div>
				{footer && <div className='px-5 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0'>{footer}</div>}
			</div>
		</div>
	);
};
