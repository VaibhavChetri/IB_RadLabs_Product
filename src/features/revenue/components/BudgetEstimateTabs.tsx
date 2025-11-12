import React, { useState } from 'react';
import { ReviewCostingType } from '../../../services/pAndLApi';

interface BudgetEstimateTabsProps {
	costingTypes: ReviewCostingType[];
	budgets: Record<number, string>;
	estimates: Record<number, string>;
	onBudgetChange: (costingTypeId: number, value: string) => void;
	onEstimateChange?: (costingTypeId: number, value: string) => void;
	isLoading?: boolean;
}

/**
 * Format number as Indian Rupee currency
 */
const formatCurrency = (value: string | number | null | undefined): string => {
	if (value === null || value === undefined || value === '') return '₹0.00';
	const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
	if (isNaN(num)) return '₹0.00';
	return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const BudgetEstimateTabs: React.FC<BudgetEstimateTabsProps> = ({
	costingTypes,
	budgets,
	estimates,
	onBudgetChange,
	onEstimateChange,
	isLoading = false,
}) => {
	const [activeTab, setActiveTab] = useState<'budget' | 'estimate'>('budget');

	if (isLoading) {
		return (
			<div className='bg-white rounded-lg border border-gray-200 p-6'>
				<div className='text-center text-gray-500'>Loading costing types...</div>
			</div>
		);
	}

	if (costingTypes.length === 0) {
		return (
			<div className='bg-white rounded-lg border border-gray-200 p-6'>
				<div className='text-center text-gray-500'>No costing types available</div>
			</div>
		);
	}

	return (
		<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
			{/* Tab Headers */}
			<div className='flex border-b border-gray-200'>
				<button
					onClick={() => setActiveTab('budget')}
					className={`
						flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200
						${
							activeTab === 'budget'
								? 'bg-green-500 text-white border-b-2 border-green-600'
								: 'bg-gray-50 text-gray-600 hover:bg-gray-100'
						}
					`}
				>
					Budget
				</button>
				<button
					onClick={() => setActiveTab('estimate')}
					className={`
						flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200
						${
							activeTab === 'estimate'
								? 'bg-green-500 text-white border-b-2 border-green-600'
								: 'bg-gray-50 text-gray-600 hover:bg-gray-100'
						}
					`}
				>
					Estimate
				</button>
			</div>

			{/* Tab Content */}
			<div className='divide-y divide-gray-200'>
				{costingTypes.map((costingType, index) => (
					<div
						key={costingType.id}
						className={`px-6 py-4 flex items-center justify-between ${
							index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
						}`}
					>
						<div className='flex-1'>
							<span className='text-sm font-medium text-gray-900'>
								{costingType.name}
							</span>
						</div>
						<div className='w-48 flex justify-end'>
							{activeTab === 'budget' ? (
								<input
									type='number'
									value={budgets[costingType.id] || ''}
									onChange={e => onBudgetChange(costingType.id, e.target.value)}
									placeholder='Enter budget'
									className='w-32 px-3 py-2 border border-gray-300 rounded-md text-sm text-right focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200'
								/>
							) : (
								<div className='text-sm font-medium text-gray-900 text-right'>
									{formatCurrency(estimates[costingType.id] || budgets[costingType.id])}
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

