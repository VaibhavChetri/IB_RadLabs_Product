/**
 * TrackingList Page - My Leads
 * Main dashboard to view all tracked leads with filtering
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { History, Phone, Calendar } from 'lucide-react';
import { PageHeader, Button, Snackbar, FloatingInput, FloatingDropdown, Pagination, TableSkeleton, Table } from '@/components/ui';
import { TableColumn } from '@/components/ui/DataDisplay';
import { StatusBadge } from '@/components/leads/StatusBadge';
import { LeadApiService, TrackingLead, OutreachStatus } from '@/services/leadApi';
import { OutreachLogModal } from '@/components/leads/OutreachLogModal';
import { ContactTimelineModal } from '@/components/leads/ContactTimelineModal';

export const TrackingList: React.FC = () => {
	const [loading, setLoading] = useState(false);
	const [leads, setLeads] = useState<TrackingLead[]>([]);
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
		open: false,
		message: '',
		type: 'success',
	});

	// Statuses for filter dropdown
	const [statuses, setStatuses] = useState<OutreachStatus[]>([]);
	const [loadingStatuses, setLoadingStatuses] = useState(false);

	// Pagination state
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(25);
	const [totalItems, setTotalItems] = useState(0);
	const [totalPages, setTotalPages] = useState(1);

	// Filter state
	const [filters, setFilters] = useState({
		assigned_to: '',
		status_id: '',
		has_callback: false,
		search: '',
	});

	// Modal states
	const [outreachModalVisible, setOutreachModalVisible] = useState(false);
	const [timelineModalVisible, setTimelineModalVisible] = useState(false);
	const [selectedContact, setSelectedContact] = useState<TrackingLead | null>(null);

	// Fetch leads from API
	const fetchLeads = useCallback(async () => {
		setLoading(true);
		try {
			const apiFilters: {
				assigned_to?: number;
				status_id?: number;
				has_callback?: boolean;
				search?: string;
			} = {};

			if (filters.assigned_to) {
				apiFilters.assigned_to = parseInt(filters.assigned_to);
			}
			if (filters.status_id) {
				apiFilters.status_id = parseInt(filters.status_id);
			}
			if (filters.has_callback) {
				apiFilters.has_callback = true;
			}
			if (filters.search) {
				apiFilters.search = filters.search;
			}

			const response = await LeadApiService.getTrackingList(apiFilters, page, limit);
			
			// Handle both success: true and status_code: 200 response formats
			// The API might return { success: true, data: {...} } or { status_code: 200, data: {...} }
			type ApiResponseFormat = { 
				success?: boolean; 
				status_code?: number; 
				data?: { 
					current_page: number;
					per_page: number;
					total: number;
					total_pages: number;
					contacts: unknown[];
				}; 
				message?: string;
			};
			const responseAny = response as ApiResponseFormat;
			const isSuccess = responseAny.success === true || responseAny.status_code === 200;
			const responseData = responseAny.data;
			
			console.log('API Response:', response);
			console.log('Response Data:', responseData);
			
			if (isSuccess && responseData && responseData.contacts) {
				// Transform API response to match component's expected structure
				// API returns contacts with flat status fields, we need to transform to nested current_status object
				type ApiContact = {
					contact_id: string;
					full_name: string;
					job_title?: string | null;
					company_name: string;
					company_id?: string | null;
					email?: string | null;
					phone?: string | null;
					location?: string | null;
					tracking_started_at: string;
					last_outreach_date?: string | null;
					last_outreach_type?: string | null;
					status_id?: number | null;
					status_name?: string | null;
					status_category?: string | null;
					status_color?: string | null;
					total_outreach_count?: number;
					email_count?: number;
					phone_count?: number;
					next_callback_at?: string | null;
					assigned_to?: number | null;
					assigned_to_name?: string | null;
					is_active?: number | boolean;
					[key: string]: unknown;
				};
				
				// Create a map of status_id -> status for quick lookup
				const statusMap = new Map<number, OutreachStatus>();
				statuses.forEach(status => {
					statusMap.set(status.id, status);
				});
				
				const transformedContacts: TrackingLead[] = (responseData.contacts as ApiContact[]).map((contact) => {
					// Find matching status from fetched statuses
					const matchedStatus = contact.status_id ? statusMap.get(contact.status_id) : null;
					
					return {
						contact_id: contact.contact_id,
						full_name: contact.full_name,
						job_title: contact.job_title || undefined,
						company_name: contact.company_name,
						company_id: contact.company_id || undefined,
						email: contact.email || undefined,
						phone: contact.phone || undefined,
						location: contact.location || undefined,
						tracking_started_at: contact.tracking_started_at,
						last_outreach_date: contact.last_outreach_date || undefined,
						last_outreach_type: (contact.last_outreach_type as 'email' | 'phone' | 'both' | 'meeting' | 'other' | null) || null,
						// Transform status fields to current_status object
						// Use matched status from API if available, otherwise use contact's status fields
						current_status: contact.status_id
							? {
									id: contact.status_id,
									status_name: matchedStatus?.status_name || contact.status_name || 'Unknown',
									status_color: matchedStatus?.status_color || contact.status_color || '#9CA3AF',
									status_category: matchedStatus?.status_category || contact.status_category || 'other',
							  }
							: {
									id: 0,
									status_name: 'Not Set',
									status_color: '#9CA3AF',
									status_category: 'other',
							  },
						total_outreach_count: contact.total_outreach_count || 0,
						email_count: contact.email_count || 0,
						phone_count: contact.phone_count || 0,
						next_callback_at: contact.next_callback_at || undefined,
						// Transform assigned_to fields
						assigned_to: contact.assigned_to
							? {
									id: contact.assigned_to,
									name: contact.assigned_to_name || 'Unknown',
							  }
							: undefined,
						// Convert is_active from number to boolean
						is_active: contact.is_active === 1 || contact.is_active === true,
					};
				});
				
				console.log('Transformed Contacts:', transformedContacts);
				
				setLeads(transformedContacts);
				setTotalItems(responseData.total || 0);
				setTotalPages(responseData.total_pages || 1);
			} else {
				throw new Error(responseAny.message || 'Failed to load leads');
			}
		} catch (error: unknown) {
			console.error('Failed to load leads:', error);
			const errorMessage = error instanceof Error 
				? error.message 
				: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load leads';
			setSnackbar({
				open: true,
				message: errorMessage,
				type: 'error',
			});
			// Fallback to empty array on error
			setLeads([]);
			setTotalItems(0);
			setTotalPages(0);
		} finally {
			setLoading(false);
		}
	}, [filters, page, limit, statuses]);

	// Fetch statuses on mount
	useEffect(() => {
		const loadStatuses = async () => {
			setLoadingStatuses(true);
			try {
				const response = await LeadApiService.getStatuses(true);
				const responseAny = response as { success?: boolean; status_code?: number; data?: OutreachStatus[]; message?: string };
				const isSuccess = responseAny.success === true || responseAny.status_code === 200;
				const statusesData = responseAny.data || (response as { data?: OutreachStatus[] }).data;

				if (isSuccess && statusesData && statusesData.length > 0) {
					setStatuses(statusesData);
				} else {
					console.warn('Failed to load statuses, using empty array');
					setStatuses([]);
				}
			} catch (error: unknown) {
				console.error('Failed to load statuses:', error);
				setStatuses([]);
			} finally {
				setLoadingStatuses(false);
			}
		};

		loadStatuses();
	}, []);

	// Fetch leads when filters change
	useEffect(() => {
		fetchLeads();
	}, [fetchLeads]);

	// Handle filter changes
	const handleFilterChange = (key: string, value: string | boolean) => {
		setFilters(prev => ({ ...prev, [key]: value }));
		setPage(1);
	};

	// Handle view timeline
	const handleViewTimeline = (lead: TrackingLead) => {
		setSelectedContact(lead);
		setTimelineModalVisible(true);
	};

	// Handle log outreach
	const handleLogOutreach = (lead: TrackingLead) => {
		setSelectedContact(lead);
		setOutreachModalVisible(true);
	};

	// Handle outreach logged
	const handleOutreachLogged = () => {
		setSnackbar({
			open: true,
			message: 'Outreach logged successfully',
			type: 'success',
		});
		setOutreachModalVisible(false);
		setSelectedContact(null);
		fetchLeads(); // Refresh list
	};

	// Format date helper
	const formatDate = (dateString: string | null | undefined): string => {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	};

	const formatDateTime = (dateString: string | null | undefined): string => {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	};

	// Table columns
	const columns: TableColumn<Record<string, unknown>>[] = useMemo(
		() => [
			{
				key: 'serial',
				title: '#',
				sortable: false,
				align: 'center',
				render: (_value: unknown, _record: Record<string, unknown>, index: number) => (
					<div className='font-semibold text-gray-600 text-center'>
						{(page - 1) * limit + index + 1}
					</div>
				),
			},
			{
				key: 'lead',
				title: 'Lead',
				sortable: true,
				align: 'left',
				render: (_value: unknown, record: Record<string, unknown>) => {
					const lead = record as unknown as TrackingLead;
					return (
						<div>
							<div className='font-semibold text-gray-900'>{lead.full_name}</div>
							{lead.job_title && (
								<div className='text-sm text-gray-500'>{lead.job_title}</div>
							)}
						</div>
					);
				},
			},
			{
				key: 'company',
				title: 'Company',
				sortable: true,
				align: 'left',
				render: (value: unknown) => (
					<div className='text-gray-700'>{String(value || '')}</div>
				),
			},
			{
				key: 'status',
				title: 'Status',
				sortable: true,
				align: 'center',
				render: (_value: unknown, record: Record<string, unknown>) => {
					const lead = record as unknown as TrackingLead;
					return (
						<div className='flex justify-center'>
							<StatusBadge status={lead.current_status} />
						</div>
					);
				},
			},
			{
				key: 'last_contact',
				title: 'Last Contact',
				sortable: true,
				align: 'center',
				render: (_value: unknown, record: Record<string, unknown>) => {
					const lead = record as unknown as TrackingLead;
					return (
						<div className='text-sm text-gray-700'>
							{formatDate(lead.last_outreach_date)}
							{lead.last_outreach_type && (
								<div className='text-xs text-gray-500 mt-1'>
									{lead.last_outreach_type}
								</div>
							)}
						</div>
					);
				},
			},
			{
				key: 'next_callback',
				title: 'Next Callback',
				sortable: false,
				align: 'center',
				render: (_value: unknown, record: Record<string, unknown>) => {
					const lead = record as unknown as TrackingLead;
					if (!lead.next_callback_at) return <div className='text-gray-400'>-</div>;
					return (
						<div className='text-sm text-gray-700'>
							<div className='flex items-center gap-1 text-blue-600'>
								<Calendar className='w-4 h-4' />
								{formatDateTime(lead.next_callback_at)}
							</div>
						</div>
					);
				},
			},
			{
				key: 'outreach_count',
				title: 'Outreach',
				sortable: false,
				align: 'center',
				render: (_value: unknown, record: Record<string, unknown>) => {
					const lead = record as unknown as TrackingLead;
					return (
						<div className='text-sm text-gray-700'>
							<div>Total: {lead.total_outreach_count}</div>
							<div className='text-xs text-gray-500'>
								📧 {lead.email_count} | ☎ {lead.phone_count}
							</div>
						</div>
					);
				},
			},
			{
				key: 'assigned_to',
				title: 'Assigned To',
				sortable: true,
				align: 'center',
				render: (_value: unknown, record: Record<string, unknown>) => {
					const lead = record as unknown as TrackingLead;
					return (
						<div className='text-sm text-gray-700'>
							{lead.assigned_to?.name || '-'}
						</div>
					);
				},
			},
			{
				key: 'actions',
				title: 'Actions',
				sortable: false,
				align: 'center',
				render: (_value: unknown, record: Record<string, unknown>) => {
					const lead = record as unknown as TrackingLead;
					return (
						<div className='flex items-center justify-center gap-2'>
							<button
								onClick={() => handleViewTimeline(lead)}
								className='p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors'
								title='View History'
							>
								<History className='w-4 h-4' />
							</button>
							<button
								onClick={() => handleLogOutreach(lead)}
								className='p-2 text-green-600 hover:bg-green-50 rounded transition-colors'
								title='Log Outreach'
							>
								<Phone className='w-4 h-4' />
							</button>
						</div>
					);
				},
			},
		],
		[page, limit]
	);

	return (
		<div className='min-h-screen bg-gray-50 p-6'>
			<div className='max-w-7xl mx-auto'>
				{/* Header */}
				<div className='flex items-center justify-between mb-6'>
					<PageHeader
						title='My Leads'
						totalItems={totalItems}
						itemType='tracked leads'
						icon='📋'
					/>
				</div>

				{/* Filters */}
				<div className='bg-white p-4 rounded-lg shadow-sm mb-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
						<FloatingInput
							label='Search'
							value={filters.search}
							onChange={value => handleFilterChange('search', value)}
							placeholder='Search name, company, email...'
						/>
						<FloatingDropdown
							label='Status'
							value={filters.status_id}
							onChange={value => handleFilterChange('status_id', value)}
							options={[
								{ value: '', label: 'All Statuses' },
								...statuses.map(s => ({
									value: s.id.toString(),
									label: s.status_name,
								})),
							]}
							disabled={loadingStatuses}
						/>
						<FloatingDropdown
							label='Assigned To'
							value={filters.assigned_to}
							onChange={value => handleFilterChange('assigned_to', value)}
							options={[
								{ value: '', label: 'All Users' },
								// TODO: Fetch users from API when available
								// For now, users will be populated from the leads data
							]}
						/>
						<div className='flex items-center'>
							<label className='flex items-center gap-2 cursor-pointer'>
								<input
									type='checkbox'
									checked={filters.has_callback}
									onChange={e => handleFilterChange('has_callback', e.target.checked)}
									className='w-4 h-4 text-blue-600 rounded'
								/>
								<span className='text-sm text-gray-700'>Has Scheduled Callback</span>
							</label>
						</div>
						<Button
							onClick={() => {
								setFilters({
									assigned_to: '',
									status_id: '',
									has_callback: false,
									search: '',
								});
								setPage(1);
							}}
							variant='outline'
							className='h-10'
						>
							Clear Filters
						</Button>
					</div>
				</div>

				{/* Table */}
				{loading ? (
					<TableSkeleton rows={10} columns={9} />
				) : (
					<>
						<div className='bg-white rounded-lg shadow-sm overflow-hidden'>
							<Table
								columns={columns}
								data={leads as unknown as Record<string, unknown>[]}
								loading={loading}
								emptyText='No tracked leads found.'
							/>
						</div>

						{totalPages > 0 && (
							<Pagination
								currentPage={page}
								totalPages={totalPages}
								totalItems={totalItems}
								itemsPerPage={limit}
								onPageChange={setPage}
								onItemsPerPageChange={newLimit => {
									setLimit(newLimit);
									setPage(1);
								}}
								className='mt-4'
							/>
						)}
					</>
				)}

				{/* Modals */}
				{outreachModalVisible && selectedContact && (
					<OutreachLogModal
						open={outreachModalVisible}
						contactId={selectedContact.contact_id}
						contactName={selectedContact.full_name}
						onClose={() => {
							setOutreachModalVisible(false);
							setSelectedContact(null);
						}}
						onSuccess={handleOutreachLogged}
					/>
				)}

				{timelineModalVisible && selectedContact && (
					<ContactTimelineModal
						open={timelineModalVisible}
						contactId={selectedContact.contact_id}
						onClose={() => {
							setTimelineModalVisible(false);
							setSelectedContact(null);
						}}
					/>
				)}

				<Snackbar
					message={snackbar.message}
					type={snackbar.type}
					open={snackbar.open}
					onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
				/>
			</div>
		</div>
	);
};
