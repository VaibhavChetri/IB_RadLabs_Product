import React from 'react';
import { DashboardStats } from './DashboardStats';
import { DashboardChart } from './DashboardChart';
import { DashboardStats as DashboardStatsType, DashboardResponse } from '../hooks/useDashboardData';

interface DashboardContentProps {
	stats: DashboardStatsType | null;
	chartData: DashboardResponse | null;
	loading: boolean;
	error: string | null;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
	stats,
	chartData,
	loading,
	error,
}) => {
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
			{/* Stats Cards */}
			{stats && <DashboardStats stats={stats} loading={loading} />}

			{/* Chart */}
			<DashboardChart data={chartData} loading={loading} />
		</div>
	);
};
