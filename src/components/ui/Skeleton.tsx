/**
 * Skeleton loading components
 * Provides visual placeholders while content is loading
 */

import { cn } from '../../utils/cn';

interface SkeletonProps {
	className?: string;
	width?: string | number;
	height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, width, height }) => {
	return (
		<div
			className={cn('animate-pulse bg-gray-200 rounded', className)}
			style={{ width, height }}
		/>
	);
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
	rows = 5,
	columns = 4,
}) => {
	return (
		<div className='space-y-3'>
			{/* Header skeleton */}
			<div className='flex gap-4 pb-2 border-b'>
				{Array.from({ length: columns }).map((_, i) => (
					<Skeleton key={`header-${i}`} className='h-5 flex-1' />
				))}
			</div>
			{/* Row skeletons */}
			{Array.from({ length: rows }).map((_, rowIndex) => (
				<div key={`row-${rowIndex}`} className='flex gap-4'>
					{Array.from({ length: columns }).map((_, colIndex) => (
						<Skeleton key={`cell-${rowIndex}-${colIndex}`} className='h-10 flex-1' />
					))}
				</div>
			))}
		</div>
	);
};

export const FilterSkeleton: React.FC = () => {
	return (
		<div className='flex items-center gap-4'>
			<Skeleton className='h-12 w-48' />
			<Skeleton className='h-12 w-48' />
		</div>
	);
};

