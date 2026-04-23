import React from 'react';
import { Package, TrendingUp, Droplet, Leaf, Factory } from 'lucide-react';
import { DashboardStats as DashboardStatsType } from '../hooks/useDashboardData';

interface DashboardStatsProps {
	stats: DashboardStatsType;
	loading?: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, loading = false }) => {
	const statCards = [
		{
			title: 'Total Container Units',
			value: stats.totalClientSKUCount.toLocaleString(),
			suffix: '',
			icon: Package,
			accent: 'blue',
		},
		{
			title: 'Average Container Units',
			value: stats.totalClientAvgSKUCount.toLocaleString('en-US', {
				maximumFractionDigits: 2,
			}),
			suffix: '',
			icon: TrendingUp,
			accent: 'emerald',
		},
		{
			title: 'Plastic Saved',
			value: stats.totalPlasticSavedKg.toLocaleString('en-US', { maximumFractionDigits: 2 }),
			suffix: 'kg',
			icon: Leaf,
			accent: 'amber',
		},
		{
			title: 'Water Saved',
			value: stats.water.toLocaleString('en-US', { maximumFractionDigits: 2 }),
			suffix: 'L',
			icon: Droplet,
			accent: 'cyan',
		},
		{
			title: 'GHG Emissions Reduced',
			value: stats.ghc.toLocaleString('en-US', { maximumFractionDigits: 2 }),
			suffix: 'kg CO₂e',
			icon: Factory,
			accent: 'purple',
		},
	];

	const getAccentClasses = (accent: string) => {
		const classes: Record<string, { bg: string; text: string }> = {
			blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
			emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
			amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
			cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
			purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
		};
		return classes[accent] || classes.blue;
	};

	if (loading) {
		return (
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
				{Array.from({ length: 5 }).map((_, index) => (
					<div key={index} className='rounded-xl bg-white border border-gray-100 p-6'>
						<div className='animate-pulse space-y-4'>
							<div className='h-10 w-10 rounded-full bg-gray-200'></div>
							<div className='space-y-2'>
								<div className='h-2.5 bg-gray-200 rounded w-20'></div>
								<div className='h-6 bg-gray-200 rounded w-24'></div>
							</div>
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div
			className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'
			role='region'
			aria-label='Dashboard statistics'
		>
			{statCards.map((stat, index) => {
				const Icon = stat.icon;
				const accent = getAccentClasses(stat.accent);
				return (
					<div
						key={index}
						className='relative rounded-xl bg-white border border-gray-100 p-6 hover:border-gray-200 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2'
						role='article'
						aria-label={`${stat.title}: ${stat.value} ${stat.suffix}`}
						tabIndex={0}
					>
						<div className='flex flex-col h-full'>
							{/* Icon Circle */}
							<div className='mb-4'>
								<div
									className={`w-10 h-10 rounded-full ${accent.bg} ${accent.text} flex items-center justify-center`}
								>
									<Icon className='w-5 h-5' strokeWidth={2} />
								</div>
							</div>

							{/* Label - Multi-line if needed */}
							<div className='mb-3 flex-1'>
								<p className='text-[10px] font-medium text-gray-500 uppercase tracking-wide leading-tight'>
									{stat.title.split(' ').map((word, i, arr) => (
										<React.Fragment key={i}>
											{word}
											{i < arr.length - 1 && i % 2 === 1 && <br />}
										</React.Fragment>
									))}
								</p>
							</div>

							{/* Value */}
							<div className='flex items-baseline gap-1.5'>
								<span className='text-xl font-semibold text-gray-900'>{stat.value}</span>
								{stat.suffix && (
									<span className='text-xs font-normal text-gray-500'>{stat.suffix}</span>
								)}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};
