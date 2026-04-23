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
			seniority?: number[]; // Changed to number[] to match API requirement
			jobTitles?: string[];
			locations?: Location[];
		};
	};
	companies?: {
		include?: {
			mainIndustriesIds?: number[];
			subIndustriesIds?: number[];
			companyNames?: string[];
			technologies?: string[];
		};
	};
}

export interface SearchRequest {
	filters: SearchFilters;
	pages: { page: number; size: number };
}

/** API can return emailAddresses as string[] or as { email: string }[] */
export type EmailEntry = string | { email?: string };
/** API can return phoneNumbers as string[] or as { phone?: string; number?: string }[] */
export type PhoneEntry = string | { phone?: string; number?: string };

export interface ContactResult {
	contactId: string;
	name: string;
	companyName: string;
	jobTitle: string;
	location?: string;
	emailAddresses?: EmailEntry[];
	phoneNumbers?: PhoneEntry[];
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
	linkedinUrl?: string | null;
	linkedinSearchUrl?: string;
	smartLinkedinUrl?: string;
	companyLinkedinUrl?: string;
	is_tracking?: boolean;
	followup_sent?: boolean;
	followup_sent_at?: string;
	followup_email_count?: number;
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

// Company Enrich Types
export interface CompanyEnrichRequest {
	requestId: string;
	companiesIds: string[];
}

export interface CompanyFundingRound {
	currency?: string;
	roundDate?: string;
	roundType?: string;
	roundAmount?: number;
}

export interface CompanyFunding {
	isIpo: boolean;
	rounds: CompanyFundingRound[];
	currency?: string;
	totalRounds: number;
	lastRoundDate?: string;
	lastRoundType?: string;
	lastRoundAmount?: number;
	totalRoundsAmount?: number;
}

export interface CompanySocial {
	linkedin?: string;
	crunchbase?: string;
}

export interface CompanyDomains {
	email?: string;
	homepage?: string;
}

export interface CompanySize {
	max: number;
	min: number;
	employees_in_linkedin?: number;
}

export interface CompanySicNaics {
	sic?: number;
	naics?: number;
	description: string;
}

export interface CompanyIndustryDetails {
	sics?: CompanySicNaics[];
	naics?: CompanySicNaics[];
}

export interface EnrichedCompany {
	id: number;
	fqdn?: string;
	name: string;
	social?: CompanySocial;
	country?: string;
	domains?: CompanyDomains;
	founded?: number;
	funding?: CompanyFunding;
	logoUrl?: string;
	continent?: string;
	employees?: string;
	companySize?: CompanySize;
	countryIso2?: string;
	description?: string;
	rawLocation?: string;
	subIndustry?: string;
	mainIndustry?: string;
	revenueRange?: number[];
	specialities?: string[];
	industryPrimaryGroupDetails?: CompanyIndustryDetails;
	city?: string;
	state?: string;
	stateCode?: string;
	coordinates?: number[];
	[key: string]: unknown;
}

export interface CompanyEnrichResponse {
	requestId: string;
	companiesEnriched: number;
	companiesFromCache: number;
	companiesFromAPI: number;
	creditsUsed: number;
	data: {
		requestId: string;
		companies: EnrichedCompany[];
	};
}

// Saved Filters (Lusha)
export interface SavedFilterFilterConfig {
	contacts?: {
		include?: {
			departments?: string[];
			jobTitles?: string[];
			seniority?: number[];
			locations?: Location[];
		};
	};
	companies?: {
		include?: {
			mainIndustriesIds?: number[];
			subIndustriesIds?: number[];
			companyNames?: string[];
			technologies?: string[];
			industries?: string[];
		};
	};
}

export interface SavedFilter {
	id: number;
	name: string;
	filterConfig: SavedFilterFilterConfig;
	createdAt: string;
}

export interface SavedFilterCreatePayload {
	name: string;
	filterConfig: SavedFilterFilterConfig;
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

	/**
	 * Enrich company details
	 */
	static async enrichCompany(
		request: CompanyEnrichRequest
	): Promise<ApiResponse<CompanyEnrichResponse>> {
		return apiService.post('/lusha/company/enrich', request);
	}

	/**
	 * Save current search as a named filter
	 */
	static async saveFilter(payload: SavedFilterCreatePayload): Promise<ApiResponse<SavedFilter>> {
		return apiService.post('/lusha/saved-filters', payload) as Promise<ApiResponse<SavedFilter>>;
	}

	/**
	 * Get list of saved filters
	 */
	static async getSavedFilters(): Promise<ApiResponse<SavedFilter[]>> {
		const res = await apiService.get('/lusha/saved-filters');
		if (res.status_code !== 200) return res as ApiResponse<SavedFilter[]>;
		const raw = res.data;
		const list = Array.isArray(raw) ? raw : ((raw as { data?: SavedFilter[] })?.data ?? []);
		return { ...res, data: list };
	}

	/**
	 * Delete a saved filter
	 */
	static async deleteSavedFilter(id: number): Promise<ApiResponse<{ message?: string }>> {
		return apiService.delete(`/lusha/saved-filters/${id}`) as Promise<
			ApiResponse<{ message?: string }>
		>;
	}
}
