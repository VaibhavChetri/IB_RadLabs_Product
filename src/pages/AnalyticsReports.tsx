import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
	Search,
	Filter,
	Download,
	Calendar,
	FileText,
	Eye,
	MoreHorizontal,
	TrendingUp,
	TrendingDown,
} from 'lucide-react';

export const AnalyticsReports: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedPeriod, setSelectedPeriod] = useState('30d');

	const reports = [
		{
			id: 1,
			name: 'Monthly Revenue Report',
			description: 'Comprehensive revenue analysis for the current month',
			type: 'Revenue',
			period: '30 days',
			lastGenerated: '2 hours ago',
			status: 'completed',
			downloads: 45,
			trend: 'up',
		},
		{
			id: 2,
			name: 'User Growth Analysis',
			description: 'Detailed user acquisition and retention metrics',
			type: 'Users',
			period: '90 days',
			lastGenerated: '1 day ago',
			status: 'completed',
			downloads: 23,
			trend: 'up',
		},
		{
			id: 3,
			name: 'Product Performance',
			description: 'Sales performance and inventory analysis',
			type: 'Products',
			period: '7 days',
			lastGenerated: '3 hours ago',
			status: 'generating',
			downloads: 67,
			trend: 'down',
		},
		{
			id: 4,
			name: 'Marketing Campaign ROI',
			description: 'Return on investment for recent marketing campaigns',
			type: 'Marketing',
			period: '14 days',
			lastGenerated: '5 hours ago',
			status: 'completed',
			downloads: 12,
			trend: 'up',
		},
		{
			id: 5,
			name: 'Customer Satisfaction',
			description: 'Survey results and customer feedback analysis',
			type: 'Support',
			period: '60 days',
			lastGenerated: '1 week ago',
			status: 'completed',
			downloads: 34,
			trend: 'up',
		},
		{
			id: 6,
			name: 'Financial Summary',
			description: 'Complete financial overview and profit margins',
			type: 'Finance',
			period: '30 days',
			lastGenerated: '4 hours ago',
			status: 'completed',
			downloads: 89,
			trend: 'up',
		},
	];

	const filteredReports = reports.filter(
		(report) =>
			report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			report.type.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed':
				return 'text-success bg-success/10';
			case 'generating':
				return 'text-warning bg-warning/10';
			case 'failed':
				return 'text-error bg-error/10';
			default:
				return 'text-foreground-muted bg-background-secondary';
		}
	};

	const getTrendIcon = (trend: string) => {
		return trend === 'up' ? (
			<TrendingUp className='w-4 h-4 text-success' />
		) : (
			<TrendingDown className='w-4 h-4 text-error' />
		);
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h1 className='text-h3 text-foreground'>Analytics Reports</h1>
					<p className='mt-2 text-body2 text-foreground-secondary'>
						Generate, manage, and download comprehensive analytics reports
					</p>
				</div>
				<div className='mt-4 sm:mt-0 flex space-x-3'>
					<Button variant='outline' className='flex items-center'>
						<Calendar className='w-4 h-4 mr-2' />
						Schedule Report
					</Button>
					<Button className='flex items-center'>
						<FileText className='w-4 h-4 mr-2' />
						Generate New
					</Button>
				</div>
			</div>

			{/* Filters and Search */}
			<Card className='p-6'>
				<div className='flex flex-col sm:flex-row gap-4'>
					<div className='flex-1'>
						<Input
							placeholder='Search reports...'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className='pl-10'
						/>
						<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted' />
					</div>
					<div className='flex space-x-3'>
						<select
							value={selectedPeriod}
							onChange={(e) => setSelectedPeriod(e.target.value)}
							className='px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent'
						>
							<option value='7d'>Last 7 days</option>
							<option value='30d'>Last 30 days</option>
							<option value='90d'>Last 90 days</option>
							<option value='1y'>Last year</option>
						</select>
						<Button variant='outline' className='flex items-center'>
							<Filter className='w-4 h-4 mr-2' />
							More Filters
						</Button>
					</div>
				</div>
			</Card>

			{/* Reports Grid */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{filteredReports.map((report) => (
					<Card
						key={report.id}
						className='p-6 hover:shadow-lg transition-shadow'
					>
						<div className='flex items-start justify-between mb-4'>
							<div className='flex-1'>
								<h3 className='text-h6 text-foreground mb-2'>{report.name}</h3>
								<p className='text-sm text-foreground-secondary mb-3'>
									{report.description}
								</p>
							</div>
							<button className='p-1 hover:bg-background-secondary rounded'>
								<MoreHorizontal className='w-4 h-4 text-foreground-muted' />
							</button>
						</div>

						<div className='space-y-3'>
							<div className='flex items-center justify-between'>
								<span className='text-xs text-foreground-muted'>Type</span>
								<span className='text-xs font-medium text-foreground'>
									{report.type}
								</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='text-xs text-foreground-muted'>Period</span>
								<span className='text-xs font-medium text-foreground'>
									{report.period}
								</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='text-xs text-foreground-muted'>Status</span>
								<span
									className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(
										report.status,
									)}`}
								>
									{report.status}
								</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='text-xs text-foreground-muted'>Downloads</span>
								<div className='flex items-center space-x-1'>
									{getTrendIcon(report.trend)}
									<span className='text-xs font-medium text-foreground'>
										{report.downloads}
									</span>
								</div>
							</div>
						</div>

						<div className='mt-4 pt-4 border-t border-border'>
							<p className='text-xs text-foreground-muted mb-3'>
								Last generated: {report.lastGenerated}
							</p>
							<div className='flex space-x-2'>
								<Button variant='outline' size='sm' className='flex-1'>
									<Eye className='w-3 h-3 mr-1' />
									View
								</Button>
								<Button size='sm' className='flex-1'>
									<Download className='w-3 h-3 mr-1' />
									Download
								</Button>
							</div>
						</div>
					</Card>
				))}
			</div>

			{/* Quick Stats */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
				<Card className='p-6 text-center'>
					<div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3'>
						<FileText className='w-6 h-6 text-primary' />
					</div>
					<h3 className='text-h4 text-foreground'>24</h3>
					<p className='text-sm text-foreground-secondary'>Total Reports</p>
				</Card>
				<Card className='p-6 text-center'>
					<div className='w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3'>
						<Download className='w-6 h-6 text-success' />
					</div>
					<h3 className='text-h4 text-foreground'>1,247</h3>
					<p className='text-sm text-foreground-secondary'>Downloads</p>
				</Card>
				<Card className='p-6 text-center'>
					<div className='w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center mx-auto mb-3'>
						<Calendar className='w-6 h-6 text-info' />
					</div>
					<h3 className='text-h4 text-foreground'>8</h3>
					<p className='text-sm text-foreground-secondary'>Scheduled</p>
				</Card>
				<Card className='p-6 text-center'>
					<div className='w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-3'>
						<TrendingUp className='w-6 h-6 text-warning' />
					</div>
					<h3 className='text-h4 text-foreground'>+12%</h3>
					<p className='text-sm text-foreground-secondary'>Growth</p>
				</Card>
			</div>
		</div>
	);
};
