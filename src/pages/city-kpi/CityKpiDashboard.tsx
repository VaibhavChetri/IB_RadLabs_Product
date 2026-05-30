/**
 * City-Head KPI Dashboard (P4).
 *
 * A consolidated "my city" view: revenue vs target, budget used, EBITDA vs
 * per-facility target, QC week-over-week, on-time consistency, and a daily
 * revenue burn-up vs target pace. City heads see their own city; founders/
 * finance get a city selector (same convention as PLSummary).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts';
import { PageHeader, Snackbar } from '../../components/ui';
import { Table, TableColumn } from '../../components/ui/DataDisplay';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { RootState } from '../../store';
import { canFilterByCity } from '../../utils/cityFilterPermissions';
import { formatINR, formatMonthLabel } from '../../utils/currencyFormatter';
import { CityKpiApi, type CityKpiSummary, type BurnupPoint } from '../../services/cityKpiApi';

// Last 12 months as YYYY-MM options.
const buildMonthOptions = (): { value: string; label: string }[] => {
	const out: { value: string; label: string }[] = [];
	const now = new Date();
	for (let i = 0; i < 12; i += 1) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		out.push({ value: v, label: formatMonthLabel(v) });
	}
	return out;
};

// A KPI tile with value + sub-line + status color.
const Tile: React.FC<{
	label: string;
	value: string;
	sub?: string;
	tone?: 'green' | 'amber' | 'red' | 'neutral';
	tip?: string;
}> = ({ label, value, sub, tone = 'neutral', tip }) => {
	const toneCls = {
		green: 'text-green-600',
		amber: 'text-amber-600',
		red: 'text-red-600',
		neutral: 'text-gray-900',
	}[tone];
	return (
		<div className='rounded-lg border border-gray-200 bg-white p-4' title={tip}>
			<div className='text-xs font-medium uppercase tracking-wide text-gray-500'>{label}</div>
			<div className={`mt-1 text-2xl font-semibold ${toneCls}`}>{value}</div>
			{sub && <div className='mt-0.5 text-xs text-gray-400'>{sub}</div>}
		</div>
	);
};

export const CityKpiDashboard: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const monthOptions = useMemo(buildMonthOptions, []);
	const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0].value);
	const canSelectCity = canFilterByCity(user?.userTypeId);
	const [selectedCity, setSelectedCity] = useState<number | undefined>(undefined);

	const cityId = canSelectCity ? selectedCity : user?.city_id;

	const [summary, setSummary] = useState<CityKpiSummary | null>(null);
	const [burnup, setBurnup] = useState<BurnupPoint[]>([]);
	const [loading, setLoading] = useState(false);
	const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'error' as 'error' | 'success' });

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			setLoading(true);
			try {
				const params = { month: selectedMonth, city_id: cityId };
				const [s, b] = await Promise.all([
					CityKpiApi.getSummary(params),
					CityKpiApi.getRevenueBurnup(params),
				]);
				if (cancelled) return;
				setSummary(s?.data || null);
				setBurnup(b?.data?.series || []);
			} catch (e) {
				if (!cancelled) {
					setSummary(null);
					setBurnup([]);
					setSnackbar({ open: true, message: 'Failed to load city KPIs', type: 'error' });
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		// city heads always have a city; founders must pick one first
		if (cityId) load();
		else {
			setSummary(null);
			setBurnup([]);
		}
		return () => {
			cancelled = true;
		};
	}, [selectedMonth, cityId]);

	// Tones
	const budgetTone = (pct: number | null): 'green' | 'amber' | 'red' | 'neutral' => {
		if (pct == null) return 'neutral';
		if (pct > 105) return 'red';
		if (pct >= 90) return 'amber';
		return 'green';
	};
	const attainmentTone = (pct: number | null): 'green' | 'amber' | 'red' | 'neutral' => {
		if (pct == null) return 'neutral';
		if (pct >= 100) return 'green';
		if (pct >= 80) return 'amber';
		return 'red';
	};
	const ebitdaTone = (gap: number | null): 'green' | 'amber' | 'red' | 'neutral' => {
		if (gap == null) return 'neutral';
		if (gap >= 0) return 'green';
		if (gap >= -5) return 'amber';
		return 'red';
	};
	const qcTone = (delta: number | null): 'green' | 'amber' | 'red' | 'neutral' => {
		if (delta == null) return 'neutral';
		if (delta > 0) return 'red'; // more rejections = worse
		if (delta < 0) return 'green';
		return 'neutral';
	};

	const chartData = useMemo(
		() =>
			burnup.map((p) => ({
				day: p.day.slice(8), // DD
				Actual: p.cumulativeRevenue,
				Target: p.targetPaceCumulative,
			})),
		[burnup]
	);

	const qcColumns = useMemo<TableColumn<Record<string, unknown>>[]>(
		() => [
			{ key: 'clientName', title: 'Client', sortable: true, align: 'left' },
			{
				key: 'thisWeekRejected',
				title: 'This Week',
				align: 'right',
				render: (v) => <span>{String(v ?? '-')}</span>,
			},
			{
				key: 'lastWeekRejected',
				title: 'Last Week',
				align: 'right',
				render: (v) => <span>{String(v ?? '-')}</span>,
			},
			{
				key: 'delta',
				title: 'Δ',
				align: 'right',
				render: (v) => {
					const n = Number(v);
					const cls = n > 0 ? 'text-red-600' : n < 0 ? 'text-green-600' : 'text-gray-500';
					return <span className={cls}>{n > 0 ? `+${n}` : n}</span>;
				},
			},
		],
		[]
	);

	const head = summary;
	const fresh = head?.dataFreshness;

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='mx-auto max-w-7xl'>
				<div className='mb-4 flex items-center justify-between'>
					<PageHeader
						title='My City — KPIs'
						locationName={head?.city?.city_name || user?.city_name || 'City'}
						totalItems={head?.qc?.topClients?.length || 0}
						itemType='clients with QC activity'
						icon='📊'
					/>
					<div className='flex items-center gap-2'>
						{canSelectCity && (
							<input
								type='number'
								placeholder='City ID'
								className='w-28 rounded border border-gray-300 px-2 py-1 text-sm'
								value={selectedCity ?? ''}
								onChange={(e) => setSelectedCity(e.target.value ? Number(e.target.value) : undefined)}
							/>
						)}
						<select
							className='rounded border border-gray-300 px-2 py-1 text-sm'
							value={selectedMonth}
							onChange={(e) => setSelectedMonth(e.target.value)}
						>
							{monthOptions.map((m) => (
								<option key={m.value} value={m.value}>
									{m.label}
								</option>
							))}
						</select>
					</div>
				</div>

				{canSelectCity && !cityId && (
					<div className='rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 text-center text-sm text-gray-500'>
						Enter a City ID to view its KPIs.
					</div>
				)}

				{cityId && loading && <TableSkeleton />}

				{cityId && !loading && head && (
					<>
						{fresh?.daysStale != null && fresh.daysStale > 1 && (
							<div className='mb-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-700'>
								⚠ Inventory data may be incomplete — last entry{' '}
								{fresh.lastEntryDate ? fresh.lastEntryDate.slice(0, 10) : '—'} ({fresh.daysStale} days ago).
								Numbers below understate actuals until KAMs fill the gap.
							</div>
						)}

						{/* KPI tiles */}
						<div className='grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5'>
							<Tile
								label='Revenue vs Target'
								value={head.revenue.attainmentPct == null ? '—' : `${head.revenue.attainmentPct}%`}
								sub={`${formatINR(head.revenue.actualToDate, { compact: true })} of ${
									head.revenue.target ? formatINR(head.revenue.target, { compact: true }) : 'no target set'
								}`}
								tone={attainmentTone(head.revenue.attainmentPct)}
								tip='Revenue accrued so far this month vs the monthly revenue estimate the city head set.'
							/>
							<Tile
								label='Budget Used'
								value={head.budget.budgetUsedPct == null ? '—' : `${head.budget.budgetUsedPct}%`}
								sub={
									head.budget.hasBudget
										? `${formatINR(head.budget.actualSpend, { compact: true })} of ${formatINR(head.budget.budget, { compact: true })}`
										: 'no budget set'
								}
								tone={budgetTone(head.budget.budgetUsedPct)}
								tip='Actual spend vs the projected budget for the month.'
							/>
							<Tile
								label='EBITDA vs Target'
								value={head.ebitda.ebitdaPct == null ? '—' : `${head.ebitda.ebitdaPct}%`}
								sub={`target ${head.ebitda.targetPct}%${head.ebitda.targetIsDefault ? ' (default)' : ''}${
									head.ebitda.gapPct == null ? '' : ` · ${head.ebitda.gapPct > 0 ? '+' : ''}${head.ebitda.gapPct} pts`
								}`}
								tone={ebitdaTone(head.ebitda.gapPct)}
								tip='EBITDA % this month vs the per-facility target.'
							/>
							<Tile
								label='QC Rejections WoW'
								value={`${head.qc.thisWeekRejected}`}
								sub={`last week ${head.qc.lastWeekRejected}${
									head.qc.deltaPct == null ? '' : ` · ${head.qc.deltaPct > 0 ? '+' : ''}${head.qc.deltaPct}%`
								}`}
								tone={qcTone(head.qc.thisWeekRejected - head.qc.lastWeekRejected)}
								tip='Total QC rejections this week vs last week across the city.'
							/>
							<Tile
								label='On-time Data Entry'
								value={
									head.consistency
										? `${head.consistency.fyToDate.onTime}/${head.consistency.fyToDate.total}`
										: '—'
								}
								sub={
									head.consistency
										? `last 3 mo: ${head.consistency.last3Months.onTime}/${head.consistency.last3Months.total} on time`
										: 'no history'
								}
								tone='neutral'
								tip='How often the monthly budget/estimate was filled on time (by the 2nd Tuesday).'
							/>
						</div>

						{/* Burn-up chart */}
						<div className='mt-6 rounded-lg border border-gray-200 bg-white p-4'>
							<div className='mb-2 text-sm font-medium text-gray-700'>
								Daily revenue — where you stand vs target pace
							</div>
							{chartData.length === 0 ? (
								<div className='py-10 text-center text-sm text-gray-400'>No daily revenue data for this month.</div>
							) : (
								<div className='h-72 w-full'>
									<ResponsiveContainer width='100%' height='100%'>
										<LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 8, left: 8 }}>
											<CartesianGrid strokeDasharray='3 3' stroke='#eef0f4' />
											<XAxis dataKey='day' tick={{ fontSize: 11 }} />
											<YAxis
												tick={{ fontSize: 11 }}
												tickFormatter={(v) => formatINR(v, { compact: true })}
												width={70}
											/>
											<Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ fontSize: 12 }} />
											<Legend wrapperStyle={{ fontSize: 12 }} />
											<Line
												type='monotone'
												dataKey='Actual'
												stroke='#3b82f6'
												strokeWidth={2}
												dot={false}
												activeDot={{ r: 5 }}
											/>
											<Line
												type='monotone'
												dataKey='Target'
												stroke='#94a3b8'
												strokeWidth={2}
												strokeDasharray='5 5'
												dot={false}
												connectNulls
											/>
										</LineChart>
									</ResponsiveContainer>
								</div>
							)}
						</div>

						{/* QC WoW table */}
						<div className='mt-6'>
							<div className='mb-2 text-sm font-medium text-gray-700'>QC rejections by client (this week vs last)</div>
							{head.qc.topClients.length === 0 ? (
								<div className='rounded border border-gray-200 py-8 text-center text-sm text-gray-400'>
									No QC rejection activity this week.
								</div>
							) : (
								<Table
									columns={qcColumns}
									data={head.qc.topClients as unknown as Record<string, unknown>[]}
								/>
							)}
						</div>
					</>
				)}
			</div>

			<Snackbar
				open={snackbar.open}
				message={snackbar.message}
				type={snackbar.type}
				onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
			/>
		</div>
	);
};

export default CityKpiDashboard;
