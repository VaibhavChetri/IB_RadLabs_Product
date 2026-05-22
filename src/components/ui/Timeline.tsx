/**
 * Timeline — vertical-rail event stream. Used on Client Detail to merge
 * threads, commitments, invoices and payments into one chronological view.
 *
 * Generic over event type — render prop pattern. The page builds events
 * from HealthCustomer.threads and passes them in sorted order.
 *
 * Each event renders as a card with: dot + title + quote + meta + linkage chips.
 */

import React from 'react';
import { fmtRelativeDate, fmtAbsDate } from '../../utils/billing';
import { Pill, type PillTone } from './Pill';

export interface TimelineEvent {
	id: string;
	type: 'commit_broken' | 'commit_kept' | 'signal' | 'invoice' | 'payment' | 'flag' | 'action';
	tone: PillTone;
	date: string;          // ISO
	title: string;
	quote?: string | null; // the AI-extracted evidence
	meta?: string;
	links?: Array<{ icon?: React.ReactNode; label: string; href?: string }>;
}

interface TimelineProps {
	events: TimelineEvent[];
	emptyText?: string;
}

const toneVar: Record<PillTone, string> = {
	neutral: 'var(--billing-ink-3)',
	ink: 'var(--billing-ink)',
	risk: 'var(--billing-risk)',
	warn: 'var(--billing-warn)',
	good: 'var(--billing-good)',
};

export const Timeline: React.FC<TimelineProps> = ({ events, emptyText = 'No events in this window.' }) => {
	if (events.length === 0) {
		return <div className="text-sm text-[color:var(--billing-ink-3)] py-8 text-center">{emptyText}</div>;
	}
	return (
		<div className="relative pl-7">
			<div className="absolute left-[6px] top-2 bottom-2 w-px bg-[color:var(--billing-rule)]" />
			{events.map(e => (
				<TimelineEventRow key={e.id} e={e} />
			))}
		</div>
	);
};

const TimelineEventRow: React.FC<{ e: TimelineEvent }> = ({ e }) => {
	const accent = toneVar[e.tone];
	return (
		<div className="relative pb-5">
			{/* Dot */}
			<div
				className="absolute -left-[28px] top-1 w-3.5 h-3.5 rounded-full grid place-items-center"
				style={{ background: 'var(--billing-bg)', border: `2px solid ${accent}` }}
			>
				<span style={{ display: 'block', width: 4, height: 4, borderRadius: '50%', background: accent }} />
			</div>
			{/* Card */}
			<div
				className="bg-white rounded border border-[color:var(--billing-rule)] px-3.5 py-3"
				style={{ borderLeft: `3px solid ${accent}` }}
			>
				<div className="flex items-baseline gap-2">
					<span className="text-[12.5px] font-semibold">{e.title}</span>
					<div className="flex-1" />
					<span className="text-[10.5px] text-[color:var(--billing-ink-3)] ledger-num">{fmtRelativeDate(e.date)}</span>
					<span className="text-[10.5px] text-[color:var(--billing-ink-4)] ledger-num">{fmtAbsDate(e.date)}</span>
				</div>
				{e.quote && (
					<div className="editorial-em text-[17px] mt-2 leading-snug text-[color:var(--billing-ink)]">
						{'"'}{e.quote}{'"'}
					</div>
				)}
				{e.meta && (
					<div className="text-[11.5px] text-[color:var(--billing-ink-2)] mt-1.5 leading-relaxed">{e.meta}</div>
				)}
				{e.links && e.links.length > 0 && (
					<div className="flex gap-1.5 mt-2.5 pt-2 border-t border-dotted border-[color:var(--billing-rule)]">
						{e.links.map((l, i) => (
							<Pill key={i} icon={l.icon}>{l.label}</Pill>
						))}
					</div>
				)}
			</div>
		</div>
	);
};
