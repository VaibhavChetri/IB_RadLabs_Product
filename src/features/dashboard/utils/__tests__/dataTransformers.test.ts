/**
 * Unit Tests for Data Transformers
 * Tests data transformation utilities used in Dashboard
 */
import {
	transformToStats,
	transformToMonthlyChartData,
	calculateYAxisTicks,
} from '../dataTransformers';
import { DashboardKAMResponse } from '../../../../services/inventoryApi';
import { ChartDataPoint } from '../../hooks/useDashboardData';

describe('dataTransformers', () => {
	describe('transformToStats', () => {
		it('should return null when data is null', () => {
			const result = transformToStats(null);
			expect(result).toBeNull();
		});

		it('should extract stats from valid dashboard response', () => {
			const mockData: DashboardKAMResponse = {
				status_code: 200,
				summaryCount: {
					totalSummary: {
						totalClientSKUCount: 1000,
						totalClientAvgSKUCount: 500,
					},
				},
				total: {
					totalPlasticSavedKg: 100,
					water: 200,
					ghc: 50,
				},
			};

			const result = transformToStats(mockData);

			expect(result).toEqual({
				totalClientSKUCount: 1000,
				totalClientAvgSKUCount: 500,
				totalPlasticSavedKg: 100,
				water: 200,
				ghc: 50,
			});
		});

		it('should return zeros when optional fields are missing', () => {
			const mockData: DashboardKAMResponse = {
				status_code: 200,
			};

			const result = transformToStats(mockData);

			expect(result).toEqual({
				totalClientSKUCount: 0,
				totalClientAvgSKUCount: 0,
				totalPlasticSavedKg: 0,
				water: 0,
				ghc: 0,
			});
		});
	});

	describe('transformToMonthlyChartData', () => {
		it('should return empty array when data is null', () => {
			const result = transformToMonthlyChartData(null);
			expect(result).toEqual([]);
		});

		it('should return empty array when byDate is missing', () => {
			const mockData: DashboardKAMResponse = {
				status_code: 200,
			};
			const result = transformToMonthlyChartData(mockData);
			expect(result).toEqual([]);
		});

		it('should transform byDate object to sorted chart data points', () => {
			const mockData: DashboardKAMResponse = {
				status_code: 200,
				segResult: {
					byDate: {
						'2025-10-15': { totalCount: 100, day: '15' },
						'2025-10-01': { totalCount: 50, day: '01' },
						'2025-10-30': { totalCount: 200, day: '30' },
					},
				},
			};

			const result = transformToMonthlyChartData(mockData);

			expect(result).toEqual([
				{ day: 1, date: '2025-10-01', count: 50 },
				{ day: 15, date: '2025-10-15', count: 100 },
				{ day: 30, date: '2025-10-30', count: 200 },
			]);
		});

		it('should handle zero counts', () => {
			const mockData: DashboardKAMResponse = {
				status_code: 200,
				segResult: {
					byDate: {
						'2025-10-01': { totalCount: 0, day: '01' },
					},
				},
			};

			const result = transformToMonthlyChartData(mockData);

			expect(result).toEqual([{ day: 1, date: '2025-10-01', count: 0 }]);
		});
	});

	describe('calculateYAxisTicks', () => {
		it('should return empty array when chartData is empty', () => {
			const result = calculateYAxisTicks([]);
			expect(result).toEqual([]);
		});

		it('should generate ticks for simple data range', () => {
			const chartData: ChartDataPoint[] = [
				{ day: 1, date: '2025-10-01', count: 0 },
				{ day: 2, date: '2025-10-02', count: 1000 },
				{ day: 3, date: '2025-10-03', count: 500 },
			];

			const result = calculateYAxisTicks(chartData);

			expect(result.length).toBeGreaterThan(0);
			expect(result[0]).toBeLessThanOrEqual(0);
			expect(result[result.length - 1]).toBeGreaterThanOrEqual(1000);
		});

		it('should generate ticks for large data range', () => {
			const chartData: ChartDataPoint[] = [
				{ day: 1, date: '2025-10-01', count: 5000 },
				{ day: 2, date: '2025-10-02', count: 25000 },
				{ day: 3, date: '2025-10-03', count: 28000 },
			];

			const result = calculateYAxisTicks(chartData);

			expect(result.length).toBeGreaterThanOrEqual(8);
			expect(result.length).toBeLessThanOrEqual(10);
			expect(result[0]).toBeLessThanOrEqual(5000);
			expect(result[result.length - 1]).toBeGreaterThanOrEqual(28000);
		});

		it('should respect custom tick rounding', () => {
			const chartData: ChartDataPoint[] = [
				{ day: 1, date: '2025-10-01', count: 1234 },
				{ day: 2, date: '2025-10-02', count: 5678 },
			];

			const result = calculateYAxisTicks(chartData, 8, 10, 100);

			// All ticks should be multiples of 100
			result.forEach(tick => {
				expect(tick % 100).toBe(0);
			});
		});
	});
});
