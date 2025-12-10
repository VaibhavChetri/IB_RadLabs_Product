/**
 * Delete Confirmation Modal Component
 * Provides a proper UI for confirming delete actions
 */

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui';

interface DeleteConfirmationModalProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title?: string;
	message: string;
	isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
	open,
	onClose,
	onConfirm,
	title = 'Confirm Delete',
	message,
	isDeleting = false,
}) => {
	if (!open) return null;

	const handleConfirm = () => {
		onConfirm();
	};

	return (
		<div
			className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'
			onClick={onClose}
		>
			<div
				className='bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl'
				onClick={e => e.stopPropagation()}
			>
				<div className='flex items-start gap-4 mb-6'>
					<div className='flex-shrink-0'>
						<div className='w-12 h-12 rounded-full bg-red-100 flex items-center justify-center'>
							<AlertTriangle className='w-6 h-6 text-red-600' />
						</div>
					</div>
					<div className='flex-1'>
						<h3 className='text-xl font-semibold text-gray-900 mb-2'>{title}</h3>
						<p className='text-gray-600'>{message}</p>
					</div>
					<button
						onClick={onClose}
						className='p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0'
						disabled={isDeleting}
					>
						<X className='w-5 h-5 text-gray-500' />
					</button>
				</div>

				<div className='flex justify-end space-x-3'>
					<Button type='button' variant='outline' onClick={onClose} disabled={isDeleting}>
						Cancel
					</Button>
					<Button
						type='button'
						variant='primary'
						onClick={handleConfirm}
						disabled={isDeleting}
						className='bg-red-600 hover:bg-red-700 text-white'
					>
						{isDeleting ? 'Deleting...' : 'Delete'}
					</Button>
				</div>
			</div>
		</div>
	);
};


