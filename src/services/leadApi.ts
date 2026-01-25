/**
 * Lead Tracking API Service
 * Handles all API calls related to lead tracking, outreach, and callbacks
 * Based on 02_BACKEND_APIS.md specifications
 */

import { apiService, ApiResponse } from './api';

// ============================================================================
// Types
// ============================================================================

export interface RevealContactRequest {
	contact_id: string;
	reveal_type: 'email' | 'phone' | 'both';
}

export interface RevealContactResponse {
	contact_id: string;
	email?: string | null;
	phone?: string | null;
	credits_used: number;
	remaining_credits?: number;
	already_revealed?: boolean;
}

export interface BulkRevealRequest {
	contact_ids: string[];
	reveal_type: 'email' | 'phone' | 'both';
}

export interface BulkRevealResponse {
	total_requested: number;
	total_revealed: number;
	total_failed: number;
	credits_used: number;
	remaining_credits: number;
	results: Array<{
		contact_id: string;
		success: boolean;
		email?: string;
		phone?: string;
		error?: string;
	}>;
}

export interface CanTrackResponse {
	can_track: boolean;
	reason: string | null;
	has_email: boolean;
	has_phone: boolean;
	is_tracking: boolean;
}

export interface StartTrackingRequest {
	contact_id: string;
	assign_to?: number;
}

export interface StartTrackingResponse {
	contact_id: string;
	is_tracking: boolean;
	tracking_started_at: string;
	assigned_to: number;
}

export interface BulkStartTrackingRequest {
	contact_ids: string[];
	assign_to?: number;
}

export interface BulkStartTrackingResponse {
	total_requested: number;
	total_tracked: number;
	total_failed: number;
	results: Array<{
		contact_id: string;
		success: boolean;
		reason?: string;
	}>;
}

export interface StopTrackingRequest {
	contact_id: string;
	reason?: string;
}

export interface OutreachStatus {
	id: number;
	status_name: string;
	status_category: 'pending' | 'positive' | 'negative' | 'follow_up' | 'converted';
	requires_callback: boolean;
	status_color: string;
	status_order: number;
}

export interface LogOutreachRequest {
	contact_id: string;
	outreach_type: 'email' | 'phone' | 'both' | 'meeting' | 'other';
	status_id: number;
	notes?: string;
	callback_scheduled_at?: string;
}

export interface LogOutreachResponse {
	outreach_id: number;
	contact_id: string;
	status_name: string;
	callback_scheduled_at?: string | null;
}

export interface UpdateOutreachRequest {
	callback_completed?: boolean;
	notes?: string;
}

export interface Callback {
	outreach_id: number;
	contact_id: string;
	contact_name: string;
	company_name: string;
	job_title?: string;
	phone?: string;
	email?: string;
	callback_scheduled_at: string;
	is_overdue: boolean;
	status_name: string;
	last_notes?: string;
	assigned_to_name?: string;
}

export interface TodaysCallbacksResponse {
	today_count: number;
	overdue_count: number;
	callbacks: Callback[];
}

export interface TrackingLead {
	contact_id: string;
	full_name: string;
	job_title?: string;
	company_name: string;
	company_id?: string;
	email?: string;
	phone?: string;
	location?: string;
	tracking_started_at: string;
	last_outreach_date?: string | null;
	last_outreach_type?: 'email' | 'phone' | 'both' | 'meeting' | 'other' | null;
	current_status: {
		id: number;
		status_name: string;
		status_color: string;
		status_category: string;
	};
	total_outreach_count: number;
	email_count: number;
	phone_count: number;
	next_callback_at?: string | null;
	assigned_to?: {
		id: number;
		name: string;
	};
	is_active: boolean;
}

export interface TrackingListResponse {
	current_page: number;
	per_page: number;
	total: number;
	total_pages: number;
	contacts: TrackingLead[];
}

export interface TimelineEntry {
	id: number;
	outreach_type: 'email' | 'phone' | 'both' | 'meeting' | 'other';
	outreach_date: string;
	status_name: string;
	status_color?: string; // Optional - may not be in API response
	notes?: string | null;
	callback_scheduled_at?: string | null;
	callback_completed?: number | boolean | null; // API returns 0/1, but can be boolean
	performed_by: number; // API returns number (user ID)
	performed_by_name: string; // API returns name as separate field
}

export interface ContactTimelineResponse {
	contact: {
		contact_id: string;
		full_name: string;
		job_title?: string;
		company_name: string;
		email?: string;
		phone?: string;
	};
	summary: {
		tracking_started_at: string;
		total_outreach_count: number;
		email_count: number;
		phone_count: number;
		current_status: string;
	};
	timeline: TimelineEntry[];
}

export interface ReportsSummary {
	total_tracked: number;
	active_leads: number;
	inactive_leads: number;
	total_outreach_attempts: number;
	avg_outreach_per_lead: number;
}

export interface StatusDistribution {
	status_name: string;
	status_category: string;
	status_color: string;
	count: number;
	percentage: number;
}

export interface OutreachByType {
	email: number;
	phone: number;
	both: number;
	meeting: number;
}

export interface UserPerformance {
	user_id: number;
	user_name: string;
	contacts_tracked: number;
	total_outreach: number;
	positive_responses: number;
	conversion_rate: number;
}

export interface CallbackMetrics {
	total_scheduled: number;
	completed: number;
	pending: number;
	overdue: number;
	completion_rate: number;
}

export interface ReportsResponse {
	summary: ReportsSummary;
	status_distribution: StatusDistribution[];
	outreach_by_type: OutreachByType;
	user_performance: UserPerformance[];
	callback_metrics: CallbackMetrics;
}

// ============================================================================
// API Service Class
// ============================================================================

export class LeadApiService {
	private static readonly BASE_PATH = '/leads';

	/**
	 * Reveal Contact (Single) - Uses Lusha endpoint with camelCase
	 * POST /api/lusha/reveal
	 * Note: For 'both', we'll need to handle it differently or make two calls
	 */
	static async revealContact(
		contactId: string,
		revealType: 'email' | 'phone' | 'both'
	): Promise<ApiResponse<RevealContactResponse>> {
		// Single reveal uses Lusha endpoint with camelCase
		// For 'both', we need to make two separate calls or use a different approach
		if (revealType === 'both') {
			// For 'both', we'll reveal email first, then phone
			// This is a workaround since the Lusha endpoint doesn't support 'both' directly
			const emailResponse = await apiService.post('/lusha/reveal', {
				contactId: contactId,
				revealType: 'email',
			});
			
			const phoneResponse = await apiService.post('/lusha/reveal', {
				contactId: contactId,
				revealType: 'phone',
			});

			// Combine responses
			return {
				status: emailResponse.status || 'Success',
				status_code: emailResponse.status_code || 200,
				message: emailResponse.message || null,
				data: {
					contact_id: contactId,
					email: emailResponse.data?.email || null,
					phone: phoneResponse.data?.phone || null,
					credits_used: (emailResponse.data?.creditsUsed || 0) + (phoneResponse.data?.creditsUsed || 0),
					already_revealed: emailResponse.data?.alreadyRevealed || false,
				},
			} as ApiResponse<RevealContactResponse>;
		}

		// For single type, use camelCase as per Lusha API
		return apiService.post('/lusha/reveal', {
			contactId: contactId,
			revealType: revealType,
		});
	}

	/**
	 * Bulk Reveal Contacts
	 * POST /api/lusha/reveal/bulk
	 */
	static async bulkReveal(
		contactIds: string[],
		revealType: 'email' | 'phone' | 'both'
	): Promise<ApiResponse<BulkRevealResponse>> {
		return apiService.post('/lusha/reveal/bulk', {
			contact_ids: contactIds,
			reveal_type: revealType,
		});
	}

	/**
	 * Check if Can Track
	 * GET /api/leads/can-track/{contact_id}
	 */
	static async canTrack(contactId: string): Promise<ApiResponse<CanTrackResponse>> {
		return apiService.get(`${this.BASE_PATH}/can-track/${contactId}`);
	}

	/**
	 * Start Tracking (Single)
	 * POST /api/leads/start-tracking
	 */
	static async startTracking(
		contactId: string,
		assignTo?: number
	): Promise<ApiResponse<StartTrackingResponse>> {
		return apiService.post(`${this.BASE_PATH}/start-tracking`, {
			contact_id: contactId,
			assign_to: assignTo,
		});
	}

	/**
	 * Start Tracking (Bulk)
	 * POST /api/leads/start-tracking/bulk
	 */
	static async bulkStartTracking(
		contactIds: string[],
		assignTo?: number
	): Promise<ApiResponse<BulkStartTrackingResponse>> {
		return apiService.post(`${this.BASE_PATH}/start-tracking/bulk`, {
			contact_ids: contactIds,
			assign_to: assignTo,
		});
	}

	/**
	 * Stop Tracking
	 * POST /api/leads/stop-tracking
	 */
	static async stopTracking(
		contactId: string,
		reason?: string
	): Promise<ApiResponse<{ message: string }>> {
		return apiService.post(`${this.BASE_PATH}/stop-tracking`, {
			contact_id: contactId,
			reason: reason,
		});
	}

	/**
	 * Get Outreach Statuses
	 * GET /api/leads/statuses
	 */
	static async getStatuses(activeOnly: boolean = true): Promise<ApiResponse<OutreachStatus[]>> {
		return apiService.get(`${this.BASE_PATH}/statuses`, {
			params: { active_only: activeOnly },
		});
	}

	/**
	 * Log Outreach Attempt
	 * POST /api/leads/log-outreach
	 */
	static async logOutreach(
		data: LogOutreachRequest
	): Promise<ApiResponse<LogOutreachResponse>> {
		// Prevent redirect - just make API call and stop
		return apiService.post(`${this.BASE_PATH}/log-outreach`, data, {
			skipAuthRedirect: true,
		} as any);
	}

	/**
	 * Update Outreach Entry
	 * PUT /api/leads/outreach/{id}
	 */
	static async updateOutreach(
		outreachId: number,
		data: UpdateOutreachRequest
	): Promise<ApiResponse<{ message: string }>> {
		return apiService.put(`${this.BASE_PATH}/outreach/${outreachId}`, data);
	}

	/**
	 * Get Today's Callbacks
	 * GET /api/leads/callbacks/today
	 */
	static async getTodaysCallbacks(
		userId?: number,
		includeOverdue: boolean = true
	): Promise<ApiResponse<TodaysCallbacksResponse>> {
		return apiService.get(`${this.BASE_PATH}/callbacks/today`, {
			params: {
				user_id: userId,
				include_overdue: includeOverdue,
			},
		});
	}

	/**
	 * Complete Callback
	 * POST /api/leads/callbacks/{outreach_id}/complete
	 */
	static async completeCallback(
		outreachId: number,
		notes?: string
	): Promise<ApiResponse<{ message: string }>> {
		return apiService.post(`${this.BASE_PATH}/callbacks/${outreachId}/complete`, {
			notes: notes,
		});
	}

	/**
	 * Get Tracking List
	 * GET /api/leads/tracking
	 */
	static async getTrackingList(
		filters: {
			assigned_to?: number;
			status_id?: number;
			status_category?: string;
			has_callback?: boolean;
			search?: string;
		} = {},
		page: number = 1,
		perPage: number = 25
	): Promise<ApiResponse<TrackingListResponse>> {
		return apiService.get(`${this.BASE_PATH}/tracking`, {
			params: {
				...filters,
				page,
				per_page: perPage,
			},
		});
	}

	/**
	 * Get Contact Timeline
	 * GET /api/leads/{contact_id}/timeline
	 */
	static async getContactTimeline(
		contactId: string
	): Promise<ApiResponse<ContactTimelineResponse>> {
		return apiService.get(`${this.BASE_PATH}/${contactId}/timeline`);
	}

	/**
	 * Get Reports Data
	 * GET /api/leads/reports
	 */
	static async getReports(filters: {
		user_id?: number;
		date_from?: string;
		date_to?: string;
	} = {}): Promise<ApiResponse<ReportsResponse>> {
		return apiService.get(`${this.BASE_PATH}/reports`, {
			params: filters,
		});
	}
}
