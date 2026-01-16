/**
 * Lusha API Service
 * Handles all Lusha prospecting API calls
 */

import { apiService, ApiResponse } from './api';

// Filter Types - Matching actual API response
export interface ContactFilters {
	departments: string[];
	seniority: Array<{ id: number; name: string }>;
	dataPoints: string[];
}

export interface IndustrySubIndustry {
	id: number;
	value: string;
}

export interface Industry {
	main_industry: string;
	sub_industries: IndustrySubIndustry[];
	main_industry_id: number;
}

export interface CompanyFilters {
	industries: Industry[];
	revenues: Array<{ min: number; max?: number }>;
	sizes: Array<{ min: number; max?: number }>;
	intentTopics: string[];
	sic: Array<{ code: string; label: string }>;
	naics: Array<{ code: string; label: string }>;
}

export interface Location {
	country: string;
	state: string;
	city: string;
	[key: string]: unknown;
}

// Search Types
export interface SearchFilters {
	contacts?: {
		include?: {
			departments?: string[];
			seniority?: string[];
			jobTitles?: string[];
			locations?: Location[];
		};
	};
	companies?: {
		include?: {
			industries?: string[];
			companyNames?: string[];
			technologies?: string[];
		};
	};
}

export interface SearchRequest {
	filters: SearchFilters;
	pages: { page: number; size: number };
}

export interface ContactResult {
	contactId: string;
	name: string;
	companyName: string;
	jobTitle: string;
	location?: string;
	emailAddresses?: string[];
	phoneNumbers?: string[];
	// Direct email/phone fields (from reveal response)
	email?: string;
	phone?: string;
	// Additional fields from API
	companyId?: number;
	fqdn?: string;
	companyDescription?: string;
	logoUrl?: string;
	hasEmails?: boolean;
	hasPhones?: boolean;
	hasWorkEmail?: boolean;
	hasMobilePhone?: boolean;
	hasDirectPhone?: boolean;
	personId?: number;
	[key: string]: unknown;
}

export interface SearchResponseData {
	requestId: string;
	currentPage: number;
	pageLength: number;
	totalResults: number;
	data: ContactResult[];
	billing: {
		creditsCharged: number;
		resultsReturned: number;
	};
}

export interface SearchResponse {
	leadId: number;
	totalResults: number;
	data: SearchResponseData;
}

// Reveal Types
export interface RevealRequest {
	contactId: string;
	revealType?: 'email' | 'phone';
}

export interface RevealResponse {
	contactId: string;
	alreadyRevealed: boolean;
	email: string;
	phone: string;
	creditsUsed: number;
}

// Lusha API Service
export class LushaApiService {
	/**
	 * Get contact filters (departments, seniority)
	 * Response: { departments: string[], seniority: Array<{id, name}>, dataPoints: string[] }
	 */
	static async getContactFilters(): Promise<ApiResponse<ContactFilters>> {
		const response = await apiService.get('/lusha/filters/contacts');
		// API returns data directly, not nested
		if (response.status_code === 200 && response.data) {
			return {
				...response,
				data: {
					departments: response.data.departments || [],
					seniority: response.data.seniority || [],
					dataPoints: response.data.dataPoints || [],
				},
			};
		}
		return response;
	}

	/**
	 * Get company filters (industries, sizes, sic, naics)
	 * Response: { industries: Industry[], revenues, sizes, sic, naics }
	 */
	static async getCompanyFilters(): Promise<ApiResponse<CompanyFilters>> {
		const response = await apiService.get('/lusha/filters/companies');
		// API returns data directly
		if (response.status_code === 200 && response.data) {
			return {
				...response,
				data: {
					industries: response.data.industries || [],
					revenues: response.data.revenues || [],
					sizes: response.data.sizes || [],
					intentTopics: response.data.intentTopics || [],
					sic: response.data.sic || [],
					naics: response.data.naics || [],
				},
			};
		}
		return response;
	}

	/**
	 * Search locations (autocomplete)
	 */
	static async searchLocations(
		text: string,
		type: 'contact' | 'company' = 'contact'
	): Promise<ApiResponse<Location[]>> {
		return apiService.get('/lusha/filters/locations', {
			params: { text, type },
		});
	}

	/**
	 * Search company names (autocomplete)
	 */
	static async searchCompanyNames(text: string): Promise<ApiResponse<string[]>> {
		return apiService.get('/lusha/filters/companies/names', {
			params: { text },
		});
	}

	/**
	 * Search technologies (autocomplete)
	 */
	static async searchTechnologies(text: string): Promise<ApiResponse<string[]>> {
		return apiService.get('/lusha/filters/companies/technologies', {
			params: { text },
		});
	}

	/**
	 * Search leads
	 */
	static async searchLeads(request: SearchRequest): Promise<ApiResponse<SearchResponse>> {
		return apiService.post('/lusha/search', request);
	}

	/**
	 * Reveal contact details
	 */
	static async revealContact(request: RevealRequest): Promise<ApiResponse<RevealResponse>> {
		return apiService.post('/lusha/reveal', request);
	}
}
