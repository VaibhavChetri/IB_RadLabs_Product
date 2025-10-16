import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
	TrendingUp,
	TrendingDown,
	Users,
	DollarSign,
	ShoppingCart,
	Eye,
	Download,
	Filter,
	Calendar,
} from 'lucide-react';

export const AnalyticsOverview: React.FC = () => {
	const stats = [
		{
			name: 'Total Revenue',
			value: '$45,231.89',
			change: '+20.1%',
			changeType: 'positive',
			icon: DollarSign,
		},
		{
			name: 'Total Users',
			value: '2,350',
			change: '+180.1%',
			changeType: 'positive',
			icon: Users,
		},
		{
			name: 'Orders',
			value: '12,234',
			change: '+19%',
			changeType: 'positive',
			icon: ShoppingCart,
		},
		{
			name: 'Page Views',
			value: '573,201',
			change: '-2.4%',
			changeType: 'negative',
			icon: Eye,
		},
	];

	const recentActivity = [
		{
			id: 1,
			action: 'New order received',
			user: 'John Doe',
			amount: '$299.00',
			time: '2 minutes ago',
		},
		{
			id: 2,
			action: 'User registered',
			user: 'Jane Smith',
			amount: null,
			time: '5 minutes ago',
		},
		{
			id: 3,
			action: 'Payment processed',
			user: 'Mike Johnson',
			amount: '$1,200.00',
			time: '10 minutes ago',
		},
		{
			id: 4,
			action: 'Product updated',
			user: 'Sarah Wilson',
			amount: null,
			time: '15 minutes ago',
		},
	];

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h1 className='text-h3 text-foreground'>Analytics Overview</h1>
					<p className='mt-2 text-body2 text-foreground-secondary'>
						Monitor your business performance and key metrics
					</p>
				</div>
				<div className='mt-4 sm:mt-0 flex space-x-3'>
					<Button variant='outline' className='flex items-center'>
						<Filter className='w-4 h-4 mr-2' />
						Filter
					</Button>
					<Button variant='outline' className='flex items-center'>
						<Calendar className='w-4 h-4 mr-2' />
						Date Range
					</Button>
					<Button className='flex items-center'>
						<Download className='w-4 h-4 mr-2' />
						Export
					</Button>
				</div>
			</div>

			{/* Stats Grid */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
				{stats.map(stat => (
					<Card key={stat.name} className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-foreground-secondary'>{stat.name}</p>
								<p className='text-2xl font-bold text-foreground mt-1'>{stat.value}</p>
								<div className='flex items-center mt-2'>
									{stat.changeType === 'positive' ? (
										<TrendingUp className='w-4 h-4 text-success mr-1' />
									) : (
										<TrendingDown className='w-4 h-4 text-error mr-1' />
									)}
									<span
										className={`text-sm font-medium ${
											stat.changeType === 'positive' ? 'text-success' : 'text-error'
										}`}
									>
										{stat.change}
									</span>
									<span className='text-sm text-foreground-muted ml-1'>from last month</span>
								</div>
							</div>
							<div className='p-3 bg-primary/10 rounded-lg'>
								<stat.icon className='w-6 h-6 text-primary' />
							</div>
						</div>
					</Card>
				))}
			</div>

			{/* Charts and Activity */}
			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
				{/* Chart Placeholder */}
				<div className='lg:col-span-2'>
					<Card className='p-6'>
						<div className='flex items-center justify-between mb-6'>
							<h3 className='text-h5 text-foreground'>Revenue Trend</h3>
							<div className='flex space-x-2'>
								<Button variant='outline' size='sm'>
									7D
								</Button>
								<Button variant='outline' size='sm'>
									30D
								</Button>
								<Button size='sm'>90D</Button>
							</div>
						</div>
						<div className='h-80 bg-background-secondary rounded-lg flex items-center justify-center'>
							<div className='text-center'>
								<TrendingUp className='w-12 h-12 text-primary mx-auto mb-4' />
								<p className='text-foreground-secondary'>Chart visualization would go here</p>
								<p className='text-sm text-foreground-muted mt-1'>
									Integration with Chart.js or similar library
								</p>
							</div>
						</div>
					</Card>
				</div>

				{/* Recent Activity */}
				<div>
					<Card className='p-6'>
						<h3 className='text-h5 text-foreground mb-6'>Recent Activity</h3>
						<div className='space-y-4'>
							{recentActivity.map(activity => (
								<div
									key={activity.id}
									className='flex items-start space-x-3 p-3 rounded-lg hover:bg-background-secondary transition-colors'
								>
									<div className='w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0' />
									<div className='flex-1 min-w-0'>
										<p className='text-sm font-medium text-foreground'>{activity.action}</p>
										<p className='text-sm text-foreground-secondary'>{activity.user}</p>
										{activity.amount && (
											<p className='text-sm font-semibold text-success'>{activity.amount}</p>
										)}
										<p className='text-xs text-foreground-muted mt-1'>{activity.time}</p>
									</div>
								</div>
							))}
						</div>
						<Button variant='outline' className='w-full mt-4'>
							View All Activity
						</Button>
					</Card>
				</div>
			</div>

			{/* Additional Metrics */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<Card className='p-6'>
					<h3 className='text-h5 text-foreground mb-4'>Top Products</h3>
					<div className='space-y-3'>
						{[
							{ name: 'Premium Widget', sales: 234, revenue: '$12,450' },
							{ name: 'Standard Widget', sales: 189, revenue: '$8,920' },
							{ name: 'Basic Widget', sales: 156, revenue: '$4,680' },
						].map((product, index) => (
							<div
								key={product.name}
								className='flex items-center justify-between p-3 rounded-lg bg-background-secondary'
							>
								<div>
									<p className='font-medium text-foreground'>{product.name}</p>
									<p className='text-sm text-foreground-secondary'>{product.sales} sales</p>
								</div>
								<div className='text-right'>
									<p className='font-semibold text-success'>{product.revenue}</p>
									<p className='text-xs text-foreground-muted'>#{index + 1} bestseller</p>
								</div>
							</div>
						))}
					</div>
				</Card>

				<Card className='p-6'>
					<h3 className='text-h5 text-foreground mb-4'>Conversion Funnel</h3>
					<div className='space-y-4'>
						{[
							{ step: 'Visitors', count: '10,000', percentage: 100 },
							{ step: 'Signups', count: '2,500', percentage: 25 },
							{ step: 'Trials', count: '1,200', percentage: 12 },
							{ step: 'Customers', count: '480', percentage: 4.8 },
						].map((step, _index) => (
							<div key={step.step} className='space-y-2'>
								<div className='flex justify-between text-sm'>
									<span className='text-foreground-secondary'>{step.step}</span>
									<span className='text-foreground'>{step.count}</span>
								</div>
								<div className='w-full bg-background-secondary rounded-full h-2'>
									<div
										className='bg-primary h-2 rounded-full transition-all duration-500'
										style={{ width: `${step.percentage}%` }}
									/>
								</div>
								<div className='text-xs text-foreground-muted'>
									{step.percentage}% conversion rate
								</div>
							</div>
						))}
					</div>
				</Card>
			</div>
		</div>
	);
};
