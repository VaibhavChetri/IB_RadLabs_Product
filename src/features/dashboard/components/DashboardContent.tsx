import React, { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { DashboardStats } from './DashboardStats';
import { DashboardChart } from './DashboardChart';
import { DashboardStats as DashboardStatsType, DashboardResponse } from '../hooks/useDashboardData';
import {
	exportDashboardToExcel,
	exportDashboardYearlyToExcel,
} from '../utils/exportDashboardToExcel';
import { getMonthDateRange } from '../utils/dateUtils';
import { InventoryApiService } from '../../../services/inventoryApi';

interface DashboardContentProps {
	stats: DashboardStatsType | null;
	chartData: DashboardResponse | null;
	loading: boolean;
	error: string | null;
	/** Year and month for Excel export filename and sheet title */
	exportYear?: string;
	exportMonth?: string;
	/** For yearly export: location and client (from current filters) */
	exportLocationId?: string | null;
	exportClientId?: string;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
	stats,
	chartData,
	loading,
	error,
	exportYear = '',
	exportMonth = '',
	exportLocationId = null,
	exportClientId = 'all',
}) => {
	const [yearlyExportLoading, setYearlyExportLoading] = useState(false);

	const handleDownloadExcel = () => {
		if (exportYear && exportMonth) {
			exportDashboardToExcel(stats, chartData, exportYear, exportMonth);
		}
	};

	const handleDownloadYearlyExcel = async () => {
		if (!exportYear || !exportLocationId) return;
		setYearlyExportLoading(true);
		try {
			const yearNum = parseInt(exportYear, 10);
			const clientId = exportClientId === 'all' ? 'All' : exportClientId;
			const locationId = parseInt(exportLocationId, 10);
			const results: (Awaited<ReturnType<typeof InventoryApiService.getSentCountKAM>> | null)[] =
				[];
			for (let month = 1; month <= 12; month++) {
				const range = getMonthDateRange(month, yearNum);
				try {
					const res = await InventoryApiService.getSentCountKAM({
						location_id: locationId,
						client_id: clientId,
						start_date: range.start_date,
						end_date: range.end_date,
					});
					results.push(res);
				} catch {
					results.push(null);
				}
			}
			exportDashboardYearlyToExcel(results, exportYear);
		} finally {
			setYearlyExportLoading(false);
		}
	};

	if (error) {
		return (
			<div className='space-y-6'>
				<div className='bg-red-50 border border-red-200 rounded-lg p-4'>
					<p className='text-red-800'>{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Download Excel – monthly and yearly */}
			{(exportYear && exportMonth) || exportYear ? (
				<div className='flex flex-wrap justify-end gap-2'>
					{exportYear && exportMonth && (
						<Button
							variant='outline'
							onClick={handleDownloadExcel}
							disabled={loading || !stats}
							className='inline-flex items-center gap-2'
						>
							<Download className='w-4 h-4' />
							Download Excel (Month)
						</Button>
					)}
					{exportYear && exportLocationId && (
						<Button
							variant='outline'
							onClick={handleDownloadYearlyExcel}
							disabled={loading || yearlyExportLoading}
							loading={yearlyExportLoading}
							className='inline-flex items-center gap-2'
						>
							<Calendar className='w-4 h-4' />
							{yearlyExportLoading ? 'Preparing…' : 'Download Excel (Year)'}
						</Button>
					)}
				</div>
			) : null}

			{/* Stats Cards */}
			{stats && <DashboardStats stats={stats} loading={loading} />}

			{/* Chart */}
			<DashboardChart data={chartData} loading={loading} />
		</div>
	);
};
