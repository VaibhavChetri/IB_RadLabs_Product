/**
 * CallbacksList Page - Today's Callbacks
 * Shows all callbacks scheduled for today (and overdue)
 */

import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, Mail, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader, Snackbar, TableSkeleton, Table } from '@/components/ui';
import { TableColumn } from '@/components/ui/DataDisplay';
import { StatusBadge } from '@/components/leads/StatusBadge';
import { LeadApiService, Callback } from '@/services/leadApi';

export const CallbacksList: React.FC = () => {
	const [loading, setLoading] = useState(false);
	const [callbacks, setCallbacks] = useState<Callback[]>([]);
	const [stats, setStats] = useState({ today_count: 0, overdue_count: 0 });
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
		open: false,
		message: '',
		type: 'success',
	});

	// Fetch callbacks from API
	const fetchCallbacks = async () => {
		setLoading(true);
		try {
			const response = await LeadApiService.getTodaysCallbacks(undefined, true);
			
			// Handle both success: true and status_code: 200 response formats
			type ApiResponseFormat = {
				success?: boolean;
				status_code?: number;
				data?: {
					today_count: number;
					overdue_count: number;
					callbacks: Array<{
						outreach_id: number;
						contact_id: string;
						contact_name: string;
						company_name: string;
						job_title?: string | null;
						phone?: string | null;
						email?: string | null;
						callback_scheduled_at: string;
						is_overdue: number; // API returns 0/1
						status_name: string;
						last_notes?: string | null;
						assigned_to_name?: string | null;
					}>;
				};
				message?: string;
			};
			
			const responseAny = response as unknown as ApiResponseFormat;
			const isSuccess = responseAny.success === true || responseAny.status_code === 200;
			const responseData = responseAny.data;
			
			if (isSuccess && responseData && responseData.callbacks) {
				// Transform API response to match Callback interface
				// Convert is_overdue from 0/1 to boolean
				const transformedCallbacks: Callback[] = responseData.callbacks.map(callback => ({
					outreach_id: callback.outreach_id,
					contact_id: callback.contact_id,
					contact_name: callback.contact_name,
					company_name: callback.company_name,
					job_title: callback.job_title || undefined,
					phone: callback.phone || undefined,
					email: callback.email || undefined,
					callback_scheduled_at: callback.callback_scheduled_at,
					is_overdue: callback.is_overdue === 1, // Convert 0/1 to boolean
					status_name: callback.status_name,
					last_notes: callback.last_notes || undefined,
					assigned_to_name: callback.assigned_to_name || undefined,
				}));
				
				setCallbacks(transformedCallbacks);
				setStats({
					today_count: responseData.today_count,
					overdue_count: responseData.overdue_count,
				});
			} else {
				throw new Error(responseAny.message || 'Failed to load callbacks');
			}
		} catch (error: unknown) {
			console.error('Failed to load callbacks:', error);
			const errorMessage = error instanceof Error
				? error.message
				: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load callbacks';
			setSnackbar({
				open: true,
				message: errorMessage,
				type: 'error',
			});
			// Fallback to empty array on error
			setCallbacks([]);
			setStats({ today_count: 0, overdue_count: 0 });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCallbacks();
	}, []);

	// Handle complete callback
	const handleCompleteCallback = async (outreachId: number) => {
		if (!window.confirm('Mark this callback as completed?')) {
			return;
		}

		try {
			const response = await LeadApiService.completeCallback(outreachId);
			
			// Handle both success: true and status_code: 200 response formats
			const responseAny = response as { success?: boolean; status_code?: number; message?: string };
			const isSuccess = responseAny.success === true || responseAny.status_code === 200;
			
			if (isSuccess) {
				// Remove from list
				setCallbacks(prev => prev.filter(c => c.outreach_id !== outreachId));
				// Refresh callbacks to update counts
				await fetchCallbacks();
				setSnackbar({
					open: true,
					message: 'Callback marked as completed',
					type: 'success',
				});
			} else {
				throw new Error(responseAny.message || 'Failed to complete callback');
			}
		} catch (error: unknown) {
			console.error('Failed to complete callback:', error);
			const errorMessage = error instanceof Error
				? error.message
				: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to complete callback';
			setSnackbar({
				open: true,
				message: errorMessage,
				type: 'error',
			});
		}
	};

	const formatTime = (dateString: string): string => {
		// Handle both ISO format and MySQL datetime format (YYYY-MM-DD HH:mm:ss)
		// Replace space with 'T' for ISO-like format if needed
		const isoString = dateString.includes('T') ? dateString : dateString.replace(' ', 'T');
		const date = new Date(isoString);
		return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	};

	// Separate overdue and today
	const overdueCallbacks = callbacks.filter(c => c.is_overdue);
	const todayCallbacks = callbacks.filter(c => !c.is_overdue);

	// Table columns
	const columns: TableColumn<Record<string, unknown>>[] = [
		{
			key: 'time',
			title: 'Time',
			sortable: true,
			align: 'center',
			render: (_value: unknown, record: Record<string, unknown>) => {
				const callback = record as unknown as Callback;
				return (
					<div className='text-sm font-medium text-gray-900'>
						{formatTime(callback.callback_scheduled_at)}
					</div>
				);
			},
		},
		{
			key: 'contact',
			title: 'Contact',
			sortable: true,
			align: 'left',
			render: (_value: unknown, record: Record<string, unknown>) => {
				const callback = record as unknown as Callback;
				return (
					<div>
						<div className='font-semibold text-gray-900'>{callback.contact_name}</div>
						{callback.job_title && (
							<div className='text-sm text-gray-500'>{callback.job_title}</div>
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
			key: 'contact_info',
			title: 'Contact Info',
			sortable: false,
			align: 'center',
			render: (_value: unknown, record: Record<string, unknown>) => {
				const callback = record as unknown as Callback;
				return (
					<div className='flex flex-col gap-1 items-center'>
						{callback.phone && (
							<a
								href={`tel:${callback.phone}`}
								className='flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm'
							>
								<Phone className='w-4 h-4' />
								{callback.phone}
							</a>
						)}
						{callback.email && (
							<a
								href={`mailto:${callback.email}`}
								className='flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm'
							>
								<Mail className='w-4 h-4' />
								Email
							</a>
						)}
					</div>
				);
			},
		},
		{
			key: 'notes',
			title: 'Notes',
			sortable: false,
			align: 'left',
			render: (_value: unknown, record: Record<string, unknown>) => {
				const callback = record as unknown as Callback;
				return (
					<div className='text-sm text-gray-700 max-w-xs truncate'>
						{callback.last_notes || '-'}
					</div>
				);
			},
		},
		{
			key: 'status',
			title: 'Status',
			sortable: false,
			align: 'center',
			render: (_value: unknown, record: Record<string, unknown>) => {
				const callback = record as unknown as Callback;
				return (
					<StatusBadge
						status={{
							status_name: callback.status_name,
							status_color: callback.is_overdue ? '#EF4444' : '#60A5FA',
						}}
					/>
				);
			},
		},
		{
			key: 'actions',
			title: 'Actions',
			sortable: false,
			align: 'center',
			render: (_value: unknown, record: Record<string, unknown>) => {
				const callback = record as unknown as Callback;
				return (
					<div className='flex items-center justify-center gap-2'>
						{callback.phone && (
							<a
								href={`tel:${callback.phone}`}
								className='p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors'
								title='Call Now'
							>
								<PhoneCall className='w-4 h-4' />
							</a>
						)}
						<button
							onClick={() => handleCompleteCallback(callback.outreach_id)}
							className='p-2 text-green-600 hover:bg-green-50 rounded transition-colors'
							title='Mark as Completed'
						>
							<CheckCircle2 className='w-4 h-4' />
						</button>
					</div>
				);
			},
		},
	];

	return (
		<div className='min-h-screen bg-gray-50 p-6'>
			<div className='max-w-7xl mx-auto'>
				{/* Header */}
				<div className='mb-6'>
					<PageHeader
						title="Today's Callbacks"
						totalItems={callbacks.length}
						itemType='callbacks'
						icon='📞'
					/>
				</div>

				{/* Stats Cards */}
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
					<div className='bg-red-50 border border-red-200 rounded-lg p-4'>
						<div className='flex items-center gap-3'>
							<AlertCircle className='w-8 h-8 text-red-600' />
							<div>
								<div className='text-sm font-medium text-red-800'>Overdue Callbacks</div>
								<div className='text-2xl font-bold text-red-900'>{stats.overdue_count}</div>
							</div>
						</div>
					</div>
					<div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
						<div className='flex items-center gap-3'>
							<Calendar className='w-8 h-8 text-blue-600' />
							<div>
								<div className='text-sm font-medium text-blue-800'>Due Today</div>
								<div className='text-2xl font-bold text-blue-900'>{stats.today_count}</div>
							</div>
						</div>
					</div>
				</div>

				{/* Overdue Callbacks */}
				{overdueCallbacks.length > 0 && (
					<div className='mb-6'>
						<h3 className='text-lg font-semibold text-red-900 mb-4 flex items-center gap-2'>
							<AlertCircle className='w-5 h-5' />
							Overdue Callbacks ({overdueCallbacks.length})
						</h3>
						<div className='bg-white rounded-lg shadow-sm overflow-hidden'>
							<Table
								columns={columns}
								data={overdueCallbacks as unknown as Record<string, unknown>[]}
								loading={false}
								emptyText='No overdue callbacks.'
							/>
						</div>
					</div>
				)}

				{/* Today's Callbacks */}
				<div>
					<h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
						<Calendar className='w-5 h-5' />
						Today&apos;s Callbacks ({todayCallbacks.length})
					</h3>
					{loading ? (
						<TableSkeleton rows={5} columns={7} />
					) : (
						<div className='bg-white rounded-lg shadow-sm overflow-hidden'>
							<Table
								columns={columns}
								data={todayCallbacks as unknown as Record<string, unknown>[]}
								loading={loading}
								emptyText='No callbacks scheduled for today.'
							/>
						</div>
					)}
				</div>

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
