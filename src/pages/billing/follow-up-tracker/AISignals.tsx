/**
 * Presentational components for Module 1.6 AI enrichment fields.
 *
 * Each component is null-safe: when the backend hasn't run the 1.6 pipeline
 * on a row yet, the field is undefined and the component renders nothing.
 * This lets the dashboard ship before backend coverage is universal — the new
 * UI lights up automatically as rows get enriched.
 *
 * Kept in a sibling file so FollowUpTracker.tsx doesn't grow unbounded.
 */

import React from 'react';
import {
	FileDown,
	FileUp,
	CheckSquare,
	Handshake,
	TrendingUp,
	TrendingDown,
	Minus,
	AlertOctagon,
	Sparkles,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import type {
	FollowUpAI,
	ActionItem,
	Commitment,
	RiskSignal,
	PositiveSignal,
	SignalSpeaker,
} from '../../../mocks/followUpTracker';
import {
	BALL_IN_COURT_VISUAL,
	PAYMENT_INTENT_VISUAL,
	SENTIMENT_VISUAL,
	PAYMENT_WINDOW_VISUAL,
	RISK_SEVERITY_VISUAL,
	RISK_TYPE_LABEL,
	POSITIVE_SIGNAL_TYPE_LABEL,
	SIGNAL_SPEAKER_LABEL,
	COMMITMENT_KEPT_VISUAL,
	ACTION_STATUS_VISUAL,
} from './statusConfig';
import { formatDate } from './utils';

// ──────────────────────────────────────────────────────────────────────────────
// Row-level: ball-in-court pill (tiny, sits next to Thread state)
// ──────────────────────────────────────────────────────────────────────────────

export const BallInCourtPill: React.FC<{ value: FollowUpAI['ball_in_court'] }> = ({ value }) => {
	if (!value) return null;
	const v = BALL_IN_COURT_VISUAL[value];
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap',
				v.classes
			)}
			title={v.hint}
		>
			<span className={cn('h-1.5 w-1.5 rounded-full', v.dot)} />
			{v.short}
		</span>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Row-level: risk chips below the truncated AI summary (top 1–2 by severity)
// ──────────────────────────────────────────────────────────────────────────────

const SEVERITY_RANK: Record<NonNullable<RiskSignal>['severity'], number> = {
	severe_negative: 0,
	mild_negative: 1,
	positive: 2,
};

export const RiskChips: React.FC<{ risks?: RiskSignal[]; max?: number }> = ({
	risks,
	max = 2,
}) => {
	if (!risks || risks.length === 0) return null;
	const sorted = [...risks].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
	const shown = sorted.slice(0, max);
	const more = sorted.length - shown.length;

	return (
		<div className='mt-1.5 flex flex-wrap items-center gap-1'>
			{shown.map((r, i) => {
				const v = RISK_SEVERITY_VISUAL[r.severity];
				return (
					<span
						key={i}
						title={r.evidence}
						className={cn(
							'inline-flex items-center gap-1 px-1.5 py-0 rounded-full text-[10px] font-medium border',
							v.classes
						)}
					>
						<AlertOctagon className={cn('h-2.5 w-2.5', v.iconColor)} />
						{RISK_TYPE_LABEL[r.type]}
					</span>
				);
			})}
			{more > 0 && (
				<span className='text-[10px] text-gray-500'>+{more} more</span>
			)}
		</div>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Expand-level: payment prediction + sentiment + response-time card
// ──────────────────────────────────────────────────────────────────────────────

export const PaymentPredictionTile: React.FC<{ ai: FollowUpAI }> = ({ ai }) => {
	const window = ai.predicted_payment_window;
	const sentiment = ai.sentiment_trajectory;
	const intent = ai.payment_intent;
	const ourDays = ai.our_avg_response_days ?? null;
	const theirDays = ai.their_avg_response_days ?? null;

	// If the entire 1.6 bundle is missing, render nothing — caller's parent
	// section gets a normal layout instead of an empty card.
	if (!window && !sentiment && !intent && ourDays === null && theirDays === null) return null;

	const windowVisual = window ? PAYMENT_WINDOW_VISUAL[window] : null;
	const sentimentVisual = sentiment ? SENTIMENT_VISUAL[sentiment] : null;
	const intentVisual = intent ? PAYMENT_INTENT_VISUAL[intent] : null;
	const sentimentIcon =
		sentiment === 'improving'
			? <TrendingUp className='h-3 w-3' />
			: sentiment === 'deteriorating'
				? <TrendingDown className='h-3 w-3' />
				: <Minus className='h-3 w-3' />;
	const confidencePct =
		ai.prediction_confidence != null
			? `${Math.round(ai.prediction_confidence * 100)}%`
			: null;

	return (
		<div className='bg-white border border-gray-200 rounded-lg p-3 space-y-2.5'>
			<div className='flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide'>
				<Sparkles className='h-3 w-3 text-emerald-500' />
				AI prediction
			</div>

			{windowVisual && (
				<div className='flex items-center justify-between gap-2 text-xs'>
					<span className='text-gray-500'>Payment window</span>
					<span className='flex items-center gap-1.5'>
						<span
							className={cn(
								'px-2 py-0.5 rounded-full border text-[11px] font-medium',
								windowVisual.classes
							)}
						>
							{windowVisual.label}
						</span>
						{confidencePct && (
							<span className='text-[10px] text-gray-400'>· {confidencePct}</span>
						)}
					</span>
				</div>
			)}

			{sentimentVisual && (
				<div className='flex items-center justify-between gap-2 text-xs'>
					<span className='text-gray-500'>Sentiment trend</span>
					<span
						className={cn(
							'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium',
							sentimentVisual.classes
						)}
					>
						{sentimentIcon}
						{sentimentVisual.label}
					</span>
				</div>
			)}

			{intentVisual && (
				<div className='flex items-center justify-between gap-2 text-xs'>
					<span className='text-gray-500'>Payment intent</span>
					<span
						className={cn(
							'px-2 py-0.5 rounded-full border text-[11px] font-medium',
							intentVisual.classes
						)}
					>
						{intentVisual.label}
					</span>
				</div>
			)}

			{(ourDays !== null || theirDays !== null) && (
				<div className='pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs'>
					{ourDays !== null && (
						<div>
							<div className='text-[10px] text-gray-400 uppercase tracking-wide'>
								Our reply
							</div>
							<div
								className={cn(
									'mt-0.5 font-semibold tabular-nums',
									ourDays > 2 ? 'text-amber-700' : 'text-gray-900'
								)}
							>
								{ourDays.toFixed(1)}d avg
							</div>
						</div>
					)}
					{theirDays !== null && (
						<div>
							<div className='text-[10px] text-gray-400 uppercase tracking-wide'>
								Their reply
							</div>
							<div className='mt-0.5 font-semibold tabular-nums text-gray-900'>
								{theirDays.toFixed(1)}d avg
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Expand-level: documents we owe / they owe (two columns)
// ──────────────────────────────────────────────────────────────────────────────

export const DocumentsBlock: React.FC<{ ai: FollowUpAI }> = ({ ai }) => {
	const weOwe = ai.documents_required ?? [];
	const theyOwe = ai.documents_pending_from_them ?? [];
	if (weOwe.length === 0 && theyOwe.length === 0) return null;

	return (
		<div className='bg-white border border-gray-200 rounded-lg p-3'>
			<div className='flex items-baseline justify-between gap-3 flex-wrap mb-2'>
				<div className='text-[11px] font-semibold text-gray-500 uppercase tracking-wide'>
					Documents in flight
				</div>
				{/* Explicit hint — these are names of documents the AI pulled out of
				    the email thread, NOT clickable file references. */}
				<div className='text-[10px] text-gray-400 italic'>
					Names mentioned in the thread — no file is attached.
				</div>
			</div>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
				<DocColumn
					tone='amber'
					icon={<FileUp className='h-3.5 w-3.5' />}
					title='We need to send'
					hint='We owe these to the customer.'
					items={weOwe}
				/>
				<DocColumn
					tone='sky'
					icon={<FileDown className='h-3.5 w-3.5' />}
					title='Waiting to receive'
					hint='Customer owes us these — still pending.'
					items={theyOwe}
				/>
			</div>
		</div>
	);
};

const DocColumn: React.FC<{
	tone: 'amber' | 'sky';
	icon: React.ReactNode;
	title: string;
	hint: string;
	items: string[];
}> = ({ tone, icon, title, hint, items }) => {
	const palette =
		tone === 'amber'
			? { head: 'text-amber-700', chip: 'bg-amber-50 text-amber-800 border-amber-200' }
			: { head: 'text-sky-700', chip: 'bg-sky-50 text-sky-800 border-sky-200' };
	return (
		<div>
			<div
				className={cn(
					'flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5',
					palette.head
				)}
				title={hint}
			>
				{icon}
				{title}
				<span className='text-gray-400 normal-case font-normal'>({items.length})</span>
			</div>
			{items.length === 0 ? (
				<div className='text-xs text-gray-400 italic'>None</div>
			) : (
				// `default` cursor + no hover state — chips read as labels, not buttons.
				<ul className='flex flex-wrap gap-1'>
					{items.map((it, i) => (
						<li
							key={i}
							title={hint}
							className={cn(
								'inline-flex items-start gap-1 px-2 py-0.5 rounded-md border text-[11px] cursor-default select-text',
								palette.chip
							)}
						>
							{it}
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Expand-level: action items (with owner + deadline + status)
// ──────────────────────────────────────────────────────────────────────────────

export const ActionItemsList: React.FC<{ items?: ActionItem[] }> = ({ items }) => {
	if (!items || items.length === 0) return null;
	return (
		<div className='bg-white border border-gray-200 rounded-lg p-3'>
			<div className='flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2'>
				<CheckSquare className='h-3.5 w-3.5' />
				Action items ({items.length})
			</div>
			<ul className='space-y-2'>
				{items.map((a, i) => {
					const sv = ACTION_STATUS_VISUAL[a.status];
					const ownerVisual = BALL_IN_COURT_VISUAL[
						a.owner === 'infinitybox'
							? 'infinitybox'
							: a.owner === 'customer'
								? 'customer'
								: a.owner === 'vendor'
									? 'vendor'
									: a.owner === 'internal_finance'
										? 'internal_finance'
										: 'unclear'
					];
					return (
						<li key={i} className='flex items-start gap-2 text-xs'>
							<span
								className={cn(
									'mt-0.5 inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium border whitespace-nowrap',
									sv.classes
								)}
							>
								{sv.label}
							</span>
							<div className='min-w-0 flex-1'>
								<div className='text-gray-900 leading-snug'>{a.description}</div>
								<div className='mt-0.5 flex items-center gap-2 flex-wrap text-[11px] text-gray-500'>
									<span className='inline-flex items-center gap-1'>
										<span className={cn('h-1.5 w-1.5 rounded-full', ownerVisual.dot)} />
										{ownerVisual.short}
									</span>
									{(a.deadline_text || a.deadline_iso_date) && (
										<>
											<span className='text-gray-300'>·</span>
											<span>
												Due{' '}
												<span className='font-medium text-gray-700'>
													{a.deadline_text || formatDate(a.deadline_iso_date as string)}
												</span>
											</span>
										</>
									)}
								</div>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Expand-level: commitments (highlight broken in red)
// ──────────────────────────────────────────────────────────────────────────────

export const CommitmentsList: React.FC<{ commitments?: Commitment[] }> = ({ commitments }) => {
	if (!commitments || commitments.length === 0) return null;
	return (
		<div className='bg-white border border-gray-200 rounded-lg p-3'>
			<div className='flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2'>
				<Handshake className='h-3.5 w-3.5' />
				Commitments ({commitments.length})
			</div>
			<ul className='space-y-2'>
				{commitments.map((c, i) => {
					const kv = COMMITMENT_KEPT_VISUAL[c.kept];
					const partyLabel =
						c.by_party === 'customer'
							? 'Customer'
							: c.by_party === 'us'
								? 'We'
								: 'Vendor';
					return (
						<li
							key={i}
							className={cn(
								'flex items-start gap-2 text-xs px-2 py-1.5 rounded-md',
								c.kept === 'broken' && 'bg-red-50/40 border border-red-100'
							)}
						>
							<span
								className={cn(
									'mt-0.5 inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium border whitespace-nowrap',
									kv.classes
								)}
							>
								{kv.label}
							</span>
							<div className='min-w-0 flex-1'>
								<div className='text-gray-900 leading-snug'>
									<span className='font-medium'>{partyLabel}</span> committed to{' '}
									{c.what}
								</div>
								{(c.deadline_text || c.deadline_iso_date) && (
									<div className='mt-0.5 text-[11px] text-gray-500'>
										Due{' '}
										<span className='font-medium text-gray-700'>
											{c.deadline_text || formatDate(c.deadline_iso_date as string)}
										</span>
									</div>
								)}
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Speaker attribution helper (Module 1.7)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Renders "— Speaker Name (us|them|3rd party)" inline next to a signal type
 * pill. Falls back to just the side when speaker_name is null, or hides
 * entirely when neither is provided (older rows pre-1.7).
 */
const SpeakerAttribution: React.FC<{
	said_by?: SignalSpeaker;
	speaker_name?: string | null;
	tone: 'concern' | 'strength';
}> = ({ said_by, speaker_name, tone }) => {
	if (!said_by && !speaker_name) return null;
	const sideLabel = said_by ? SIGNAL_SPEAKER_LABEL[said_by] : null;
	const text = speaker_name
		? sideLabel && sideLabel !== 'unknown'
			? `${speaker_name} (${sideLabel})`
			: speaker_name
		: sideLabel === 'unknown' || !sideLabel
			? null
			: `said by ${sideLabel}`;
	if (!text) return null;
	return (
		<span
			className={cn(
				'text-[10px] font-medium',
				tone === 'strength' ? 'text-emerald-700' : 'text-gray-600'
			)}
		>
			— {text}
		</span>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Expand-level: Concerns list (was "Risk signals" pre-1.7)
// ──────────────────────────────────────────────────────────────────────────────

export const RiskSignalsList: React.FC<{ risks?: RiskSignal[] }> = ({ risks }) => {
	if (!risks || risks.length === 0) return null;
	// 1.7 split: positives now live in their own array. Defensive filter for
	// any cached/stale rows that still carry severity='positive' in the risks
	// array — surface them via PositiveSignalsList instead, never here.
	const onlyConcerns = risks.filter(r => r.severity !== 'positive');
	if (onlyConcerns.length === 0) return null;
	const sorted = [...onlyConcerns].sort(
		(a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
	);
	return (
		<div className='bg-white border border-red-100 rounded-lg p-3'>
			<div className='flex items-center gap-1.5 text-[11px] font-semibold text-red-700 uppercase tracking-wide mb-2'>
				<AlertOctagon className='h-3.5 w-3.5' />
				Concerns ({sorted.length})
			</div>
			<ul className='space-y-2'>
				{sorted.map((r, i) => {
					const v = RISK_SEVERITY_VISUAL[r.severity];
					return (
						<li key={i} className='flex items-start gap-2 text-xs'>
							<span
								className={cn(
									'mt-0.5 inline-flex items-center gap-1 px-1.5 py-0 rounded-full text-[10px] font-medium border whitespace-nowrap shrink-0',
									v.classes
								)}
							>
								<AlertOctagon className={cn('h-2.5 w-2.5', v.iconColor)} />
								{RISK_TYPE_LABEL[r.type]}
							</span>
							<div className='flex-1 min-w-0'>
								<div className='flex items-baseline gap-1.5 flex-wrap'>
									<SpeakerAttribution
										said_by={r.said_by}
										speaker_name={r.speaker_name}
										tone='concern'
									/>
								</div>
								<p className='mt-0.5 text-gray-700 leading-snug italic'>{'"'}{r.evidence}{'"'}</p>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

// ──────────────────────────────────────────────────────────────────────────────
// Expand-level: Strengths list (Module 1.7 — separate array from risks)
// ──────────────────────────────────────────────────────────────────────────────

export const PositiveSignalsList: React.FC<{ positives?: PositiveSignal[] }> = ({
	positives,
}) => {
	// Defensive: undefined is just "no enrichment yet" — render nothing rather
	// than an empty card.
	if (!positives || positives.length === 0) return null;
	return (
		<div className='bg-white border border-emerald-100 rounded-lg p-3'>
			<div className='flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 uppercase tracking-wide mb-2'>
				<Sparkles className='h-3.5 w-3.5' />
				Strengths ({positives.length})
			</div>
			<ul className='space-y-2'>
				{positives.map((p, i) => (
					<li key={i} className='flex items-start gap-2 text-xs'>
						<span className='mt-0.5 inline-flex items-center gap-1 px-1.5 py-0 rounded-full text-[10px] font-medium border whitespace-nowrap shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200'>
							<Sparkles className='h-2.5 w-2.5 text-emerald-600' />
							{POSITIVE_SIGNAL_TYPE_LABEL[p.type]}
						</span>
						<div className='flex-1 min-w-0'>
							<div className='flex items-baseline gap-1.5 flex-wrap'>
								<SpeakerAttribution
									said_by={p.said_by}
									speaker_name={p.speaker_name}
									tone='strength'
								/>
							</div>
							<p className='mt-0.5 text-gray-700 leading-snug italic'>{'"'}{p.evidence}{'"'}</p>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
};

// Convenience: true when a row has any 1.6 enrichment worth showing.
export const hasModule16Enrichment = (ai: FollowUpAI | null | undefined): boolean => {
	if (!ai) return false;
	return Boolean(
		ai.ball_in_court ||
			ai.payment_intent ||
			ai.sentiment_trajectory ||
			ai.predicted_payment_window ||
			ai.our_avg_response_days != null ||
			ai.their_avg_response_days != null ||
			(ai.action_items && ai.action_items.length > 0) ||
			(ai.commitments && ai.commitments.length > 0) ||
			(ai.documents_required && ai.documents_required.length > 0) ||
			(ai.documents_pending_from_them && ai.documents_pending_from_them.length > 0) ||
			(ai.risk_signals && ai.risk_signals.length > 0)
	);
};
