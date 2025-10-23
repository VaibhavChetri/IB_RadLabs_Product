import React from 'react';
import { cn } from '../../utils/cn';
import { componentVariants } from '../../design-system/tokens';

export interface BadgeProps {
	variant: 'status' | 'type';
	type: 'scheduled' | 'inProgress' | 'completed' | 'dispatch' | 'pickup' | 'default';
	icon?: string;
	children: React.ReactNode;
	className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant, type, icon, children, className }) => {
	const baseClasses =
		'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border';
	const variantClasses = (componentVariants.badge.variant[variant] as any)[type];
	const iconClasses = type === 'pickup' ? 'transform scale-x-[-1]' : '';

	return (
		<span className={cn(baseClasses, variantClasses, className)}>
			{icon && <span className={cn('text-sm', iconClasses)}>{icon}</span>}
			<span>{children}</span>
		</span>
	);
};
