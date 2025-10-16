import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
	Search,
	Filter,
	Calendar,
	TrendingUp,
	TrendingDown,
	BarChart3,
	PieChart,
	LineChart,
	Activity,
	ArrowUpRight,
	ArrowDownRight,
} from 'lucide-react';

export const AnalyticsTrends: React.FC = () => {
	const [selectedMetric, setSelectedMetric] = useState('revenue');
	const [timeRange, setTimeRange] = useState('30d');

	const metrics = [
		{
			id: 'revenue',
			name: 'Revenue',
			value: '$45,231',
			change: '+12.5%',
			changeType: 'positive',
			icon: TrendingUp,
		},
		{
			id: 'users',
			name: 'Active Users',
			value: '2,350',
			change: '+8.2%',
			changeType: 'positive',
			icon: TrendingUp,
		},
		{
			id: 'conversion',
			name: 'Conversion Rate',
			value: '3.2%',
			change: '-2.1%',
			changeType: 'negative',
			icon: TrendingDown,
		},
		{
			id: 'retention',
			name: 'Retention Rate',
			value: '78%',
			change: '+5.3%',
			changeType: 'positive',
			icon: TrendingUp,
		},
	];

	const trendData = [
		{
			period: 'Jan',
			revenue: 32000,
			users: 1800,
			conversion: 2.8,
			retention: 72,
		},
		{
			period: 'Feb',
			revenue: 35000,
			users: 1950,
			conversion: 3.1,
			retention: 75,
		},
		{
			period: 'Mar',
			revenue: 38000,
			users: 2100,
			conversion: 3.0,
			retention: 76,
		},
		{
			period: 'Apr',
			revenue: 42000,
			users: 2250,
			conversion: 3.2,
			retention: 78,
		},
		{
			period: 'May',
			revenue: 45231,
			users: 2350,
			conversion: 3.2,
			retention: 78,
		},
	];

	const insights = [
		{
			type: 'positive',
			title: 'Revenue Growth Accelerating',
			description:
				'Monthly revenue has increased by 12.5% compared to last month, driven by increased user acquisition.',
			impact: 'High',
			icon: ArrowUpRight,
		},
		{
			type: 'positive',
			title: 'User Retention Improving',
			description:
				'User retention rate has improved by 5.3% this month, indicating better product-market fit.',
			impact: 'Medium',
			icon: ArrowUpRight,
		},
		{
			type: 'negative',
			title: 'Conversion Rate Declining',
			description:
				'Conversion rate has decreased by 2.1% this month. Consider reviewing the onboarding flow.',
			impact: 'High',
			icon: ArrowDownRight,
		},
		{
			type: 'positive',
			title: 'Mobile Usage Increasing',
			description:
				'Mobile app usage has increased by 15% this month, showing strong mobile adoption.',
			impact: 'Low',
			icon: ArrowUpRight,
		},
	];

	const getInsightColor = (type: string) => {
		switch (type) {
			case 'positive':
				return 'text-success bg-success/10 border-success/20';
			case 'negative':
				return 'text-error bg-error/10 border-error/20';
			default:
				return 'text-info bg-info/10 border-info/20';
		}
	};

	const getImpactColor = (impact: string) => {
		switch (impact) {
			case 'High':
				return 'text-error';
			case 'Medium':
				return 'text-warning';
			case 'Low':
				return 'text-success';
			default:
				return 'text-foreground-muted';
		}
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h1 className='text-h3 text-foreground'>Analytics Trends</h1>
					<p className='mt-2 text-body2 text-foreground-secondary'>
						Track performance trends and identify growth opportunities
					</p>
				</div>
				<div className='mt-4 sm:mt-0 flex space-x-3'>
					<Button variant='outline' className='flex items-center'>
						<Calendar className='w-4 h-4 mr-2' />
						Date Range
					</Button>
					<Button variant='outline' className='flex items-center'>
						<Filter className='w-4 h-4 mr-2' />
						Filters
					</Button>
					<Button className='flex items-center'>
						<Activity className='w-4 h-4 mr-2' />
						Export Data
					</Button>
				</div>
			</div>

			{/* Metric Selector */}
			<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
				{metrics.map((metric) => (
					<Card
						key={metric.id}
						className={`p-4 cursor-pointer transition-all ${
							selectedMetric === metric.id
								? 'ring-2 ring-primary bg-primary/5'
								: 'hover:bg-background-secondary'
						}`}
						onClick={() => setSelectedMetric(metric.id)}
					>
						<div className='flex items-center justify-between mb-2'>
							<metric.icon
								className={`w-5 h-5 ${
									metric.changeType === 'positive'
										? 'text-success'
										: 'text-error'
								}`}
							/>
							<span
								className={`text-sm font-medium ${
									metric.changeType === 'positive'
										? 'text-success'
										: 'text-error'
								}`}
							>
								{metric.change}
							</span>
						</div>
						<h3 className='text-h5 text-foreground'>{metric.value}</h3>
						<p className='text-sm text-foreground-secondary'>{metric.name}</p>
					</Card>
				))}
			</div>

			{/* Chart Section */}
			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
				{/* Main Trend Chart */}
				<div className='lg:col-span-2'>
					<Card className='p-6'>
						<div className='flex items-center justify-between mb-6'>
							<h3 className='text-h5 text-foreground'>
								{metrics.find((m) => m.id === selectedMetric)?.name} Trend
							</h3>
							<div className='flex space-x-2'>
								<Button
									variant={timeRange === '7d' ? 'default' : 'outline'}
									size='sm'
									onClick={() => setTimeRange('7d')}
								>
									7D
								</Button>
								<Button
									variant={timeRange === '30d' ? 'default' : 'outline'}
									size='sm'
									onClick={() => setTimeRange('30d')}
								>
									30D
								</Button>
								<Button
									variant={timeRange === '90d' ? 'default' : 'outline'}
									size='sm'
									onClick={() => setTimeRange('90d')}
								>
									90D
								</Button>
							</div>
						</div>
						<div className='h-80 bg-background-secondary rounded-lg flex items-center justify-center'>
							<div className='text-center'>
								<LineChart className='w-12 h-12 text-primary mx-auto mb-4' />
								<p className='text-foreground-secondary'>
									Interactive chart would be here
								</p>
								<p className='text-sm text-foreground-muted mt-1'>
									Integration with Chart.js or D3.js
								</p>
							</div>
						</div>
					</Card>
				</div>

				{/* Chart Types */}
				<div>
					<Card className='p-6'>
						<h3 className='text-h5 text-foreground mb-4'>Chart Types</h3>
						<div className='space-y-3'>
							<button className='w-full flex items-center p-3 rounded-lg hover:bg-background-secondary transition-colors'>
								<LineChart className='w-5 h-5 text-primary mr-3' />
								<span className='text-sm font-medium text-foreground'>
									Line Chart
								</span>
							</button>
							<button className='w-full flex items-center p-3 rounded-lg hover:bg-background-secondary transition-colors'>
								<BarChart3 className='w-5 h-5 text-primary mr-3' />
								<span className='text-sm font-medium text-foreground'>
									Bar Chart
								</span>
							</button>
							<button className='w-full flex items-center p-3 rounded-lg hover:bg-background-secondary transition-colors'>
								<PieChart className='w-5 h-5 text-primary mr-3' />
								<span className='text-sm font-medium text-foreground'>
									Pie Chart
								</span>
							</button>
						</div>
					</Card>
				</div>
			</div>

			{/* Insights */}
			<Card className='p-6'>
				<h3 className='text-h5 text-foreground mb-6'>Key Insights</h3>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					{insights.map((insight, index) => (
						<div
							key={index}
							className={`p-4 rounded-lg border ${getInsightColor(
								insight.type,
							)}`}
						>
							<div className='flex items-start space-x-3'>
								<div className='p-2 bg-background rounded-lg'>
									<insight.icon className='w-5 h-5' />
								</div>
								<div className='flex-1'>
									<h4 className='font-medium text-foreground mb-1'>
										{insight.title}
									</h4>
									<p className='text-sm text-foreground-secondary mb-2'>
										{insight.description}
									</p>
									<div className='flex items-center justify-between'>
										<span className='text-xs text-foreground-muted'>
											Impact Level
										</span>
										<span
											className={`text-xs font-medium ${getImpactColor(
												insight.impact,
											)}`}
										>
											{insight.impact}
										</span>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</Card>

			{/* Trend Data Table */}
			<Card className='p-6'>
				<h3 className='text-h5 text-foreground mb-6'>Historical Data</h3>
				<div className='overflow-x-auto'>
					<table className='w-full'>
						<thead>
							<tr className='border-b border-border'>
								<th className='text-left py-3 px-4 text-sm font-medium text-foreground-secondary'>
									Period
								</th>
								<th className='text-right py-3 px-4 text-sm font-medium text-foreground-secondary'>
									Revenue
								</th>
								<th className='text-right py-3 px-4 text-sm font-medium text-foreground-secondary'>
									Users
								</th>
								<th className='text-right py-3 px-4 text-sm font-medium text-foreground-secondary'>
									Conversion
								</th>
								<th className='text-right py-3 px-4 text-sm font-medium text-foreground-secondary'>
									Retention
								</th>
							</tr>
						</thead>
						<tbody>
							{trendData.map((data, index) => (
								<tr
									key={data.period}
									className='border-b border-border hover:bg-background-secondary'
								>
									<td className='py-3 px-4 text-sm font-medium text-foreground'>
										{data.period}
									</td>
									<td className='py-3 px-4 text-sm text-foreground text-right'>
										${data.revenue.toLocaleString()}
									</td>
									<td className='py-3 px-4 text-sm text-foreground text-right'>
										{data.users.toLocaleString()}
									</td>
									<td className='py-3 px-4 text-sm text-foreground text-right'>
										{data.conversion}%
									</td>
									<td className='py-3 px-4 text-sm text-foreground text-right'>
										{data.retention}%
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Card>
		</div>
	);
};
