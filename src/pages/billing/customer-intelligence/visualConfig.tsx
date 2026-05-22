/**
 * Colour and label maps for Module 2. Kept separate from M1's statusConfig so
 * each module owns its own visual grammar — but the same palette family
 * (emerald/amber/red/slate) is reused so the dashboard feels coherent.
 */

import type {
	RelationshipHealth,
	ConcernSeverity,
	ConcernTrending,
	LeadPriority,
	HandlingDataDepth,
	Responsiveness,
	CommunicationStyle,
} from '../../../mocks/customerIntelligence';

export interface HealthVisual {
	label: string;
	pill: string;
	dot: string;
	stripe: string;
	bgSoft: string;
}

export const HEALTH_VISUAL: Record<RelationshipHealth, HealthVisual> = {
	healthy: {
		label: 'Healthy',
		pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		dot: 'bg-emerald-500',
		stripe: 'border-l-emerald-500',
		bgSoft: 'bg-emerald-50/30',
	},
	watch: {
		label: 'Watch',
		pill: 'bg-amber-50 text-amber-800 border-amber-200',
		dot: 'bg-amber-500',
		stripe: 'border-l-amber-500',
		bgSoft: 'bg-amber-50/30',
	},
	at_risk: {
		label: 'At risk',
		pill: 'bg-red-50 text-red-700 border-red-300 font-semibold',
		dot: 'bg-red-500',
		stripe: 'border-l-red-500',
		bgSoft: 'bg-red-50/30',
	},
};

export const ALL_HEALTH: RelationshipHealth[] = ['at_risk', 'watch', 'healthy'];

export const CONCERN_SEVERITY_VISUAL: Record<ConcernSeverity, { label: string; pill: string }> = {
	high: { label: 'High', pill: 'bg-red-50 text-red-700 border-red-200' },
	medium: { label: 'Medium', pill: 'bg-amber-50 text-amber-800 border-amber-200' },
	low: { label: 'Low', pill: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const CONCERN_TRENDING_VISUAL: Record<
	ConcernTrending,
	{ label: string; arrow: string; classes: string }
> = {
	escalating: {
		label: 'Escalating',
		arrow: '↗',
		classes: 'bg-red-50 text-red-700 border-red-200',
	},
	stable: {
		label: 'Stable',
		arrow: '→',
		classes: 'bg-slate-50 text-slate-600 border-slate-200',
	},
	resolving: {
		label: 'Resolving',
		arrow: '↘',
		classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	},
};

export const LEAD_PRIORITY_VISUAL: Record<LeadPriority, { label: string; classes: string; dot: string }> = {
	high: { label: 'High', classes: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
	medium: {
		label: 'Medium',
		classes: 'bg-amber-50 text-amber-700 border-amber-200',
		dot: 'bg-amber-500',
	},
	low: {
		label: 'Low',
		classes: 'bg-slate-50 text-slate-600 border-slate-200',
		dot: 'bg-slate-400',
	},
};

export const DATA_DEPTH_VISUAL: Record<HandlingDataDepth, { label: string; classes: string; hint: string }> = {
	rich: {
		label: 'Rich data',
		classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		hint: '3+ threads — full behavioural profile available.',
	},
	sparse: {
		label: 'Limited data',
		classes: 'bg-amber-50 text-amber-700 border-amber-200',
		hint: '1–2 threads — only last-conversation context and lead guidance.',
	},
	new: {
		label: 'New customer',
		classes: 'bg-sky-50 text-sky-700 border-sky-200',
		hint: 'No prior interactions yet.',
	},
};

export const RESPONSIVENESS_VISUAL: Record<Responsiveness, { label: string; classes: string }> = {
	fast: { label: 'Fast', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
	moderate: { label: 'Moderate', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
	slow: { label: 'Slow', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
	erratic: { label: 'Erratic', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export const COMMUNICATION_STYLE_LABEL: Record<CommunicationStyle, string> = {
	formal: 'Formal',
	informal: 'Informal',
	transactional: 'Transactional',
};
