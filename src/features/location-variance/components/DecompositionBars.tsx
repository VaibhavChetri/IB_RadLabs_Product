/**
 * DecompositionBars
 *
 * Horizontal bars showing each lever's contribution to the month-over-month
 * delta. Positive = green (revenue up from this lever), negative = red.
 * Null levers are rendered as "n/a" rows so it's clear they weren't computed.
 *
 * Levers shown depend on the mode:
 *   Mode 1/2/4: count_lever, rejection_lever, price_lever
 *   Mode 3:     fixed_lever, extras_lever
 */

import React, { useMemo } from 'react';
import type { RevenueVarianceResponse } from '../types';
import { formatINRDelta } from '../../../utils/currencyFormatter';

interface DecompositionBarsProps {
	variance: RevenueVarianceResponse;
}

interface LeverRow {
	label: string;
	value: number | null;
	tooltip: string;
}

export const DecompositionBars: React.FC<DecompositionBarsProps> = ({ variance }) => {
	const isFixedMode = variance.location.billing_type_id === 3;
	const decomp = variance.decomposition;

	const rows: LeverRow[] = useMemo(() => {
		if (isFixedMode) {
			return [
				{
					label: 'Fixed lever',
					value: decomp.fixed_lever,
					tooltip: 'Change in the flat monthly fixed price between months.',
				},
				{
					label: 'Extras lever',
					value: decomp.extras_lever,
					tooltip: 'Change in Zoho extras billed above the fixed price (damage / late / add-ons).',
				},
			];
		}
		return [
			{
				label: 'Count lever',
				value: decomp.count_lever,
				tooltip: 'Δ in plates moved × price.',
			},
			{
				label: 'Rejection lever',
				value: decomp.rejection_lever,
				tooltip: 'Δ in QC rejection rate × dispatched × price.',
			},
			{
				label: 'Price lever',
				value: decomp.price_lever,
				tooltip: 'Aggregate effective per-plate price drift (back-derived from Zoho).',
			},
		];
	}, [decomp, isFixedMode]);

	const maxAbs = useMemo(() => {
		const xs = rows.map((r) => Math.abs(r.value ?? 0));
		const m = Math.max(...xs, 1);
		return m;
	}, [rows]);

	return (
		<div className='space-y-3'>
			{rows.map((r) => {
				const isNull = r.value == null;
				const v = r.value ?? 0;
				const pct = isNull ? 0 : (Math.abs(v) / maxAbs) * 100;
				const direction = v >= 0 ? 'right' : 'left';
				const barCls = isNull
					? 'bg-gray-200'
					: v >= 0
						? 'bg-green-500'
						: 'bg-red-500';

				return (
					<div key={r.label} className='flex items-center gap-3'>
						<div className='w-32 text-xs text-gray-700 font-medium' title={r.tooltip}>
							{r.label}
						</div>
						<div className='flex-1 relative h-6 bg-gray-50 rounded'>
							{/* Center line */}
							<div className='absolute left-1/2 top-0 bottom-0 w-px bg-gray-300' />
							{!isNull && (
								<div
									className={`absolute top-0 bottom-0 ${barCls} rounded`}
									style={{
										width: `${pct / 2}%`,
										[direction === 'right' ? 'left' : 'right']: '50%',
									}}
								/>
							)}
						</div>
						<div
							className={`w-28 text-right font-mono text-xs ${
								isNull
									? 'text-gray-400'
									: v > 0
										? 'text-green-600'
										: v < 0
											? 'text-red-600'
											: 'text-gray-500'
							}`}
						>
							{isNull ? 'n/a' : formatINRDelta(v, { compact: true })}
						</div>
					</div>
				);
			})}
		</div>
	);
};
