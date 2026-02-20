/**
 * Upload Zone Component
 * Provides drag-and-drop functionality for 2D sketch upload
 */

import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface UploadZoneProps {
	onFileSelect: (file: File) => void;
	isLoading?: boolean;
}

const VALID_FILE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isLoading = false }) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragCounter, setDragCounter] = useState(0);
	const [error, setError] = useState<string | null>(null);

	// Validate file
	const validateFile = (file: File): boolean => {
		if (!VALID_FILE_TYPES.includes(file.type)) {
			setError('Please upload a valid image file (.png, .jpg, .svg)');
			return false;
		}

		if (file.size > MAX_FILE_SIZE) {
			setError('File size must be under 10MB');
			return false;
		}

		setError(null);
		return true;
	};

	// Handle file selection
	const handleFileSelect = (file: File) => {
		if (validateFile(file)) {
			onFileSelect(file);
		}
	};

	// Drag enter handler
	const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setDragCounter(prev => prev + 1);
		setIsDragging(true);
	};

	// Drag leave handler
	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setDragCounter(prev => prev - 1);
		if (dragCounter - 1 === 0) {
			setIsDragging(false);
		}
	};

	// Drop handler
	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
		setDragCounter(0);

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			handleFileSelect(files[0]);
		}
	};

	// Click handler
	const handleClick = () => {
		if (!isLoading) {
			fileInputRef.current?.click();
		}
	};

	// File input change handler
	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			handleFileSelect(files[0]);
		}
		// Reset input so same file can be selected again
		e.target.value = '';
	};

	return (
		<div className='space-y-4'>
			<div
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={e => e.preventDefault()}
				onDrop={handleDrop}
				onClick={handleClick}
				className={cn(
					'relative border-2 border-dashed rounded-lg p-8 sm:p-12 lg:p-16 text-center cursor-pointer',
					'transition-all duration-200 ease-in-out',
					isDragging
						? 'border-primary bg-primary-50 scale-105 shadow-z4'
						: 'border-border bg-background-secondary hover:bg-background-secondary',
					isLoading && 'cursor-not-allowed opacity-75'
				)}
			>
				<input
					ref={fileInputRef}
					type='file'
					accept='.png,.jpg,.jpeg,.svg'
					onChange={handleFileInputChange}
					className='hidden'
					disabled={isLoading}
				/>

				<div className='space-y-3'>
					<div className={cn('flex justify-center', isDragging && 'animate-bounce')}>
						<Upload className='w-12 h-12 text-foreground-secondary' />
					</div>

					<div>
						<p className='text-base font-semibold text-foreground'>
							{isDragging ? 'Drop your sketch here' : 'Drag and drop your 2D sketch'}
						</p>
						<p className='text-sm text-foreground-secondary mt-1'>
							or click to browse from your computer
						</p>
					</div>

					<div className='flex flex-wrap justify-center gap-2 text-xs text-foreground-muted pt-2'>
						<span>PNG</span>
						<span>•</span>
						<span>JPG</span>
						<span>•</span>
						<span>SVG</span>
						<span>•</span>
						<span>Max 10MB</span>
					</div>
				</div>
			</div>

			{/* Error message */}
			{error && (
				<div className='rounded-lg bg-error-50 border border-error-200 p-4'>
					<p className='text-sm font-medium text-error-700'>{error}</p>
				</div>
			)}
		</div>
	);
};
