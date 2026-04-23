/**
 * Unit Tests for useChartData Hook
 * Tests chart data filtering logic
 */
import { renderHook } from '@testing-library/react';
import { useChartData } from '../useChartData';
import { DashboardKAMResponse } from '../../../../services/inventoryApi';

describe('useChartData', () => {
	const mockMonthlyData: DashboardKAMResponse = {
		status_code: 200,
		segResult: {
			byDate: {
				'2025-10-01': { totalCount: 100, day: '01' },
				'2025-10-02': { totalCount: 200, day: '02' },
				'2025-10-03': { totalCount: 150, day: '03' },
			},
		},
	};

	const mockWeeklyData: DashboardKAMResponse = {
		status_code: 200,
		segResult: {
			byWeek: [
				{
					weekNumber: 1,
					days: [
						{ date: '2025-10-01', totalCount: 100 },
						{ date: '2025-10-02', totalCount: 200 },
					],
				},
				{
					weekNumber: 2,
					days: [
						{ date: '2025-10-08', totalCount: 150 },
						{ date: '2025-10-09', totalCount: 250 },
					],
				},
			],
		},
	};

	it('should return empty array when data is null', () => {
		const { result } = renderHook(() => useChartData({ data: null, filter: 'monthly' }));
		expect(result.current).toEqual([]);
	});

	it('should return empty array when segResult is missing', () => {
		const data: DashboardKAMResponse = { status_code: 200 };
		const { result } = renderHook(() => useChartData({ data, filter: 'monthly' }));
		expect(result.current).toEqual([]);
	});

	it('should return monthly chart data for monthly filter', () => {
		const { result } = renderHook(() => useChartData({ data: mockMonthlyData, filter: 'monthly' }));

		expect(result.current).toHaveLength(3);
		expect(result.current[0]).toMatchObject({ day: 1, date: '2025-10-01', count: 100 });
		expect(result.current[1]).toMatchObject({ day: 2, date: '2025-10-02', count: 200 });
		expect(result.current[2]).toMatchObject({ day: 3, date: '2025-10-03', count: 150 });
	});

	it('should return week 1 data for week1 filter', () => {
		const { result } = renderHook(() => useChartData({ data: mockWeeklyData, filter: 'week1' }));

		expect(result.current).toHaveLength(2);
		expect(result.current[0]).toMatchObject({ date: '2025-10-01', count: 100 });
		expect(result.current[1]).toMatchObject({ date: '2025-10-02', count: 200 });
	});

	it('should return week 2 data for week2 filter', () => {
		const { result } = renderHook(() => useChartData({ data: mockWeeklyData, filter: 'week2' }));

		expect(result.current).toHaveLength(2);
		expect(result.current[0]).toMatchObject({ date: '2025-10-08', count: 150 });
		expect(result.current[1]).toMatchObject({ date: '2025-10-09', count: 250 });
	});

	it('should return empty array for non-existent week', () => {
		const { result } = renderHook(() => useChartData({ data: mockWeeklyData, filter: 'week5' }));
		expect(result.current).toEqual([]);
	});

	it('should return empty array when byDate is missing for monthly', () => {
		const data: DashboardKAMResponse = {
			status_code: 200,
			segResult: {},
		};
		const { result } = renderHook(() => useChartData({ data, filter: 'monthly' }));
		expect(result.current).toEqual([]);
	});
});
