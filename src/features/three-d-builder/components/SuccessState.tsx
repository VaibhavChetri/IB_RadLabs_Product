/**
 * Success State Component
 * Displays confirmation when sketch is ready for 3D model generation
 */

import React from 'react';
import { CheckCircle, Box } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface SuccessStateProps {
	onGenerate3DModel: () => void;
	isLoading?: boolean;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
	onGenerate3DModel,
	isLoading = false,
}) => {
	return (
		<div className='text-center py-8 sm:py-12 opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]'>
			{/* Success Icon */}
			<div className='inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-success-50 rounded-full mb-4 sm:mb-6'>
				<CheckCircle className='w-8 h-8 sm:w-10 sm:h-10 text-success-600' />
			</div>

			{/* Heading */}
			<h3 className='text-lg sm:text-xl font-semibold text-foreground mb-2'>
				Sketch Validated Successfully
			</h3>

			{/* Description */}
			<p className='text-sm text-foreground-secondary mb-6 sm:mb-8 max-w-sm mx-auto'>
				All requirements confirmed. Your sketch is ready to be transformed into a 3D model.
			</p>

			{/* CTA Button */}
			<Button
				variant='primary'
				size='lg'
				onClick={onGenerate3DModel}
				loading={isLoading}
				leftIcon={!isLoading && <Box className='w-5 h-5' />}
				className='transition-all duration-200 hover:scale-105 active:scale-95'
			>
				{isLoading ? 'Generating...' : 'Generate 3D Model'}
			</Button>

			{/* Footer text */}
			<p className='text-xs text-foreground-muted mt-6 sm:mt-8'>
				This may take a few moments
			</p>
		</div>
	);
};
