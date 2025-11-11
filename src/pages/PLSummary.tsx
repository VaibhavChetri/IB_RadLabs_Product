import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { PageHeader } from '../components/ui';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PLFilters, usePLFilters } from '../features/p-and-l';

/**
 * P&L Summary Page
 * Displays profit and loss summary data
 */
export const PLSummary: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const {
		selectedMonth,
		selectedYear,
		selectedFacility,
		monthOptions,
		yearOptions,
		setSelectedMonth,
		setSelectedYear,
		setSelectedFacility,
	} = usePLFilters();

	return (
		<ErrorBoundary>
			<div className='space-y-6'>
				<PageHeader
					title='P&L Summary'
					locationName={user?.city_name || 'City'}
					totalItems={0}
					itemType='summary'
					icon='💰'
				/>

				<PLFilters
					selectedMonth={selectedMonth}
					selectedYear={selectedYear}
					selectedFacility={selectedFacility}
					monthOptions={monthOptions}
					yearOptions={yearOptions}
					onMonthChange={setSelectedMonth}
					onYearChange={setSelectedYear}
					onFacilityChange={setSelectedFacility}
				/>

				<div className='bg-white rounded-lg shadow-sm p-6'>
					<p className='text-gray-600'>P&L Summary content will be implemented here.</p>
					<p className='text-sm text-gray-500 mt-2'>
						Selected: Month {selectedMonth}, Year {selectedYear}, Facility {selectedFacility}
					</p>
				</div>
			</div>
		</ErrorBoundary>
	);
};

export default PLSummary;
