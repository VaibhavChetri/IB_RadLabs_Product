import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { FloatingInput, FloatingDropdown, PageHeader } from '../../components/ui';
import { BillingApiService, BillingReportRow } from '../../services/billingApi';
import { InventoryApiService } from '../../services/inventoryApi';

type DropdownOption = { label: string; value: string };

interface BillingTableRow extends BillingReportRow, Record<string, unknown> {
	serial: number;
}

const BillingDetails: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);

	// Get today's date as default
	const getTodayDate = (): string => {
		return new Date().toISOString().split('T')[0];
	};

	// Load saved filters from localStorage, default to today if not set
	const loadSavedFilters = (): {
		startDate: string;
		endDate: string;
		clientId: string;
	} => {
		try {
			const today = getTodayDate();
			return {
				startDate: localStorage.getItem('billing_start_date') || today,
				endDate: localStorage.getItem('billing_end_date') || today,
				clientId: localStorage.getItem('billing_client_id') || '',
			};
		} catch (error) {
			const today = getTodayDate();
			return { startDate: today, endDate: today, clientId: '' };
		}
	};

	const savedFilters = loadSavedFilters();
	const [startDate, setStartDate] = useState<string>(savedFilters.startDate);
	const [endDate, setEndDate] = useState<string>(savedFilters.endDate);
	const [selectedClientId, setSelectedClientId] = useState<string>(savedFilters.clientId);

	// Data state
	const [rows, setRows] = useState<BillingTableRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [billValue, setBillValue] = useState<{
		subTotal: string;
		cgst: string;
		sgst: string;
		total: string;
	} | null>(null);

	// Client dropdown options
	const [clientOptions, setClientOptions] = useState<DropdownOption[]>([]);
	const [loadingClients, setLoadingClients] = useState(false);

	// Load clients dropdown (API already returns "All" option)
	useEffect(() => {
		const loadClients = async () => {
			if (user?.city_id) {
				setLoadingClients(true);
				try {
					// Use all=1 parameter to get all clients (API already includes "All" option)
					const response = await InventoryApiService.getClientByCity(user.city_id, true);
					if (response.status_code === 200 && response.result) {
						const clients: DropdownOption[] = (
							response.result as Array<{
								clientId: number | string;
								clientName: string;
							}>
						).map(client => ({
							label: client.clientName,
							value: client.clientId.toString(),
						}));
						setClientOptions(clients);
					}
				} catch (error) {
					console.error('Failed to load clients:', error);
				} finally {
					setLoadingClients(false);
				}
			}
		};
		loadClients();
	}, [user?.city_id]);

	// Save filters to localStorage when they change
	useEffect(() => {
		if (startDate) {
			localStorage.setItem('billing_start_date', startDate);
		}
	}, [startDate]);

	useEffect(() => {
		if (endDate) {
			localStorage.setItem('billing_end_date', endDate);
		}
	}, [endDate]);

	useEffect(() => {
		if (selectedClientId) {
			localStorage.setItem('billing_client_id', selectedClientId);
		}
	}, [selectedClientId]);

	// Fetch billing data
	const fetchData = useCallback(async () => {
		if (!startDate || !endDate) return;

		setLoading(true);
		try {
			const response = await BillingApiService.getFinalCumulativeBillingReport({
				client_id: selectedClientId && selectedClientId !== 'All' ? selectedClientId : undefined,
				hsnsac: 1,
				account_id: 10,
				start_date: startDate,
				end_date: endDate,
			});

			if (response.status_code === 200 && response.data) {
				const tableRows: BillingTableRow[] = response.data.map((row, index) => ({
					...row,
					serial: index + 1,
				}));
				setRows(tableRows);
				// Use billValue from API for totals (includes all matching records, not just visible rows)
				setBillValue(response.billValue || null);
			} else {
				setRows([]);
				setBillValue(null);
			}
		} catch (error) {
			console.error('Error fetching billing data:', error);
			setRows([]);
			setBillValue(null);
		} finally {
			setLoading(false);
		}
	}, [startDate, endDate, selectedClientId]);

	// Fetch data when filters change
	useEffect(() => {
		if (startDate && endDate) {
			fetchData();
		}
	}, [startDate, endDate, selectedClientId, fetchData]);

	// Table columns
	const columns = useMemo(
		() => [
			{
				key: 'serial',
				title: '#',
				width: '60px',
				sortable: false,
				align: 'center',
				render: (_: unknown, row: BillingTableRow) => row.serial,
			},
			{ key: 'clientName', title: 'Client', sortable: true, width: '200px', align: 'left' },
			{ key: 'containerName', title: 'Container', sortable: true, width: '150px', align: 'left' },
			{
				key: 'qty',
				title: 'Qty',
				sortable: true,
				width: '100px',
				align: 'right',
				render: (_: unknown, row: BillingTableRow) => {
					// Handle comma-separated values from API
					const value = String(row.qty || '0').replace(/,/g, '');
					return parseFloat(value).toLocaleString('en-IN');
				},
			},
			{
				key: 'rate',
				title: 'Rate',
				sortable: true,
				width: '100px',
				align: 'right',
				render: (_: unknown, row: BillingTableRow) => {
					// Handle comma-separated values from API
					const value = String(row.rate || '0').replace(/,/g, '');
					return `₹${parseFloat(value).toLocaleString('en-IN', {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})}`;
				},
			},
			{
				key: 'amount',
				title: 'Amount',
				sortable: true,
				width: '120px',
				align: 'right',
				render: (_: unknown, row: BillingTableRow) => {
					// Handle comma-separated values from API (e.g., "97,240.50")
					const value = String(row.amount || '0').replace(/,/g, '');
					return `₹${parseFloat(value).toLocaleString('en-IN', {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})}`;
				},
			},
			{
				key: 'cgst',
				title: 'CGST',
				sortable: true,
				width: '120px',
				align: 'right',
				render: (_: unknown, row: BillingTableRow) => {
					// Handle comma-separated values from API (e.g., "8,751.65")
					const value = String(row.cgst || '0').replace(/,/g, '');
					return `₹${parseFloat(value).toLocaleString('en-IN', {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})}`;
				},
			},
			{
				key: 'sgst',
				title: 'SGST',
				sortable: true,
				width: '120px',
				align: 'right',
				render: (_: unknown, row: BillingTableRow) => {
					// Handle comma-separated values from API (e.g., "8,751.65")
					const value = String(row.sgst || '0').replace(/,/g, '');
					return `₹${parseFloat(value).toLocaleString('en-IN', {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})}`;
				},
			},
			{
				key: 'total',
				title: 'Total',
				sortable: true,
				width: '120px',
				align: 'right',
				render: (_: unknown, row: BillingTableRow) => {
					// Handle comma-separated values from API (e.g., "1,14,743.79")
					const value = String(row.total || '0').replace(/,/g, '');
					return `₹${parseFloat(value).toLocaleString('en-IN', {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})}`;
				},
			},
			{ key: 'zoho_customer_id', title: 'Zoho ID', sortable: true, width: '150px', align: 'left' },
			{ key: 'gst', title: 'GST#', sortable: true, width: '150px', align: 'left' },
		],
		[]
	);

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Final Cumulative Billing Listing'
				locationName='All Location'
				totalItems={rows.length}
				itemType='billing entries'
			/>

			{/* Filters */}
			<div className='flex flex-wrap gap-4 items-end'>
				<FloatingInput
					label='Start Date'
					type='date'
					value={startDate}
					onChange={setStartDate}
					className='w-48'
				/>
				<FloatingInput
					label='End Date'
					type='date'
					value={endDate}
					onChange={setEndDate}
					className='w-48'
				/>
				<FloatingDropdown
					label='Client'
					options={clientOptions}
					value={selectedClientId}
					onChange={setSelectedClientId}
					loading={loadingClients}
					className='w-64'
				/>
			</div>

			{/* Table */}
			<div className='bg-white rounded-lg shadow-sm border border-gray-200'>
				{loading ? (
					<div className='p-8 text-center text-gray-500'>Loading...</div>
				) : rows.length === 0 ? (
					<div className='p-8 text-center text-gray-500'>No data available</div>
				) : (
					<div className='overflow-x-auto'>
						<table className='w-full border-collapse'>
							<thead>
								<tr className='border-b border-gray-200'>
									{columns.map(column => (
										<th
											key={column.key}
											className={`px-3 py-2 text-left font-bold text-gray-700 whitespace-nowrap text-sm ${
												column.align === 'center' ? 'text-center' : ''
											} ${column.align === 'right' ? 'text-right' : ''}`}
											style={{ width: column.width }}
										>
											{column.title}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{rows.map((row, index) => (
									<tr
										key={index}
										className='border-b border-gray-200 hover:bg-gray-50 transition-colors'
									>
										{columns.map(column => {
											const value = row[column.key];
											const renderedValue = column.render ? column.render(value, row) : value;

											return (
												<td
													key={column.key}
													className={`px-3 py-2 font-normal text-gray-900 text-xs ${
														column.align === 'center' ? 'text-center' : ''
													} ${column.align === 'right' ? 'text-right' : ''}`}
													style={{ width: column.width, minWidth: column.width }}
												>
													{renderedValue as React.ReactNode}
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
							{/* Totals Footer - Use billValue from API (totals for all matching records) */}
							{billValue && (
								<tfoot>
									<tr className='border-t-2 border-gray-300 bg-gray-50'>
										{columns.map(column => {
											if (column.key === 'serial') {
												return (
													<td
														key={column.key}
														className='px-3 py-3 font-bold text-gray-900 text-sm text-center'
														style={{ width: column.width }}
													>
														-
													</td>
												);
											}
											if (column.key === 'amount') {
												// Handle comma-separated values from API
												const value = String(billValue.subTotal || '0').replace(/,/g, '');
												return (
													<td
														key={column.key}
														className='px-3 py-3 font-bold text-gray-900 text-sm text-right'
														style={{ width: column.width }}
													>
														₹
														{parseFloat(value).toLocaleString('en-IN', {
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														})}
													</td>
												);
											}
											if (column.key === 'cgst') {
												// Handle comma-separated values from API
												const value = String(billValue.cgst || '0').replace(/,/g, '');
												return (
													<td
														key={column.key}
														className='px-3 py-3 font-bold text-gray-900 text-sm text-right'
														style={{ width: column.width }}
													>
														₹
														{parseFloat(value).toLocaleString('en-IN', {
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														})}
													</td>
												);
											}
											if (column.key === 'sgst') {
												// Handle comma-separated values from API
												const value = String(billValue.sgst || '0').replace(/,/g, '');
												return (
													<td
														key={column.key}
														className='px-3 py-3 font-bold text-gray-900 text-sm text-right'
														style={{ width: column.width }}
													>
														₹
														{parseFloat(value).toLocaleString('en-IN', {
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														})}
													</td>
												);
											}
											if (column.key === 'total') {
												// Handle comma-separated values from API
												const value = String(billValue.total || '0').replace(/,/g, '');
												return (
													<td
														key={column.key}
														className='px-3 py-3 font-bold text-blue-600 text-base text-right'
														style={{ width: column.width }}
													>
														₹
														{parseFloat(value).toLocaleString('en-IN', {
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														})}
													</td>
												);
											}
											// Empty cells for other columns
											return (
												<td
													key={column.key}
													className='px-3 py-3 text-sm'
													style={{ width: column.width }}
												></td>
											);
										})}
									</tr>
								</tfoot>
							)}
						</table>
					</div>
				)}
			</div>
		</div>
	);
};

export default BillingDetails;
