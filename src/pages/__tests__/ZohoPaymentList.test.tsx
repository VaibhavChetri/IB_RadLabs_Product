/**
 * Unit Tests for ZohoPaymentList Component
 * Tests filtering, search, reset, and refresh functionality
 */

import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ZohoPaymentList } from '../finances/ZohoPaymentList';
import { ZohoPaymentApi } from '../../services/zohoPaymentApi';

// Mock the API service
vi.mock('../../services/zohoPaymentApi', () => ({
	ZohoPaymentApi: {
		getCustomerPayments: vi.fn(),
		importCustomerPayments: vi.fn(),
	},
}));

// Mock UI components
vi.mock('../../components/ui', () => ({
	PageHeader: ({ title, totalItems }: any) => <div data-testid="page-header">{title} - {totalItems}</div>,
	Card: ({ children }: any) => <div data-testid="card">{children}</div>,
	FloatingInput: ({ label, value, onChange }: any) => (
		<input data-testid={`input-${label}`} value={value} onChange={(e) => onChange(e.target.value)} />
	),
	FloatingDropdown: ({ label, value, options, onChange }: any) => (
		<select data-testid={`dropdown-${label}`} value={value} onChange={(e) => onChange(e.target.value)}>
			{options.map((opt: any) => (
				<option key={opt.value} value={opt.value}>
					{opt.label}
				</option>
			))}
		</select>
	),
	Pagination: ({ currentPage, totalPages, onPageChange }: any) => (
		<div data-testid="pagination">
			<button onClick={() => onPageChange(currentPage + 1)}>Next</button>
		</div>
	),
	Snackbar: ({ message, type, open }: any) => open ? <div data-testid="snackbar">{message}</div> : null,
	Button: ({ children, onClick, disabled, variant }: any) => (
		<button onClick={onClick} disabled={disabled} data-testid={`button-${children}`}>
			{children}
		</button>
	),
}));

// Mock Table component
vi.mock('../../components/ui/DataDisplay', () => ({
	Table: ({ data }: any) => (
		<div data-testid="table">
			{data.map((row: any) => (
				<div key={row.id} data-testid={`row-${row.id}`}>
					{row.customer_name}
				</div>
			))}
		</div>
	),
}));

const mockPaymentData = {
	statusCode: 200,
	message: 'success',
	data: [
		{
			id: 1,
			payment_number: '3333',
			customer_name: 'Test Customer',
			payment_date: '2026-03-10',
			payment_mode: 'Cash',
			amount: 100000,
			account_name: 'ICICI Bank',
			invoice_numbers: 'IB-2025-26/01354',
			payment_status: 'paid',
		},
	],
	pagination: {
		page: 1,
		limit: 50,
		total: 1,
		totalPages: 1,
	},
};

describe('ZohoPaymentList Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(ZohoPaymentApi.getCustomerPayments).mockResolvedValue(mockPaymentData);
	});

	it('should render the component with title and initial state', async () => {
		render(<ZohoPaymentList />);

		await waitFor(() => {
			expect(screen.getByTestId('page-header')).toBeInTheDocument();
			expect(screen.getByText(/Zoho Payment Received/i)).toBeInTheDocument();
		});
	});

	it('should fetch payments on component mount', async () => {
		render(<ZohoPaymentList />);

		await waitFor(() => {
			expect(ZohoPaymentApi.getCustomerPayments).toHaveBeenCalled();
		});
	});

	it('should render filter inputs and buttons', async () => {
		render(<ZohoPaymentList />);

		await waitFor(() => {
			expect(screen.getByTestId('input-Start Date')).toBeInTheDocument();
			expect(screen.getByTestId('input-End Date')).toBeInTheDocument();
			expect(screen.getByTestId('input-Customer Name')).toBeInTheDocument();
			expect(screen.getByTestId('dropdown-Payment Mode')).toBeInTheDocument();
			expect(screen.getByTestId('button-Search')).toBeInTheDocument();
			expect(screen.getByTestId('button-Reset')).toBeInTheDocument();
			expect(screen.getByTestId('button-Refresh from Zoho')).toBeInTheDocument();
		});
	});

	it('should update filter values without calling API on input change', async () => {
		const user = userEvent.setup();
		render(<ZohoPaymentList />);

		const startDateInput = screen.getByTestId('input-Start Date') as HTMLInputElement;

		await waitFor(() => {
			expect(ZohoPaymentApi.getCustomerPayments).toHaveBeenCalledTimes(1);
		});

		vi.clearAllMocks();

		await user.type(startDateInput, '2026-01-01');

		// Typing should not trigger API call
		expect(ZohoPaymentApi.getCustomerPayments).not.toHaveBeenCalled();
		expect(startDateInput.value).toBe('2026-01-01');
	});

	it('should call API when Search button is clicked with filters', async () => {
		const user = userEvent.setup();
		render(<ZohoPaymentList />);

		const startDateInput = screen.getByTestId('input-Start Date');
		const endDateInput = screen.getByTestId('input-End Date');
		const searchButton = screen.getByTestId('button-Search');

		await user.type(startDateInput, '2026-01-01');
		await user.type(endDateInput, '2026-03-31');

		vi.clearAllMocks();
		vi.mocked(ZohoPaymentApi.getCustomerPayments).mockResolvedValue(mockPaymentData);

		await user.click(searchButton);

		await waitFor(() => {
			expect(ZohoPaymentApi.getCustomerPayments).toHaveBeenCalled();
		});
	});

	it('should reset all filter values when Reset button is clicked', async () => {
		const user = userEvent.setup();
		render(<ZohoPaymentList />);

		const startDateInput = screen.getByTestId('input-Start Date') as HTMLInputElement;
		const endDateInput = screen.getByTestId('input-End Date') as HTMLInputElement;
		const customerInput = screen.getByTestId('input-Customer Name') as HTMLInputElement;
		const resetButton = screen.getByTestId('button-Reset');

		await user.type(startDateInput, '2026-01-01');
		await user.type(endDateInput, '2026-03-31');
		await user.type(customerInput, 'Test');

		expect(startDateInput.value).toBe('2026-01-01');
		expect(endDateInput.value).toBe('2026-03-31');
		expect(customerInput.value).toBe('Test');

		await user.click(resetButton);

		// All inputs should be cleared
		expect(startDateInput.value).toBe('');
		expect(endDateInput.value).toBe('');
		expect(customerInput.value).toBe('');
	});

	it('should show error when clicking Refresh without dates in filters', async () => {
		const user = userEvent.setup();
		render(<ZohoPaymentList />);

		const refreshButton = screen.getByTestId('button-Refresh from Zoho');

		await user.click(refreshButton);

		await waitFor(() => {
			expect(screen.getByTestId('snackbar')).toHaveTextContent(
				'Please set both Start Date and End Date filters before refreshing'
			);
		});

		// Import API should not be called
		expect(ZohoPaymentApi.importCustomerPayments).not.toHaveBeenCalled();
	});

	it('should call import then fetch on successful refresh after search', async () => {
		const user = userEvent.setup();
		render(<ZohoPaymentList />);

		// First: Set dates and click Search to populate filters state
		const startDateInput = screen.getByTestId('input-Start Date');
		const endDateInput = screen.getByTestId('input-End Date');
		const searchButton = screen.getByTestId('button-Search');

		await user.type(startDateInput, '2026-01-01');
		await user.type(endDateInput, '2026-03-31');
		await user.click(searchButton);

		// Wait for search API call
		await waitFor(() => {
			expect(ZohoPaymentApi.getCustomerPayments).toHaveBeenCalled();
		});

		vi.clearAllMocks();

		// Now set up mocks for import and fetch
		const mockImportResponse = {
			statusCode: 200,
			message: 'Import successful',
			data: { imported: 5, updated: 2 },
		};

		vi.mocked(ZohoPaymentApi.importCustomerPayments).mockResolvedValue(mockImportResponse);
		vi.mocked(ZohoPaymentApi.getCustomerPayments).mockResolvedValue(mockPaymentData);

		// Click Refresh button
		const refreshButton = screen.getByTestId('button-Refresh from Zoho');
		await user.click(refreshButton);

		// Verify both import and fetch were called
		await waitFor(() => {
			expect(ZohoPaymentApi.importCustomerPayments).toHaveBeenCalledWith('2026-01-01', '2026-03-31');
			expect(ZohoPaymentApi.getCustomerPayments).toHaveBeenCalled();
		});
	});

	it('should display payment data in table', async () => {
		render(<ZohoPaymentList />);

		await waitFor(() => {
			expect(screen.getByTestId('table')).toBeInTheDocument();
			expect(screen.getByText('Test Customer')).toBeInTheDocument();
		});
	});

	it('should display success message after import', async () => {
		const user = userEvent.setup();
		render(<ZohoPaymentList />);

		const startDateInput = screen.getByTestId('input-Start Date');
		const endDateInput = screen.getByTestId('input-End Date');
		const searchButton = screen.getByTestId('button-Search');

		await user.type(startDateInput, '2026-01-01');
		await user.type(endDateInput, '2026-03-31');
		await user.click(searchButton);

		await waitFor(() => {
			expect(ZohoPaymentApi.getCustomerPayments).toHaveBeenCalled();
		});

		vi.clearAllMocks();

		const mockImportResponse = {
			statusCode: 200,
			message: 'Import successful',
			data: { imported: 10, updated: 5 },
		};

		vi.mocked(ZohoPaymentApi.importCustomerPayments).mockResolvedValue(mockImportResponse);
		vi.mocked(ZohoPaymentApi.getCustomerPayments).mockResolvedValue(mockPaymentData);

		const refreshButton = screen.getByTestId('button-Refresh from Zoho');
		await user.click(refreshButton);

		await waitFor(() => {
			expect(screen.getByTestId('snackbar')).toHaveTextContent(
				'Successfully imported 10 new payments'
			);
		});
	});

	it('should handle API errors gracefully', async () => {
		const error = new Error('API Error');
		vi.mocked(ZohoPaymentApi.getCustomerPayments).mockRejectedValueOnce(error);

		render(<ZohoPaymentList />);

		await waitFor(() => {
			expect(screen.getByTestId('snackbar')).toHaveTextContent('API Error');
		});
	});

	it('should pass correct filters to API on search', async () => {
		const user = userEvent.setup();
		render(<ZohoPaymentList />);

		const startDateInput = screen.getByTestId('input-Start Date');
		const endDateInput = screen.getByTestId('input-End Date');
		const customerInput = screen.getByTestId('input-Customer Name');
		const paymentModeDropdown = screen.getByTestId('dropdown-Payment Mode');
		const searchButton = screen.getByTestId('button-Search');

		await user.type(startDateInput, '2026-01-01');
		await user.type(endDateInput, '2026-03-31');
		await user.type(customerInput, 'Test Customer');
		await user.selectOption(paymentModeDropdown, 'Cash');

		vi.clearAllMocks();
		vi.mocked(ZohoPaymentApi.getCustomerPayments).mockResolvedValue(mockPaymentData);

		await user.click(searchButton);

		await waitFor(() => {
			const callArgs = vi.mocked(ZohoPaymentApi.getCustomerPayments).mock.calls[0][0];
			expect(callArgs.date_start).toBe('2026-01-01');
			expect(callArgs.date_end).toBe('2026-03-31');
			expect(callArgs.customer_name).toBe('Test Customer');
			expect(callArgs.payment_mode).toBe('Cash');
			expect(callArgs.page).toBe(1);
		});
	});

	it('should handle import error and show error message', async () => {
		const user = userEvent.setup();
		render(<ZohoPaymentList />);

		const startDateInput = screen.getByTestId('input-Start Date');
		const endDateInput = screen.getByTestId('input-End Date');
		const searchButton = screen.getByTestId('button-Search');

		await user.type(startDateInput, '2026-01-01');
		await user.type(endDateInput, '2026-03-31');
		await user.click(searchButton);

		await waitFor(() => {
			expect(ZohoPaymentApi.getCustomerPayments).toHaveBeenCalled();
		});

		vi.clearAllMocks();

		const importError = new Error('Import failed on server');
		vi.mocked(ZohoPaymentApi.importCustomerPayments).mockRejectedValueOnce(importError);

		const refreshButton = screen.getByTestId('button-Refresh from Zoho');
		await user.click(refreshButton);

		await waitFor(() => {
			expect(screen.getByTestId('snackbar')).toHaveTextContent('Import failed on server');
		});
	});
});
