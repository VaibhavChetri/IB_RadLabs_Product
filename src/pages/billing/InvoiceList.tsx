import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
	FloatingInput,
	FloatingDropdown,
	PageHeader,
	SearchButton,
	Button,
} from '../../components/ui';
import {
	BillingApiService,
	BillingReportRow,
	ClientGroup,
	HsnSac,
	SalesAccount,
} from '../../services/billingApi';
import { InventoryApiService } from '../../services/inventoryApi';

type DropdownOption = { label: string; value: string };

interface InvoiceTableRow extends BillingReportRow, Record<string, unknown> {
	serial: number;
}

const InvoiceList: React.FC = () => {
	// Get today's date as default
	const getTodayDate = (): string => {
		return new Date().toISOString().split('T')[0];
	};

	// Filter states
	const [startDate, setStartDate] = useState<string>(getTodayDate());
	const [endDate, setEndDate] = useState<string>(getTodayDate());
	const [selectedClientId, setSelectedClientId] = useState<string>('');
	const [selectedGroupId, setSelectedGroupId] = useState<string>('');
	const [selectedHsnSacId, setSelectedHsnSacId] = useState<string>('');
	const [selectedAccountId, setSelectedAccountId] = useState<string>('');
	const [selectedDueDate, setSelectedDueDate] = useState<string>('');

	// Dropdown options
	const [clientOptions, setClientOptions] = useState<DropdownOption[]>([]);
	const [groupOptions, setGroupOptions] = useState<DropdownOption[]>([]);
	const [hsnSacOptions, setHsnSacOptions] = useState<DropdownOption[]>([]);
	const [salesAccountOptions, setSalesAccountOptions] = useState<DropdownOption[]>([]);
	const dueDateOptions: DropdownOption[] = [
		{ label: '15', value: '15' },
		{ label: '30', value: '30' },
		{ label: '45', value: '45' },
	];

	// Loading states
	const [loadingClients, setLoadingClients] = useState(false);
	const [loadingGroups, setLoadingGroups] = useState(false);
	const [loadingHsnSac, setLoadingHsnSac] = useState(false);
	const [loadingSalesAccount, setLoadingSalesAccount] = useState(false);

	// Data state
	const [rows, setRows] = useState<InvoiceTableRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [billValue, setBillValue] = useState<{
		subTotal: string;
		cgst: string;
		sgst: string;
		total: string;
	} | null>(null);
	const [searchExecuted, setSearchExecuted] = useState(false);
	const [creatingInvoice, setCreatingInvoice] = useState(false);

	// Load clients dropdown
	useEffect(() => {
		const loadClients = async () => {
			setLoadingClients(true);
			try {
				// Use location_id=2 as specified
				const response = await InventoryApiService.getClientByCity(2, true);
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
		};
		loadClients();
	}, []);

	// Load groups dropdown
	useEffect(() => {
		const loadGroups = async () => {
			setLoadingGroups(true);
			try {
				const response = await BillingApiService.getClientGroupMaster();
				if (response.status_code === 200 && response.data) {
					const groups: DropdownOption[] = (response.data as ClientGroup[]).map(group => ({
						label: group.name,
						value: group.id.toString(),
					}));
					setGroupOptions(groups);
				}
			} catch (error) {
				console.error('Failed to load groups:', error);
			} finally {
				setLoadingGroups(false);
			}
		};
		loadGroups();
	}, []);

	// Load HSN/SAC dropdown
	useEffect(() => {
		const loadHsnSac = async () => {
			setLoadingHsnSac(true);
			try {
				const response = await BillingApiService.getHsnSac();
				// HSN/SAC API returns data in 'result' property
				const hsnSacData = (response as any).result || response.data || [];
				if (response.status_code === 200 && hsnSacData.length > 0) {
					const hsnSac: DropdownOption[] = (hsnSacData as HsnSac[]).map(item => ({
						label: item.name,
						value: item.id.toString(),
					}));
					setHsnSacOptions(hsnSac);
				}
			} catch (error) {
				console.error('Failed to load HSN/SAC:', error);
			} finally {
				setLoadingHsnSac(false);
			}
		};
		loadHsnSac();
	}, []);

	// Load Sales Account dropdown
	useEffect(() => {
		const loadSalesAccount = async () => {
			setLoadingSalesAccount(true);
			try {
				const response = await BillingApiService.getZohoSalesAccount();
				if (response.status_code === 200 && response.data) {
					const accounts: DropdownOption[] = (response.data as SalesAccount[]).map(account => ({
						label: account.accountName,
						value: account.accountId,
					}));
					setSalesAccountOptions(accounts);
				}
			} catch (error) {
				console.error('Failed to load sales accounts:', error);
			} finally {
				setLoadingSalesAccount(false);
			}
		};
		loadSalesAccount();
	}, []);

	// Handle Client/Group mutual exclusivity
	const handleClientChange = (value: string) => {
		setSelectedClientId(value);
		if (value) {
			setSelectedGroupId(''); // Clear group if client is selected
		}
	};

	const handleGroupChange = (value: string) => {
		setSelectedGroupId(value);
		if (value) {
			setSelectedClientId(''); // Clear client if group is selected
		}
	};

	// Validate search requirements
	const isSearchDisabled = useMemo(() => {
		const hasClientOrGroup = selectedClientId || selectedGroupId;
		const hasMandatoryFields =
			selectedHsnSacId && selectedAccountId && selectedDueDate && startDate && endDate;
		return !hasClientOrGroup || !hasMandatoryFields;
	}, [
		selectedClientId,
		selectedGroupId,
		selectedHsnSacId,
		selectedAccountId,
		selectedDueDate,
		startDate,
		endDate,
	]);

	// Get selected account name for API
	const selectedAccountName = useMemo(() => {
		const account = salesAccountOptions.find(acc => acc.value === selectedAccountId);
		return account?.label || '';
	}, [selectedAccountId, salesAccountOptions]);

	// Search function
	const handleSearch = useCallback(async () => {
		if (isSearchDisabled) return;

		setLoading(true);
		setSearchExecuted(false);
		try {
			const params: any = {
				start_date: startDate,
				end_date: endDate,
				hsnsac: parseInt(selectedHsnSacId),
				account_id: selectedAccountId,
				account_name: selectedAccountName,
				due_date_id: parseInt(selectedDueDate),
			};

			// Add groupId or client_id based on selection
			if (selectedGroupId) {
				params.groupId = parseInt(selectedGroupId);
			} else if (selectedClientId) {
				params.client_id = parseInt(selectedClientId);
				params.generate_invoice = true;
				params.page = 1;
				params.limit = 10;
			}

			const response = await BillingApiService.getFinalCumulativeBillingReport(params);

			if (response.status_code === 200 && response.data) {
				const tableRows: InvoiceTableRow[] = response.data.map((row, index) => ({
					...row,
					serial: index + 1,
				}));
				setRows(tableRows);
				setBillValue(response.billValue || null);
				setSearchExecuted(true);
			} else {
				setRows([]);
				setBillValue(null);
			}
		} catch (error) {
			console.error('Error fetching invoice data:', error);
			setRows([]);
			setBillValue(null);
		} finally {
			setLoading(false);
		}
	}, [
		isSearchDisabled,
		startDate,
		endDate,
		selectedClientId,
		selectedGroupId,
		selectedHsnSacId,
		selectedAccountId,
		selectedDueDate,
		selectedAccountName,
	]);

	// Handle Create Invoice
	const handleCreateInvoice = useCallback(async () => {
		if (!selectedAccountId || !selectedHsnSacId || !selectedDueDate || rows.length === 0) {
			return;
		}

		setCreatingInvoice(true);
		try {
			// Prepare finalResult from rows (remove serial number)
			const finalResult = rows.map(row => {
				const { serial, ...rest } = row;
				return rest;
			});

			const payload = {
				account_id: selectedAccountId,
				account_name: selectedAccountName,
				hsnsac: parseInt(selectedHsnSacId),
				due_date_id: parseInt(selectedDueDate),
				finalResult: finalResult,
			};

			const response = await BillingApiService.createZohoInvoice(payload);

			if (response.status_code === 200 || response.status === 'Success') {
				// Show success message (you can add a snackbar/toast here)
				alert('Invoice created successfully!');
			} else {
				alert('Failed to create invoice. Please try again.');
			}
		} catch (error) {
			console.error('Error creating invoice:', error);
			alert('Error creating invoice. Please try again.');
		} finally {
			setCreatingInvoice(false);
		}
	}, [selectedAccountId, selectedAccountName, selectedHsnSacId, selectedDueDate, rows]);

	// Table columns
	const columns = useMemo(
		() => [
			{
				key: 'serial',
				title: '#',
				width: '60px',
				sortable: false,
				align: 'center',
				render: (_: unknown, row: InvoiceTableRow) => row.serial,
			},
			{ key: 'containerName', title: 'Container', sortable: true, width: '200px', align: 'left' },
			{
				key: 'qty',
				title: 'Qty',
				sortable: true,
				width: '100px',
				align: 'right',
				render: (_: unknown, row: InvoiceTableRow) => {
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
				render: (_: unknown, row: InvoiceTableRow) => {
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
				render: (_: unknown, row: InvoiceTableRow) => {
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
				render: (_: unknown, row: InvoiceTableRow) => {
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
				render: (_: unknown, row: InvoiceTableRow) => {
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
				render: (_: unknown, row: InvoiceTableRow) => {
					const value = String(row.total || '0').replace(/,/g, '');
					return `₹${parseFloat(value).toLocaleString('en-IN', {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})}`;
				},
			},
		],
		[]
	);

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Invoice Listing'
				locationName='All Location'
				totalItems={rows.length}
				itemType='invoice entries'
			/>

			{/* Filters */}
			<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
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
						onChange={handleClientChange}
						loading={loadingClients}
						className='w-64'
						placeholder='Select Client'
					/>
					<FloatingDropdown
						label='Group'
						options={groupOptions}
						value={selectedGroupId}
						onChange={handleGroupChange}
						loading={loadingGroups}
						className='w-64'
						placeholder='Select Group'
					/>
					<FloatingDropdown
						label='HSN/SAC'
						options={hsnSacOptions}
						value={selectedHsnSacId}
						onChange={setSelectedHsnSacId}
						loading={loadingHsnSac}
						className='w-64'
						placeholder='Select HSN/SAC'
					/>
					<FloatingDropdown
						label='Sales Account'
						options={salesAccountOptions}
						value={selectedAccountId}
						onChange={setSelectedAccountId}
						loading={loadingSalesAccount}
						className='w-64'
						placeholder='Select Sales Account'
					/>
					<FloatingDropdown
						label='Due Date'
						options={dueDateOptions}
						value={selectedDueDate}
						onChange={setSelectedDueDate}
						className='w-48'
						placeholder='Select Due Date'
					/>
					<SearchButton onClick={handleSearch} disabled={isSearchDisabled} />
				</div>
				{/* Validation message */}
				{isSearchDisabled && (
					<div className='mt-2 text-sm text-amber-600'>
						* Please select either Client or Group, and ensure HSN/SAC, Sales Account, and Due Date
						are selected.
					</div>
				)}
			</div>

			{/* Action Buttons (shown after successful search) */}
			{searchExecuted && rows.length > 0 && (
				<div className='flex gap-3'>
					<Button
						variant='outline'
						size='md'
						onClick={handleCreateInvoice}
						disabled={creatingInvoice}
					>
						{creatingInvoice ? 'Creating...' : 'Create Invoice'}
					</Button>
					<Button variant='outline' size='md'>
						View Invoice
					</Button>
					<Button variant='outline' size='md'>
						Download Invoice
					</Button>
				</div>
			)}

			{/* Table */}
			<div className='bg-white rounded-lg shadow-sm border border-gray-200'>
				{loading ? (
					<div className='p-8 text-center text-gray-500'>Loading...</div>
				) : rows.length === 0 ? (
					<div className='p-8 text-center text-gray-500'>
						{searchExecuted
							? 'No data available'
							: 'Please use filters and click Search to view invoice data'}
					</div>
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
							{/* Totals Footer */}
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
											if (column.key === 'containerName') {
												return (
													<td
														key={column.key}
														className='px-3 py-3 font-bold text-gray-900 text-sm'
														style={{ width: column.width }}
													>
														Total
													</td>
												);
											}
											if (column.key === 'amount') {
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

export default InvoiceList;
