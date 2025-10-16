import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchStatsStart } from '../store/slices/dashboardSlice';
import { Card } from '../components/ui/Card';
import { Users, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const { stats } = useSelector((state: RootState) => state.dashboard);

	React.useEffect(() => {
		dispatch(fetchStatsStart());
		// Simulate API call
		setTimeout(() => {
			dispatch({
				type: 'dashboard/fetchStatsSuccess',
				payload: {
					totalUsers: 1240,
					totalRevenue: 45600,
					totalOrders: 89,
					conversionRate: 3.2,
				},
			});
		}, 1000);
	}, [dispatch]);

	const statCards = [
		{
			title: 'Total Users',
			value: stats.totalUsers.toLocaleString(),
			icon: Users,
			change: '+12%',
			changeType: 'positive' as const,
		},
		{
			title: 'Total Revenue',
			value: `$${stats.totalRevenue.toLocaleString()}`,
			icon: DollarSign,
			change: '+8%',
			changeType: 'positive' as const,
		},
		{
			title: 'Total Orders',
			value: stats.totalOrders.toLocaleString(),
			icon: ShoppingCart,
			change: '+23%',
			changeType: 'positive' as const,
		},
		{
			title: 'Conversion Rate',
			value: `${stats.conversionRate}%`,
			icon: TrendingUp,
			change: '+2.1%',
			changeType: 'positive' as const,
		},
	];

	return (
		<div className='space-y-6'>
			<div>
				<h1 className='text-h4 text-foreground'>Dashboard</h1>
				<p className='text-body2 text-foreground-secondary mt-1'>
					Welcome back! Here&apos;s what&apos;s happening with your business today.
				</p>
			</div>

			{/* Stats Grid */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
				{statCards.map((stat, index) => (
					<Card key={index} className='p-4 sm:p-6'>
						<div className='flex items-center justify-between'>
							<div className='flex-1 min-w-0'>
								<p className='text-sm font-medium text-foreground-muted'>{stat.title}</p>
								<p className='text-h4 text-foreground mt-1'>{stat.value}</p>
								<p
									className={`text-sm mt-1 ${
										stat.changeType === 'positive' ? 'text-success' : 'text-error'
									}`}
								>
									{stat.change} from last month
								</p>
							</div>
							<div className='p-3 bg-primary/10 rounded-lg flex-shrink-0'>
								<stat.icon className='w-6 h-6 text-primary' />
							</div>
						</div>
					</Card>
				))}
			</div>

			{/* Charts Section */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
				<Card className='p-4 sm:p-6'>
					<h3 className='text-h6 text-foreground mb-4'>Revenue Overview</h3>
					<div className='h-48 sm:h-64 bg-background-secondary rounded-lg flex items-center justify-center'>
						<p className='text-foreground-muted'>Chart placeholder</p>
					</div>
				</Card>

				<Card className='p-4 sm:p-6'>
					<h3 className='text-h6 text-foreground mb-4'>User Activity</h3>
					<div className='h-48 sm:h-64 bg-background-secondary rounded-lg flex items-center justify-center'>
						<p className='text-foreground-muted'>Chart placeholder</p>
					</div>
				</Card>
			</div>

			{/* Recent Activity */}
			<Card className='p-4 sm:p-6'>
				<h3 className='text-h6 text-foreground mb-4'>Recent Activity</h3>
				<div className='space-y-3 sm:space-y-4'>
					{[
						{
							action: 'New user registered',
							time: '2 minutes ago',
							type: 'user',
						},
						{
							action: 'Order #1234 completed',
							time: '5 minutes ago',
							type: 'order',
						},
						{
							action: 'Payment received',
							time: '10 minutes ago',
							type: 'payment',
						},
						{
							action: 'New product added',
							time: '1 hour ago',
							type: 'product',
						},
					].map((activity, index) => (
						<div
							key={index}
							className='flex items-center space-x-3 p-3 bg-background-secondary rounded-lg'
						>
							<div className='w-2 h-2 bg-primary rounded-full flex-shrink-0'></div>
							<div className='flex-1 min-w-0'>
								<p className='text-sm text-foreground'>{activity.action}</p>
								<p className='text-xs text-foreground-muted'>{activity.time}</p>
							</div>
						</div>
					))}
				</div>
			</Card>
		</div>
	);
};
