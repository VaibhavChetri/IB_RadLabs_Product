/**
 * Unit Tests for Zoho Payment API Service
 * Tests API methods for fetching and importing payments
 */

import { beforeEach, describe, it, expect, vi } from 'vitest';
import { ZohoPaymentApi, ZohoPayment, ZohoPaymentFilters } from '../zohoPaymentApi';
import { apiService } from '../api';

// Mock the API service
vi.mock('../api', () => ({
	apiService: {
		get: vi.fn(),
		post: vi.fn(),
	},
}));

describe('ZohoPaymentApi', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getCustomerPayments', () => {
		it('should fetch payments with all filters', async () => {
			const mockFilters: ZohoPaymentFilters = {
				page: 1,
				limit: 50,
				date_start: '2026-01-01',
				date_end: '2026-03-31',
				customer_name: 'Test Customer',
				payment_mode: 'Cash',
			};

			const mockResponse = {
				statusCode: 200,
				message: 'success',
				data: [
					{
						id: 1,
						payment_number: '3333',
						customer_name: 'Test Customer',
						amount: 100000,
						payment_date: '2026-03-10',
					} as ZohoPayment,
				],
				pagination: {
					page: 1,
					limit: 50,
					total: 1,
					totalPages: 1,
				},
			};

			vi.mocked(apiService.get).mockResolvedValueOnce(mockResponse);

			const result = await ZohoPaymentApi.getCustomerPayments(mockFilters);

			expect(result.statusCode).toBe(200);
			expect(result.data).toHaveLength(1);
			expect(result.pagination.total).toBe(1);
			expect(apiService.get).toHaveBeenCalledWith(
				expect.stringContaining('/billing/zoho/customer-payments')
			);
		});

		it('should handle empty filters', async () => {
			const mockFilters: ZohoPaymentFilters = {
				page: 1,
				limit: 50,
			};

			const mockResponse = {
				statusCode: 200,
				message: 'success',
				data: [],
				pagination: {
					page: 1,
					limit: 50,
					total: 0,
					totalPages: 0,
				},
			};

			vi.mocked(apiService.get).mockResolvedValueOnce(mockResponse);

			const result = await ZohoPaymentApi.getCustomerPayments(mockFilters);

			expect(result.data).toHaveLength(0);
			expect(apiService.get).toHaveBeenCalled();
		});

		it('should include pagination in query params', async () => {
			const mockFilters: ZohoPaymentFilters = {
				page: 2,
				limit: 25,
			};

			vi.mocked(apiService.get).mockResolvedValueOnce({
				statusCode: 200,
				message: 'success',
				data: [],
				pagination: { page: 2, limit: 25, total: 50, totalPages: 2 },
			});

			await ZohoPaymentApi.getCustomerPayments(mockFilters);

			const callArgs = vi.mocked(apiService.get).mock.calls[0][0] as string;
			expect(callArgs).toContain('page=2');
			expect(callArgs).toContain('limit=25');
		});

		it('should handle API errors gracefully', async () => {
			const mockFilters: ZohoPaymentFilters = { page: 1, limit: 50 };
			const error = new Error('Network error');

			vi.mocked(apiService.get).mockRejectedValueOnce(error);

			await expect(ZohoPaymentApi.getCustomerPayments(mockFilters)).rejects.toThrow(
				'Network error'
			);
		});
	});

	describe('importCustomerPayments', () => {
		it('should call import API and return response', async () => {
			const mockResponse = {
				statusCode: 200,
				message: 'Import successful',
				data: {
					imported: 5,
					updated: 2,
				},
			};

			vi.mocked(apiService.post).mockResolvedValueOnce(mockResponse);

			const result = await ZohoPaymentApi.importCustomerPayments();

			expect(result.statusCode).toBe(200);
			expect(result.data.imported).toBe(5);
			expect(result.data.updated).toBe(2);
		});

		it('should hit the import endpoint without date query parameters', async () => {
			vi.mocked(apiService.post).mockResolvedValueOnce({
				statusCode: 200,
				message: 'success',
				data: { imported: 0, updated: 0 },
			});

			await ZohoPaymentApi.importCustomerPayments();

			const url = vi.mocked(apiService.post).mock.calls[0][0] as string;
			expect(url).toBe('/billing/zoho/customer-payments/import');
			expect(url).not.toContain('date_start');
			expect(url).not.toContain('date_end');
		});

		it('should handle import errors', async () => {
			const error = new Error('Import failed');
			vi.mocked(apiService.post).mockRejectedValueOnce(error);

			await expect(ZohoPaymentApi.importCustomerPayments()).rejects.toThrow('Import failed');
		});

		it('should pass empty body to POST request', async () => {
			vi.mocked(apiService.post).mockResolvedValueOnce({
				statusCode: 200,
				message: 'success',
				data: { imported: 0, updated: 0 },
			});

			await ZohoPaymentApi.importCustomerPayments();

			const callArgs = vi.mocked(apiService.post).mock.calls[0];
			expect(callArgs[1]).toEqual({});
		});
	});
});
