/**
 * Pill — tonal badge for billing module.
 * Wraps the existing Badge concept with editorial sizing & oklch tones.
 * Use cases: "Frequent breaker", "Disputing", "Deteriorating", "At risk".
 *
 * For neutral status tags inside non-billing routes, keep using <Badge>.
 */

import React from 'react';
import { cn } from '../../utils/cn';

export type PillTone = 'ink' | 'risk' | 'warn' | 'good' | 'neutral';

interface PillProps {
	tone?: PillTone;
	icon?: React.ReactNode; // pass a lucide icon node, e.g. <Flame size={10} />
	children: React.ReactNode;
	className?: string;
}

const toneClasses: Record<PillTone, string> = {
	neutral: 'bg-white text-[color:var(--billing-ink-2)] border-[color:var(--billing-rule)]',
	ink:     'bg-[color:var(--billing-ink)] text-[color:var(--billing-bg)] border-[color:var(--billing-ink)]',
	risk:    'bg-[color:var(--billing-risk-bg)] text-[color:var(--billing-risk)] border-[color:var(--billing-risk-rule)]',
	warn:    'bg-[color:var(--billing-warn-bg)] text-[color:var(--billing-warn)] border-[color:var(--billing-warn-rule)]',
	good:    'bg-[color:var(--billing-good-bg)] text-[color:var(--billing-good)] border-[color:var(--billing-good-rule)]',
};

export const Pill: React.FC<PillProps> = ({ tone = 'neutral', icon, children, className }) => {
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium leading-tight border',
				toneClasses[tone],
				className
			)}
		>
			{icon}
			{children}
		</span>
	);
};
