/**
 * ReportsDashboard Page - Lead Tracking Reports
 * Shows analytics and performance metrics
 */

import React, { useState, useEffect, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { PageHeader, Snackbar, TableSkeleton, Table } from '@/components/ui';
import { TableColumn } from '@/components/ui/DataDisplay';
import { StatCard } from '@/components/leads/StatCard';
import { LeadApiService, ReportsResponse } from '@/services/leadApi';
import { Users, TrendingUp, Phone, Mail } from 'lucide-react';

// Mock data
const mockReports: ReportsResponse = {
	summary: {
		total_tracked: 47,
		active_leads: 35,
		inactive_leads: 12,
		total_outreach_attempts: 156,
		avg_outreach_per_lead: 3.3,
	},
	status_distribution: [
		{ status_name: 'Interested - Follow Up', status_category: 'positive', status_color: '#34D399', count: 12, percentage: 34.3 },
		{ status_name: 'Call Later', status_category: 'follow_up', status_color: '#60A5FA', count: 8, percentage: 22.9 },
		{ status_name: 'Meeting Scheduled', status_category: 'positive', status_color: '#34D399', count: 6, percentage: 17.1 },
		{ status_name: 'Not Contacted Yet', status_category: 'pending', status_color: '#9CA3AF', count: 5, percentage: 14.3 },
		{ status_name: 'Not Interested', status_category: 'negative', status_color: '#F87171', count: 4, percentage: 11.4 },
	],
	outreach_by_type: {
		email: 45,
		phone: 89,
		both: 15,
		meeting: 7,
	},
	user_performance: [
		{
			user_id: 45,
			user_name: 'Jane Smith',
			contacts_tracked: 15,
			total_outreach: 52,
			positive_responses: 8,
			conversion_rate: 53.3,
		},
		{
			user_id: 46,
			user_name: 'John Admin',
			contacts_tracked: 20,
			total_outreach: 68,
			positive_responses: 10,
			conversion_rate: 50.0,
		},
	],
	callback_metrics: {
		total_scheduled: 23,
		completed: 18,
		pending: 5,
		overdue: 2,
		completion_rate: 78.3,
	},
};

export const ReportsDashboard: React.FC = () => {
	const [loading, setLoading] = useState(false);
	const [reportsData, setReportsData] = useState<ReportsResponse>(mockReports);
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
		open: false,
		message: '',
		type: 'success',
	});

	// Fetch reports data from API
	const fetchReports = async () => {
		setLoading(true);
		try {
			const response = await LeadApiService.getReports();
			
			if (response.status_code === 200 && response.data) {
				setReportsData(response.data);
			} else {
				throw new Error(response.message || 'Failed to load reports');
			}
		} catch (error: any) {
			console.error('Failed to load reports:', error);
			setSnackbar({
				open: true,
				message: error.response?.data?.message || error.message || 'Failed to load reports',
				type: 'error',
			});
			// Fallback to empty data on error
			setReportsData(mockReports);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchReports();
	}, []);

	// Status Distribution Chart (Donut)
	const statusChartOptions = useMemo(() => {
		return {
			chart: {
				type: 'donut' as const,
				toolbar: { show: false },
			},
			labels: reportsData.status_distribution.map(s => s.status_name),
			colors: reportsData.status_distribution.map(s => s.status_color),
			legend: {
				position: 'bottom' as const,
			},
			dataLabels: {
				enabled: true,
				formatter: (val: number) => `${val.toFixed(1)}%`,
			},
			plotOptions: {
				pie: {
					donut: {
						size: '65%',
					},
				},
			},
		};
	}, [reportsData.status_distribution]);

	const statusChartSeries = useMemo(() => {
		return reportsData.status_distribution.map(s => s.count);
	}, [reportsData.status_distribution]);

	// Outreach by Type Chart (Bar)
	const outreachChartOptions = useMemo(() => {
		return {
			chart: {
				type: 'bar' as const,
				toolbar: { show: false },
			},
			xaxis: {
				categories: ['Email', 'Phone', 'Both', 'Meeting'],
			},
			colors: ['#3B82F6'],
			dataLabels: {
				enabled: true,
			},
			plotOptions: {
				bar: {
					borderRadius: 4,
				},
			},
		};
	}, []);

	const outreachChartSeries = useMemo(() => {
		return [
			{
				name: 'Outreach Attempts',
				data: [
					reportsData.outreach_by_type.email,
					reportsData.outreach_by_type.phone,
					reportsData.outreach_by_type.both,
					reportsData.outreach_by_type.meeting,
				],
			},
		];
	}, [reportsData.outreach_by_type]);

	// User Performance Table Columns
	const userPerformanceColumns: TableColumn<Record<string, unknown>>[] = [
		{
			key: 'user_name',
			title: 'User',
			sortable: true,
			align: 'left',
			render: (value: unknown) => (
				<div className='font-semibold text-gray-900'>{String(value || '')}</div>
			),
		},
		{
			key: 'contacts_tracked',
			title: 'Contacts Tracked',
			sortable: true,
			align: 'center',
			render: (value: unknown) => (
				<div className='text-gray-700'>{String(value || 0)}</div>
			),
		},
		{
			key: 'total_outreach',
			title: 'Total Outreach',
			sortable: true,
			align: 'center',
			render: (value: unknown) => (
				<div className='text-gray-700'>{String(value || 0)}</div>
			),
		},
		{
			key: 'positive_responses',
			title: 'Positive Responses',
			sortable: true,
			align: 'center',
			render: (value: unknown) => (
				<div className='text-green-600 font-medium'>{String(value || 0)}</div>
			),
		},
		{
			key: 'conversion_rate',
			title: 'Conversion Rate',
			sortable: true,
			align: 'center',
			render: (value: unknown) => (
				<div className='text-gray-700 font-medium'>
					{typeof value === 'number' ? `${value.toFixed(1)}%` : '0%'}
				</div>
			),
		},
	];

	return (
		<div className='min-h-screen bg-gray-50 p-6'>
			<div className='max-w-7xl mx-auto space-y-6'>
				{/* Header */}
				<PageHeader
					title='Lead Tracking Reports'
					totalItems={reportsData.summary.total_tracked}
					itemType='tracked leads'
					icon='📊'
				/>

				{/* Summary Cards */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
					<StatCard
						title='Total Tracked'
						value={reportsData.summary.total_tracked}
						icon={Users}
						color='#3B82F6'
					/>
					<StatCard
						title='Active Leads'
						value={reportsData.summary.active_leads}
						icon={TrendingUp}
						color='#10B981'
					/>
					<StatCard
						title='Total Outreach'
						value={reportsData.summary.total_outreach_attempts}
						icon={Phone}
						color='#F59E0B'
					/>
					<StatCard
						title='Avg per Lead'
						value={reportsData.summary.avg_outreach_per_lead.toFixed(1)}
						icon={Mail}
						color='#8B5CF6'
					/>
				</div>

				{/* Charts Row */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					{/* Status Distribution Chart */}
					<div className='bg-white rounded-lg shadow-sm p-6'>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>Lead Status Distribution</h3>
						{loading ? (
							<div className='h-64 flex items-center justify-center'>
								<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
							</div>
						) : (
							<Chart
								options={statusChartOptions}
								series={statusChartSeries}
								type='donut'
								height={300}
							/>
						)}
					</div>

					{/* Outreach by Type Chart */}
					<div className='bg-white rounded-lg shadow-sm p-6'>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>Outreach by Type</h3>
						{loading ? (
							<div className='h-64 flex items-center justify-center'>
								<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
							</div>
						) : (
							<Chart
								options={outreachChartOptions}
								series={outreachChartSeries}
								type='bar'
								height={300}
							/>
						)}
					</div>
				</div>

				{/* User Performance Table */}
				<div className='bg-white rounded-lg shadow-sm p-6'>
					<h3 className='text-lg font-semibold text-gray-900 mb-4'>User Performance</h3>
					{loading ? (
						<TableSkeleton rows={5} columns={5} />
					) : (
						<Table
							columns={userPerformanceColumns}
							data={reportsData.user_performance as unknown as Record<string, unknown>[]}
							loading={loading}
							emptyText='No user performance data available.'
						/>
					)}
				</div>

				{/* Callback Metrics */}
				<div className='bg-white rounded-lg shadow-sm p-6'>
					<h3 className='text-lg font-semibold text-gray-900 mb-4'>Callback Metrics</h3>
					<div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
						<div className='text-center'>
							<div className='text-2xl font-bold text-gray-900'>
								{reportsData.callback_metrics.total_scheduled}
							</div>
							<div className='text-sm text-gray-600'>Total Scheduled</div>
						</div>
						<div className='text-center'>
							<div className='text-2xl font-bold text-green-600'>
								{reportsData.callback_metrics.completed}
							</div>
							<div className='text-sm text-gray-600'>Completed</div>
						</div>
						<div className='text-center'>
							<div className='text-2xl font-bold text-yellow-600'>
								{reportsData.callback_metrics.pending}
							</div>
							<div className='text-sm text-gray-600'>Pending</div>
						</div>
						<div className='text-center'>
							<div className='text-2xl font-bold text-red-600'>
								{reportsData.callback_metrics.overdue}
							</div>
							<div className='text-sm text-gray-600'>Overdue</div>
						</div>
						<div className='text-center'>
							<div className='text-2xl font-bold text-blue-600'>
								{reportsData.callback_metrics.completion_rate.toFixed(1)}%
							</div>
							<div className='text-sm text-gray-600'>Completion Rate</div>
						</div>
					</div>
				</div>

				<Snackbar
					message={snackbar.message}
					type={snackbar.type}
					open={snackbar.open}
					onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
				/>
			</div>
		</div>
	);
};
