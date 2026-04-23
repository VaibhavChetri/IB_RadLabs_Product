/**
 * Unit Tests for useDashboardDataQuery Hook
 * Tests React Query-based data fetching with mocking
 */

import { beforeEach, vi } from 'jest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDashboardDataQuery } from '../useDashboardDataQuery';
import { InventoryApiService } from '../../../../services/inventoryApi';
import { DashboardKAMResponse } from '../../../../services/inventoryApi';

// Mock the API service
vi.mock('../../../../services/inventoryApi', () => ({
	InventoryApiService: {
		getSentCountKAM: vi.fn(),
	},
}));

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				cacheTime: 0,
			},
		},
	});

	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe('useDashboardDataQuery', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return loading state initially', () => {
		vi.mocked(InventoryApiService.getSentCountKAM).mockResolvedValue({
			status_code: 200,
		} as DashboardKAMResponse);

		const { result } = renderHook(
			() =>
				useDashboardDataQuery({
					locationId: '1',
					clientId: 'all',
					month: '10',
					year: '2025',
				}),
			{
				wrapper: createWrapper(),
			}
		);

		expect(result.current.loading).toBe(true);
	});

	it('should fetch and transform data successfully', async () => {
		const mockResponse: DashboardKAMResponse = {
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
			segResult: {
				byDate: {
					'2025-10-01': { totalCount: 100, day: '01' },
				},
			},
		};

		vi.mocked(InventoryApiService.getSentCountKAM).mockResolvedValue(mockResponse);

		const { result } = renderHook(
			() =>
				useDashboardDataQuery({
					locationId: '1',
					clientId: 'all',
					month: '10',
					year: '2025',
				}),
			{
				wrapper: createWrapper(),
			}
		);

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.stats).toEqual({
			totalClientSKUCount: 1000,
			totalClientAvgSKUCount: 500,
			totalPlasticSavedKg: 100,
			water: 200,
			ghc: 50,
		});

		expect(result.current.chartData).toHaveLength(1);
		expect(result.current.data).toEqual(mockResponse);
	});

	it('should handle API errors', async () => {
		vi.mocked(InventoryApiService.getSentCountKAM).mockRejectedValue(
			new Error('Network error')
		);

		const { result } = renderHook(
			() =>
				useDashboardDataQuery({
					locationId: '1',
					clientId: 'all',
					month: '10',
					year: '2025',
				}),
			{
				wrapper: createWrapper(),
			}
		);

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.isError).toBe(true);
		expect(result.current.error).toBeTruthy();
	});

	it('should not fetch when enabled is false', () => {
		renderHook(
			() =>
				useDashboardDataQuery({
					locationId: '1',
					clientId: 'all',
					month: '10',
					year: '2025',
					enabled: false,
				}),
			{
				wrapper: createWrapper(),
			}
		);

		expect(InventoryApiService.getSentCountKAM).not.toHaveBeenCalled();
	});

	it('should not fetch when locationId is missing', () => {
		renderHook(
			() =>
				useDashboardDataQuery({
					locationId: null,
					clientId: 'all',
					month: '10',
					year: '2025',
				}),
			{
				wrapper: createWrapper(),
			}
		);

		expect(InventoryApiService.getSentCountKAM).not.toHaveBeenCalled();
	});
});

