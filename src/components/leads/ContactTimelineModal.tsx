/**
 * ContactTimelineModal Component
 * Modal showing complete outreach history for a contact
 */

import React, { useState, useEffect } from 'react';
import { X, Phone, Mail, Calendar, User } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { LeadApiService, ContactTimelineResponse, TimelineEntry } from '@/services/leadApi';

export interface ContactTimelineModalProps {
	open: boolean;
	contactId: string;
	onClose: () => void;
}

// Helper to get status color from status name (default colors)
const getStatusColor = (statusName: string): string => {
	const colorMap: Record<string, string> = {
		'Proposal Sent': '#34D399',
		'Call Later': '#60A5FA',
		'Email Bounced': '#EF4444',
		'Phone Not Reachable': '#F59E0B',
		'Interested - Follow Up': '#34D399',
		'Meeting Scheduled': '#34D399',
		'Not Contacted Yet': '#9CA3AF',
	};
	return colorMap[statusName] || '#9CA3AF'; // Default gray
};

export const ContactTimelineModal: React.FC<ContactTimelineModalProps> = ({
	open,
	contactId,
	onClose,
}) => {
	const [loading, setLoading] = useState(false);
	const [timelineData, setTimelineData] = useState<ContactTimelineResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Load timeline when modal opens
	useEffect(() => {
		if (open && contactId) {
			loadTimeline();
		}
	}, [open, contactId]);

	const loadTimeline = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await LeadApiService.getContactTimeline(contactId);
			
			// Handle both success: true and status_code: 200 response formats
			const responseAny = response as { success?: boolean; status_code?: number; data?: any; message?: string };
			const isSuccess = responseAny.success === true || responseAny.status_code === 200;
			const apiData = responseAny.data || (response as { data?: any }).data;
			
			if (isSuccess && apiData) {
				// Transform API response to match component's expected structure
				const transformedData: ContactTimelineResponse = {
					contact: apiData.contact || {},
					summary: apiData.summary || {},
					timeline: (apiData.timeline || []).map((entry: any) => ({
						id: entry.id,
						outreach_type: entry.outreach_type,
						outreach_date: entry.outreach_date,
						status_name: entry.status_name,
						status_color: entry.status_color || getStatusColor(entry.status_name),
						notes: entry.notes || null,
						callback_scheduled_at: entry.callback_scheduled_at || null,
						callback_completed: entry.callback_completed === 1 || entry.callback_completed === true,
						performed_by: typeof entry.performed_by === 'object' 
							? entry.performed_by.id 
							: entry.performed_by,
						performed_by_name: entry.performed_by_name || (typeof entry.performed_by === 'object' ? entry.performed_by.name : 'Unknown'),
					})),
				};
				setTimelineData(transformedData);
			} else {
				throw new Error(responseAny.message || 'Failed to load timeline');
			}
		} catch (error: any) {
			console.error('Failed to load timeline:', error);
			setError(error.response?.data?.message || error.message || 'Failed to load contact history');
			setTimelineData(null);
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	};

	const getOutreachIcon = (type: string) => {
		switch (type) {
			case 'email':
				return <Mail className='w-4 h-4' />;
			case 'phone':
				return <Phone className='w-4 h-4' />;
			case 'meeting':
				return <Calendar className='w-4 h-4' />;
			default:
				return <User className='w-4 h-4' />;
		}
	};

	if (!open) return null;

	return (
		<div
			className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'
			onClick={onClose}
		>
			<div
				className='bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto'
				onClick={e => e.stopPropagation()}
			>
				<div className='flex items-center justify-between mb-6 pb-4 border-b border-gray-200'>
					<h3 className='text-xl font-semibold text-gray-900'>
						Contact History - {timelineData?.contact.full_name || 'Loading...'}
					</h3>
					<button
						onClick={onClose}
						className='p-2 hover:bg-red-50 rounded-lg transition-colors group'
						title='Close'
					>
						<X className='w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors' />
					</button>
				</div>

				{loading ? (
					<div className='text-center py-8'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
						<p className='text-gray-600 mt-2'>Loading timeline...</p>
					</div>
				) : error ? (
					<div className='text-center py-8 text-red-600'>{error}</div>
				) : timelineData ? (
					<div className='space-y-6'>
						{/* Contact Info */}
						<div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100'>
							<div className='grid grid-cols-2 gap-4 text-sm'>
								<div>
									<span className='font-semibold text-gray-700'>Company:</span>{' '}
									<span className='text-gray-900'>{timelineData.contact.company_name}</span>
								</div>
								<div>
									<span className='font-semibold text-gray-700'>Email:</span>{' '}
									<span className='text-gray-900'>{timelineData.contact.email || '-'}</span>
								</div>
								<div>
									<span className='font-semibold text-gray-700'>Phone:</span>{' '}
									<span className='text-gray-900'>{timelineData.contact.phone || '-'}</span>
								</div>
								<div>
									<span className='font-semibold text-gray-700'>Total Outreach:</span>{' '}
									<span className='text-blue-600 font-bold'>{timelineData.summary.total_outreach_count}</span>
								</div>
							</div>
						</div>

						{/* Timeline */}
						<div className='space-y-4'>
							<h4 className='font-semibold text-gray-900 mb-4'>Outreach History</h4>
							{timelineData.timeline.map((entry: TimelineEntry) => (
								<div key={entry.id} className='flex gap-4'>
									{/* Timeline marker */}
									<div className='flex flex-col items-center'>
										<div
											className='w-3 h-3 rounded-full'
											style={{ backgroundColor: entry.status_color || getStatusColor(entry.status_name) }}
										></div>
										<div className='w-0.5 h-full bg-gray-200 mt-1'></div>
									</div>

									{/* Timeline content */}
									<div className='flex-1 bg-white rounded-lg p-4 mb-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
										<div className='flex items-center justify-between mb-3'>
											<div className='flex items-center gap-2'>
												<div className='p-1.5 bg-blue-50 rounded-lg'>
													{getOutreachIcon(entry.outreach_type)}
												</div>
												<span className='text-sm font-semibold text-gray-900 capitalize'>
													{entry.outreach_type}
												</span>
											</div>
											<span className='text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded'>
												{formatDate(entry.outreach_date)}
											</span>
										</div>

										<div className='mb-2'>
											<StatusBadge
												status={{
													status_name: entry.status_name,
													status_color: entry.status_color || getStatusColor(entry.status_name),
												}}
											/>
										</div>

										{entry.notes && (
											<div className='text-sm text-gray-700 mb-2'>{entry.notes}</div>
										)}

										{entry.callback_scheduled_at && (
											<div className='text-xs text-gray-600 flex items-center gap-1'>
												<Calendar className='w-3 h-3' />
												Callback: {formatDate(entry.callback_scheduled_at)}
												{entry.callback_completed && (
													<span className='ml-2 text-green-600'>✓ Completed</span>
												)}
											</div>
										)}

										<div className='text-xs text-gray-500 mt-2'>
											By: {entry.performed_by_name || `User ${entry.performed_by}`}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				) : null}

				<div className='flex justify-end mt-6 pt-4 border-t border-gray-200'>
					<button
						onClick={onClose}
						className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm'
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};
