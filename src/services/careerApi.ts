import { apiService, ApiResponse } from './api';

// Types based on API documentation
export interface JobDescription {
	overview?: string;
	paragraphs?: string[];
	salary?: {
		min?: number;
		max?: number;
		currency?: string;
		period?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
		display?: string;
	};
	requirements?: string[];
	responsibilities?: string[];
	benefits?: string[];
	qualifications?: {
		required?: string[];
		preferred?: string[];
	};
	[key: string]: any; // Additional flexible fields
}

export interface JobListing {
	id: number;
	title: string;
	slug: string;
	department: string | null;
	job_type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
	location: string | null;
	is_remote: boolean;
	is_active: boolean;
	is_featured: boolean;
	published_at: string | null;
	expires_at: string | null;
	description: JobDescription;
	salary_min: number | null;
	salary_max: number | null;
	salary_currency: string;
	experience_level: 'entry' | 'mid' | 'senior' | 'executive' | null;
	application_email: string | null;
	application_url: string | null;
	application_deadline: string | null;
	meta_title: string | null;
	meta_description: string | null;
	meta_keywords: string | null;
	view_count: number;
	application_count: number;
	category_ids: number[];
	category_names: string[];
	created_at: string;
	updated_at: string;
}

export interface CreateJobListingRequest {
	title: string;
	slug?: string; // Optional: auto-generated from title if not provided
	department?: string;
	job_type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
	location?: string;
	is_remote?: boolean;
	is_active?: boolean;
	is_featured?: boolean;
	published_at?: string; // ISO datetime string
	expires_at?: string; // ISO datetime string
	description: JobDescription;
	salary_min?: number;
	salary_max?: number;
	salary_currency?: string;
	experience_level?: 'entry' | 'mid' | 'senior' | 'executive';
	application_email?: string;
	application_url?: string;
	application_deadline?: string; // ISO datetime string
	meta_title?: string;
	meta_description?: string;
	meta_keywords?: string;
	category_ids?: number[];
}

export interface UpdateJobListingRequest extends Partial<CreateJobListingRequest> {}

export interface JobListingFilters {
	page?: number;
	limit?: number;
	is_active?: boolean;
	is_featured?: boolean;
	department?: string;
	job_type?: string;
	location?: string;
	is_remote?: boolean;
	experience_level?: string;
	salary_min?: number;
	salary_max?: number;
	category_id?: number;
	search?: string;
	sort_by?: string;
	sort_order?: 'asc' | 'desc';
}

export interface JobListingsResponse {
	jobs: JobListing[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface Category {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	display_order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface CreateCategoryRequest {
	name: string;
	slug?: string; // Optional: auto-generated from name if not provided
	description?: string;
	display_order?: number;
	is_active?: boolean;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

/**
 * Career Opportunities API Service
 * Handles all API calls related to job listings and categories
 */
export class CareerApiService {
	private static readonly BASE_PATH = '/career';

	/**
	 * Create a new job listing
	 */
	static async createJobListing(
		data: CreateJobListingRequest
	): Promise<ApiResponse<JobListing>> {
		return apiService.post(`${this.BASE_PATH}/opportunities`, data);
	}

	/**
	 * Get all job listings with optional filters
	 */
	static async getJobListings(
		filters?: JobListingFilters
	): Promise<ApiResponse<JobListingsResponse>> {
		return apiService.get(`${this.BASE_PATH}/opportunities`, { params: filters });
	}

	/**
	 * Get job listing by ID
	 */
	static async getJobListingById(id: number): Promise<ApiResponse<JobListing>> {
		return apiService.get(`${this.BASE_PATH}/opportunities/${id}`);
	}

	/**
	 * Get job listing by slug
	 */
	static async getJobListingBySlug(slug: string): Promise<ApiResponse<JobListing>> {
		return apiService.get(`${this.BASE_PATH}/opportunities/slug/${slug}`);
	}

	/**
	 * Update job listing
	 */
	static async updateJobListing(
		id: number,
		data: UpdateJobListingRequest
	): Promise<ApiResponse<JobListing>> {
		return apiService.patch(`${this.BASE_PATH}/opportunities/${id}`, data);
	}

	/**
	 * Delete job listing
	 */
	static async deleteJobListing(id: number): Promise<ApiResponse<{ id: number; message: string }>> {
		return apiService.delete(`${this.BASE_PATH}/opportunities/${id}`);
	}

	/**
	 * Get all categories
	 */
	static async getCategories(includeInactive?: boolean): Promise<ApiResponse<Category[]>> {
		const params = includeInactive ? { include_inactive: true } : {};
		return apiService.get(`${this.BASE_PATH}/categories`, { params });
	}

	/**
	 * Get category by ID
	 */
	static async getCategoryById(id: number): Promise<ApiResponse<Category>> {
		return apiService.get(`${this.BASE_PATH}/categories/${id}`);
	}

	/**
	 * Create a new category
	 */
	static async createCategory(data: CreateCategoryRequest): Promise<ApiResponse<Category>> {
		return apiService.post(`${this.BASE_PATH}/categories`, data);
	}

	/**
	 * Update category
	 */
	static async updateCategory(
		id: number,
		data: UpdateCategoryRequest
	): Promise<ApiResponse<Category>> {
		return apiService.patch(`${this.BASE_PATH}/categories/${id}`, data);
	}

	/**
	 * Delete category
	 */
	static async deleteCategory(id: number): Promise<ApiResponse<{ id: number; message: string }>> {
		return apiService.delete(`${this.BASE_PATH}/categories/${id}`);
	}

	/**
	 * Get filter options (job types, experience levels, departments, locations)
	 * This endpoint provides all dropdown options for forms
	 */
	static async getFilterOptions(): Promise<ApiResponse<{
		jobTypes: Array<{ value: string; label: string }>;
		experienceLevels: Array<{ value: string; label: string }>;
		applicationStatuses: Array<{ value: string; label: string }>;
		departments: Array<{ value: string; label: string }>;
		locations: Array<{ value: string; label: string }>;
	}>> {
		return apiService.get(`${this.BASE_PATH}/filters`);
	}
}
