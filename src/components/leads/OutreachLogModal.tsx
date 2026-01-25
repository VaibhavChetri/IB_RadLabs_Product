/**
 * OutreachLogModal Component
 * Modal to log outreach attempts with status updates
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button, FloatingDropdown } from '@/components/ui';
import { Textarea } from '@/components/ui/Input';
import { LeadApiService, OutreachStatus, LogOutreachRequest } from '@/services/leadApi';

export interface OutreachLogModalProps {
	open: boolean;
	contactId: string;
	contactName: string;
	onClose: () => void;
	onSuccess: () => void;
}

// Helper functions for datetime-local conversion
// datetime-local inputs work in local time, but we store ISO strings (UTC)
// These helpers properly convert between local time and ISO format

/**
 * Convert ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
 * This preserves the local time representation
 */
const isoToLocalDateTime = (isoString: string): string => {
	const date = new Date(isoString);
	// Get local date/time components
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convert datetime-local value (YYYY-MM-DDTHH:mm) to MySQL datetime format
 * Treats the input as local time and converts to MySQL format (YYYY-MM-DD HH:mm:ss)
 */
const localDateTimeToMySQL = (localDateTime: string): string => {
	if (!localDateTime) return '';
	// Create a date object treating the input as local time
	const date = new Date(localDateTime);
	// Format as MySQL datetime: YYYY-MM-DD HH:mm:ss
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Convert ISO string to MySQL datetime format
 * Used when we have an ISO string stored and need to send to API
 */
const isoToMySQL = (isoString: string): string => {
	if (!isoString) return '';
	const date = new Date(isoString);
	// Format as MySQL datetime: YYYY-MM-DD HH:mm:ss
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const OutreachLogModal: React.FC<OutreachLogModalProps> = ({
	open,
	contactId,
	contactName,
	onClose,
	onSuccess,
}) => {
	const [formData, setFormData] = useState<LogOutreachRequest>({
		contact_id: contactId,
		outreach_type: 'phone',
		status_id: 0,
		notes: '',
		callback_scheduled_at: undefined,
	});
	const [statuses, setStatuses] = useState<OutreachStatus[]>([]);
	const [loadingStatuses, setLoadingStatuses] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load statuses when modal opens
	useEffect(() => {
		if (open) {
			loadStatuses();
		}
	}, [open]);

	const loadStatuses = async () => {
		setLoadingStatuses(true);
		try {
			const response = await LeadApiService.getStatuses(true);
			
			// Handle both success: true and status_code: 200 response formats
			const responseAny = response as { success?: boolean; status_code?: number; data?: OutreachStatus[]; message?: string };
			const isSuccess = responseAny.success === true || responseAny.status_code === 200;
			const statusesData = responseAny.data || (response as { data?: OutreachStatus[] }).data;
			
			if (isSuccess && statusesData && statusesData.length > 0) {
				setStatuses(statusesData);
			} else {
				throw new Error(responseAny.message || 'Failed to load statuses');
			}
		} catch (error: any) {
			console.error('Failed to load statuses:', error);
			console.error('Error status:', error.response?.status);
			console.error('Error response:', error.response);
			
			// Use fallback mock statuses if API fails (don't show error for status dropdown)
			const fallbackStatuses: OutreachStatus[] = [
				{ id: 1, status_name: 'Not Contacted Yet', status_category: 'pending', requires_callback: false, status_color: '#9CA3AF', status_order: 1 },
				{ id: 5, status_name: 'Call Later', status_category: 'follow_up', requires_callback: true, status_color: '#60A5FA', status_order: 5 },
				{ id: 7, status_name: 'Meeting Scheduled', status_category: 'positive', requires_callback: false, status_color: '#34D399', status_order: 7 },
				{ id: 8, status_name: 'Interested - Follow Up', status_category: 'positive', requires_callback: false, status_color: '#34D399', status_order: 8 },
			];
			
			setStatuses(fallbackStatuses);
			
			// Only show error if it's not an auth error (auth errors will redirect anyway)
			if (error.response?.status !== 401 && error.response?.status !== 403) {
				console.warn('Using fallback statuses due to API error');
			}
		} finally {
			setLoadingStatuses(false);
		}
	};

	// Get selected status
	const selectedStatus = statuses.find(s => s.id === formData.status_id);

	// Handle status change
	const handleStatusChange = (statusId: string) => {
		const statusIdNum = parseInt(statusId);
		setFormData(prev => ({
			...prev,
			status_id: statusIdNum,
			// Clear callback if status doesn't require it
			callback_scheduled_at: statuses.find(s => s.id === statusIdNum)?.requires_callback
				? prev.callback_scheduled_at
				: undefined,
		}));
	};

	// Validate form
	const validateForm = (): boolean => {
		if (!formData.status_id) {
			setError('Please select a status');
			return false;
		}

		if (selectedStatus?.requires_callback && !formData.callback_scheduled_at) {
			setError('Callback date/time is required for this status');
			return false;
		}

		// Validate callback is in future
		if (formData.callback_scheduled_at) {
			const callbackDate = new Date(formData.callback_scheduled_at);
			if (callbackDate <= new Date()) {
				setError('Callback date/time must be in the future');
				return false;
			}
		}

		return true;
	};

	// Handle submit - SIMPLIFIED: Just call API and log response
	const handleSubmit = async (e: React.FormEvent) => {
		// #region agent log
		fetch('http://127.0.0.1:7246/ingest/e3cfb356-6081-44f1-8554-1f32b413ba8e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OutreachLogModal.tsx:126',message:'handleSubmit ENTRY',data:{hasEvent:!!e,formData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
		// #endregion
		
		e.preventDefault();
		setError(null);

		if (!validateForm()) {
			// #region agent log
			fetch('http://127.0.0.1:7246/ingest/e3cfb356-6081-44f1-8554-1f32b413ba8e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OutreachLogModal.tsx:132',message:'handleSubmit VALIDATION FAILED',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
			// #endregion
			return;
		}

		setSubmitting(true);
		
		// Prepare payload - remove undefined fields
		const payload: LogOutreachRequest = {
			contact_id: formData.contact_id,
			outreach_type: formData.outreach_type,
			status_id: formData.status_id,
		};
		
		// Only add optional fields if they have values
		if (formData.notes && formData.notes.trim()) {
			payload.notes = formData.notes.trim();
		}
		if (formData.callback_scheduled_at) {
			// Convert ISO string to MySQL datetime format (YYYY-MM-DD HH:mm:ss)
			payload.callback_scheduled_at = isoToMySQL(formData.callback_scheduled_at);
		}
		
		// #region agent log
		fetch('http://127.0.0.1:7246/ingest/e3cfb356-6081-44f1-8554-1f32b413ba8e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OutreachLogModal.tsx:150',message:'BEFORE API CALL',data:{payload},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
		// #endregion
		
		console.log('=== LOG OUTREACH API CALL ===');
		console.log('Payload being sent:', JSON.stringify(payload, null, 2));
		
		try {
			const response = await LeadApiService.logOutreach(payload);
			
			// #region agent log
			fetch('http://127.0.0.1:7246/ingest/e3cfb356-6081-44f1-8554-1f32b413ba8e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OutreachLogModal.tsx:166',message:'API CALL SUCCESS',data:{hasResponse:!!response,statusCode:response.status_code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
			// #endregion
			
			// Handle both success: true and status_code: 200/201 response formats
			const responseAny = response as { success?: boolean; status_code?: number; message?: string };
			const isSuccess = responseAny.success === true || responseAny.status_code === 200 || responseAny.status_code === 201;
			
			if (isSuccess) {
				// Success - refresh data and close modal
				onSuccess();
				onClose();
			} else {
				throw new Error(responseAny.message || 'Failed to log outreach');
			}
			
		} catch (error: any) {
			// #region agent log
			fetch('http://127.0.0.1:7246/ingest/e3cfb356-6081-44f1-8554-1f32b413ba8e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OutreachLogModal.tsx:180',message:'API CALL ERROR',data:{errorStatus:error?.response?.status,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
			// #endregion
			
			// Extract error message
			let errorMessage = 'Failed to log outreach';
			if (error.response?.data?.message) {
				errorMessage = error.response.data.message;
			} else if (error.message) {
				errorMessage = error.message;
			}
			
			setError(errorMessage);
		} finally {
			setSubmitting(false);
		}
	};

	// Reset form when modal closes
	useEffect(() => {
		if (!open) {
			setFormData({
				contact_id: contactId,
				outreach_type: 'phone',
				status_id: 0,
				notes: '',
				callback_scheduled_at: undefined,
			});
			setError(null);
		}
	}, [open, contactId]);

	if (!open) return null;

	return (
		<div
			className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'
			onClick={onClose}
		>
			<div
				className='bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'
				onClick={e => e.stopPropagation()}
			>
				<div className='flex items-center justify-between mb-6'>
					<h3 className='text-xl font-semibold text-gray-900'>
						Log Outreach - {contactName}
					</h3>
					<button onClick={onClose} className='p-1 hover:bg-gray-100 rounded transition-colors'>
						<X className='w-5 h-5 text-gray-500' />
					</button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<FloatingDropdown
						label='Outreach Type'
						value={formData.outreach_type}
						onChange={value => setFormData(prev => ({ ...prev, outreach_type: value as any }))}
						options={[
							{ value: 'email', label: 'Email' },
							{ value: 'phone', label: 'Phone' },
							{ value: 'both', label: 'Both' },
							{ value: 'meeting', label: 'Meeting' },
							{ value: 'other', label: 'Other' },
						]}
						required
					/>

					<FloatingDropdown
						label='Status'
						value={formData.status_id.toString()}
						onChange={handleStatusChange}
						options={[
							{ value: '0', label: 'Select Status' },
							...statuses.map(s => ({
								value: s.id.toString(),
								label: s.status_name,
							})),
						]}
						loading={loadingStatuses}
						required
					/>

					<div>
						<Textarea
							label='Notes'
							value={formData.notes}
							onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
							rows={4}
							placeholder='Add notes about this outreach attempt...'
						/>
					</div>

					{selectedStatus?.requires_callback && (
						<div>
							<input
								type='datetime-local'
								value={
									formData.callback_scheduled_at
										? isoToLocalDateTime(formData.callback_scheduled_at)
										: ''
								}
								onChange={e => {
									const value = e.target.value;
									// #region agent log
									fetch('http://127.0.0.1:7246/ingest/e3cfb356-6081-44f1-8554-1f32b413ba8e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OutreachLogModal.tsx:318',message:'DATETIME INPUT CHANGE',data:{localValue:value,mysqlValue:value?localDateTimeToMySQL(value):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
									// #endregion
									// Store as ISO string internally for consistency, but convert to MySQL format when sending to API
									if (value) {
										const date = new Date(value);
										setFormData(prev => ({
											...prev,
											callback_scheduled_at: date.toISOString(),
										}));
									} else {
										setFormData(prev => ({
											...prev,
											callback_scheduled_at: undefined,
										}));
									}
								}}
								className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
								required
							/>
							<label className='block text-sm font-medium text-gray-700 mt-1 mb-2'>
								Callback Date & Time <span className='text-red-500'>*</span>
							</label>
						</div>
					)}

					{error && (
						<div className='bg-red-50 border border-red-200 rounded-lg p-3'>
							<div className='text-red-800 text-sm font-medium'>{error}</div>
						</div>
					)}

					<div className='flex justify-end space-x-3 mt-6'>
						<Button type='button' variant='outline' onClick={onClose} disabled={submitting}>
							Cancel
						</Button>
						<Button type='submit' disabled={submitting} variant='primary'>
							{submitting ? 'Logging...' : 'Log Outreach'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};
