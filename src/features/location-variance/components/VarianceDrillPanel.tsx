/**
 * VarianceDrillPanel
 *
 * The right-side SlideOver that opens when a row in the table or outliers
 * card is clicked. Composes: header → narrative → chart → bars → SKU
 * breakdown → rejection reasons.
 */

import React from 'react';
import { SlideOver } from '../../../components/ui';
import { useDrillDown } from '../hooks/useDrillDown';
import { VarianceLineChart } from './VarianceLineChart';
import { VarianceDataTable } from './VarianceDataTable';
import { PerSkuMonthlyTable } from './PerSkuMonthlyTable';
import { DecompositionBars } from './DecompositionBars';
import { SkuBreakdownTable } from './SkuBreakdownTable';
import { RejectionReasonsList } from './RejectionReasonsList';
import { NarrativeBlock } from './NarrativeBlock';
import { formatINR, formatMonthLabel } from '../../../utils/currencyFormatter';

interface VarianceDrillPanelProps {
	open: boolean;
	locationId: number | null;
	month: string | null;
	onClose: () => void;
}

export const VarianceDrillPanel: React.FC<VarianceDrillPanelProps> = ({
	open,
	locationId,
	month,
	onClose,
}) => {
	const { variance, series, loading, error } = useDrillDown({ locationId, month });

	const title = variance ? (
		<div className='flex flex-col gap-1'>
			<div className='text-base font-semibold'>{variance.location.name}</div>
			<div className='flex items-center gap-2 text-xs text-gray-500 font-normal'>
				<span>{variance.location.city_name || '—'}</span>
				<span className='inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700'>
					{variance.location.billing_type_name || 'Mode ?'}
					{variance.location.billing_sub_type_name && ` · ${variance.location.billing_sub_type_name}`}
				</span>
				<span>·</span>
				<span>
					{formatMonthLabel(variance.month)} vs {formatMonthLabel(variance.prev_month)}
				</span>
			</div>
		</div>
	) : (
		'Loading…'
	);

	return (
		<SlideOver open={open} onClose={onClose} title={title} width='xl'>
			{loading && (
				<div className='py-12 text-center text-sm text-gray-500'>Loading drill-down…</div>
			)}

			{error && !loading && (
				<div className='py-6 text-sm text-red-600'>Failed to load drill-down: {error}</div>
			)}

			{variance && !loading && (
				<div className='space-y-6'>
					{/* Top totals strip */}
					<div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
						<TotalsCell
							label='Derived (curr)'
							value={formatINR(variance.totals.derived_current)}
						/>
						<TotalsCell
							label='Derived (prev)'
							value={formatINR(variance.totals.derived_previous)}
						/>
						<TotalsCell
							label='Billed (curr)'
							value={formatINR(variance.totals.billed_current)}
						/>
						<TotalsCell
							label='Billed (prev)'
							value={formatINR(variance.totals.billed_previous)}
						/>
					</div>

					<DeltaStrip
						derivedDelta={variance.totals.derived_delta}
						billedDelta={variance.totals.billed_delta}
					/>

					{/* Narrative */}
					<NarrativeBlock narrative={variance.narrative} />

					{/* Chart */}
					<section>
						<h3 className='text-xs font-semibold uppercase text-gray-600 mb-2'>
							Trailing 6 months — line chart
						</h3>
						<VarianceLineChart series={series} />
					</section>

					{/* Totals data table */}
					<section>
						<h3 className='text-xs font-semibold uppercase text-gray-600 mb-2'>
							Trailing 6 months — data table
						</h3>
						<VarianceDataTable series={series} />
					</section>

					{/* Per-SKU pivot — SKU × month with MoM delta in each cell */}
					<section>
						<h3 className='text-xs font-semibold uppercase text-gray-600 mb-2'>
							SKU movement over time
						</h3>
						<PerSkuMonthlyTable series={series} />
					</section>

					{/* Lever bars */}
					<section>
						<h3 className='text-xs font-semibold uppercase text-gray-600 mb-2'>
							What moved the number
						</h3>
						<DecompositionBars variance={variance} />
					</section>

					{/* SKU breakdown */}
					{variance.location.billing_type_id !== 3 && (
						<section>
							<h3 className='text-xs font-semibold uppercase text-gray-600 mb-2'>
								Per-SKU breakdown
							</h3>
							<SkuBreakdownTable rows={variance.sku_breakdown} />
						</section>
					)}

					{/* Rejection reasons */}
					<section>
						<h3 className='text-xs font-semibold uppercase text-gray-600 mb-2'>
							Rejection reasons ({formatMonthLabel(variance.month)})
						</h3>
						<RejectionReasonsList rows={variance.rejection_reasons} />
					</section>

					{variance._note && (
						<div className='text-xs text-gray-500 italic border-t border-gray-100 pt-3'>
							{variance._note}
						</div>
					)}
				</div>
			)}
		</SlideOver>
	);
};

const TotalsCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
	<div className='rounded-md bg-gray-50 px-3 py-2'>
		<div className='text-[10px] uppercase text-gray-500 font-medium'>{label}</div>
		<div className='text-sm font-mono font-semibold text-gray-900 mt-0.5'>{value}</div>
	</div>
);

const DeltaStrip: React.FC<{
	derivedDelta: number;
	billedDelta: number | null;
}> = ({ derivedDelta, billedDelta }) => {
	const cls = (n: number | null) => {
		if (n == null) return 'text-gray-500';
		if (n > 0) return 'text-green-600';
		if (n < 0) return 'text-red-600';
		return 'text-gray-500';
	};
	return (
		<div className='flex items-center gap-4 text-sm'>
			<div>
				<span className='text-gray-500'>Derived Δ </span>
				<span className={`font-mono font-semibold ${cls(derivedDelta)}`}>
					{formatINR(Math.abs(derivedDelta))}
					{derivedDelta < 0 ? ' down' : derivedDelta > 0 ? ' up' : ''}
				</span>
			</div>
			<div>
				<span className='text-gray-500'>Billed Δ </span>
				<span className={`font-mono font-semibold ${cls(billedDelta)}`}>
					{billedDelta == null ? '—' : `${formatINR(Math.abs(billedDelta))}${billedDelta < 0 ? ' down' : billedDelta > 0 ? ' up' : ''}`}
				</span>
			</div>
		</div>
	);
};

