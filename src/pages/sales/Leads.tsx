/**
 * Leads Page - Lusha Prospecting
 * Step 2: Search logic and integration
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LushaFilter, LushaFilters } from '../../components/lusha/LushaFilter';
import {
	LushaApiService,
	SearchRequest,
	ContactResult,
	EnrichedCompany,
	SearchResponse,
	SavedFilter,
	SavedFilterFilterConfig,
} from '../../services/lushaApi';
import { LeadApiService } from '../../services/leadApi';
import {
	Pagination,
	Button,
	Snackbar,
	FloatingInput,
	FloatingDropdown,
	Card,
} from '../../components/ui';
import {
	Search,
	Loader2,
	Building2,
	Globe,
	MapPin,
	Users,
	Briefcase,
	DollarSign,
	Calendar,
	CheckCircle2,
	Mail,
	Phone,
	ChevronDown,
	Bookmark,
	Trash2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { ApiResponse } from '../../services/api';
import mockSearchResponse from '../../data/mockLushaSearchResponse.json';

// Flag to use mock data instead of API calls
// Set to false to capture real API response, then copy it to mockLushaSearchResponse.json and set to true
const USE_MOCK_DATA = false;
const DEFAULT_MOCK_RECIPIENTS = [
	'shreyasgeetha@gmail.com',
	'shreyas@getinfinitybox.com',
	'shreyasananth.3@gmail.com',
	'kirankaviraj08@gmail.com',
	'shashwat@getinfinitybox.com',
	'keshav@getinfinitybox.com',
	'kiran@getinfinitybox.com',
];

const ENV_MOCK_RECIPIENTS = (import.meta.env.VITE_LEADS_MOCK_EMAIL_TO || '')
	.split(',')
	.map((email: string) => email.trim())
	.filter(Boolean);

const EFFECTIVE_MOCK_RECIPIENTS =
	ENV_MOCK_RECIPIENTS.length > 0 ? ENV_MOCK_RECIPIENTS : DEFAULT_MOCK_RECIPIENTS;
const MARVELL_TEMPLATE_HTML = `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
  .header { border-bottom: 2px solid #27ae60; padding-bottom: 10px; margin-bottom: 20px; }
  .header h2 { color: #27ae60; margin: 0; font-size: 22px; }
  .section-title { color: #2c3e50; font-weight: bold; margin-top: 20px; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; }
  .service-card { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #27ae60; margin: 15px 0; }
  .benefit-list { margin: 15px 0; padding-left: 20px; }
  .benefit-item { margin-bottom: 8px; }
  .highlight { color: #27ae60; font-weight: bold; }
  .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 13px; color: #777; }
  .cta-button { display: inline-block; padding: 12px 25px; background-color: #27ae60; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
  @media only screen and (max-width: 480px) { .container { width: 95%; margin: 10px auto; } }
</style>
</head>
<body>

<div class="container">
  <div class="header">
    <h2>Sustainability & Cost Efficiency for Marvell</h2>
  </div>

  <p>Hi Sir/Madam,</p>
  
  <p>I hope you are doing well.</p>
  
  <p>I am reaching out to introduce <b>InfinityBox</b> and explore how we can support your organization in reducing operational costs while significantly improving your sustainability outcomes.</p>

  <p>We partner with 100+ enterprise leaders across India—including <b>Google, Morgan Stanley, Mahindra, and Airbus</b>—to optimize water usage, energy consumption, and CO₂ emissions.</p>

  <div class="section-title">Our Solutions</div>

  <div class="service-card">
    <div style="font-weight: bold; color: #27ae60;">01. Dishwashing as a Service (Flagship)</div>
    We manage your complete reusable crockery lifecycle, reducing water and chemical footprints.
    <ul style="margin: 5px 0; padding-left: 20px;">
      <li><b>30% Average Cost Savings</b> across 10 million+ orders.</li>
      <li><b>CAPEX Savings:</b> We invest in the cutlery/crockery so you don't have to.</li>
      <li><b>Flexible Models:</b> Onsite and Offsite operations available.</li>
    </ul>
  </div>

  <div class="service-card">
    <div style="font-weight: bold; color: #27ae60;">02. End-to-End Kitchen Design</div>
    Expert design, procurement, and AMC management for corporate kitchens (servicing <b>Microsoft, Boeing, Dell</b>).
  </div>

  <div class="service-card">
    <div style="font-weight: bold; color: #27ae60;">03. Event Infrastructure Management</div>
    Full-service management for events (20–5,000+ pax) covering everything except the food—AV, decor, and premium crockery.
  </div>

  <div class="section-title">Why Partner with InfinityBox?</div>
  <div class="benefit-list">
    <div class="benefit-item">✓ <b>Hygienic Excellence:</b> 7-step process including UV treatment and protein/starch testing.</div>
    <div class="benefit-item">✓ <b>ESG Reporting:</b> Measurable data on water conservation and carbon reduction.</div>
    <div class="benefit-item">✓ <b>Dignity of Labor:</b> High-quality site performance through rigorous staff training and rewards.</div>
  </div>

  <p>I have attached our brochure for your reference. Would you be open to a <b>brief 20-minute discussion</b> next week to see where we can add the most value to your current setup?</p>

  <p>Looking forward to your response.</p>

  <div class="footer">
    <b>Kiran Kaviraj</b><br>
    India Sales Lead | InfinityBox<br>
    <span class="highlight">+91 8356863102</span><br>
    <a href="https://getinfinitybox.com/" style="color: #27ae60;">getinfinitybox.com</a>
  </div>
</div>

</body>
</html>`;

const EMAIL_TEMPLATES = [
	{
		id: 'marvell_sustainability',
		name: 'Marvell - Sustainability & Cost Efficiency',
		subject: 'Sustainability & Cost Efficiency for Marvell',
		html: MARVELL_TEMPLATE_HTML,
	},
];

export const Leads: React.FC = () => {
	type BulkEmailTarget = { contactId: string };

	const [loading, setLoading] = useState(false);
	const [searchResults, setSearchResults] = useState<ContactResult[]>([]);
	const [totalResults, setTotalResults] = useState(0);
	const [leadId, setLeadId] = useState<number | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);
	const [error, setError] = useState<string | null>(null);
	const [currentFilters, setCurrentFilters] = useState<LushaFilters | null>(null);
	const [revealingContactId, setRevealingContactId] = useState<string | null>(null);
	const [requestId, setRequestId] = useState<string | null>(null);
	const [openAccordion, setOpenAccordion] = useState<string | null>(null);
	const [enrichedCompanies, setEnrichedCompanies] = useState<Record<string, EnrichedCompany>>({});
	const [enrichingCompanyId, setEnrichingCompanyId] = useState<string | null>(null);

	// Module 1: Selection and Bulk Actions
	const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
	const [bulkRevealing, setBulkRevealing] = useState(false);
	const [bulkTracking, setBulkTracking] = useState(false);
	const [bulkEmailing, setBulkEmailing] = useState(false);
	const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);
	const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState<string>(EMAIL_TEMPLATES[0].id);
	const [pendingBulkEmailTargets, setPendingBulkEmailTargets] = useState<BulkEmailTarget[]>([]);
	const [sendEmailInMockMode, setSendEmailInMockMode] = useState(false);
	// Removed: trackingContacts state - no longer used after removing Track Lead button
	const [showRevealDropdown, setShowRevealDropdown] = useState(false);
	const revealDropdownRef = useRef<HTMLDivElement>(null);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({
		open: false,
		message: '',
		type: 'success',
	});

	// Saved filters
	const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
	const [savedFiltersLoading, setSavedFiltersLoading] = useState(false);
	const [saveFilterModalOpen, setSaveFilterModalOpen] = useState(false);
	const [saveFilterName, setSaveFilterName] = useState('');
	const [saveFilterSubmitting, setSaveFilterSubmitting] = useState(false);
	const [manageSavedOpen, setManageSavedOpen] = useState(false);
	const [loadedInitialFilters, setLoadedInitialFilters] = useState<LushaFilters | null>(null);
	const [selectedSavedFilterId, setSelectedSavedFilterId] = useState<number | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (revealDropdownRef.current && !revealDropdownRef.current.contains(event.target as Node)) {
				setShowRevealDropdown(false);
			}
		};

		if (showRevealDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showRevealDropdown]);

	/**
	 * Transform LushaFilters to API SearchRequest format
	 */
	const transformFiltersToRequest = (
		filters: LushaFilters,
		page: number,
		size: number
	): SearchRequest => {
		const request: SearchRequest = {
			filters: {},
			pages: {
				page: page,
				size: size,
			},
		};

		// Contact filters
		const contactIncludes: {
			departments?: string[];
			seniority?: number[];
			jobTitles?: string[];
			locations?: Array<{ country: string; state: string; city: string }>;
		} = {};

		if (filters.departments.length > 0) {
			contactIncludes.departments = filters.departments;
		}

		if (filters.seniority.length > 0) {
			// Convert seniority ID strings to numbers (e.g., "4" -> 4)
			contactIncludes.seniority = filters.seniority
				.map(id => parseInt(id, 10))
				.filter(id => !isNaN(id));
		}

		if (filters.jobTitle.trim()) {
			contactIncludes.jobTitles = [filters.jobTitle.trim()];
		}

		if (filters.location) {
			contactIncludes.locations = [
				{
					country: filters.location.country,
					state: filters.location.state,
					city: filters.location.city,
				},
			];
		}

		if (Object.keys(contactIncludes).length > 0) {
			request.filters.contacts = { include: contactIncludes };
		}

		// Company filters
		const companyIncludes: {
			mainIndustriesIds?: number[];
			subIndustriesIds?: number[];
			companyNames?: string[];
			technologies?: string[];
		} = {};

		if (filters.mainIndustriesIds.length > 0) {
			companyIncludes.mainIndustriesIds = filters.mainIndustriesIds;
		}

		if (filters.subIndustriesIds.length > 0) {
			companyIncludes.subIndustriesIds = filters.subIndustriesIds;
		}

		if (filters.companyName.trim()) {
			companyIncludes.companyNames = [filters.companyName.trim()];
		}

		if (filters.technologies.length > 0) {
			companyIncludes.technologies = filters.technologies;
		}

		if (Object.keys(companyIncludes).length > 0) {
			request.filters.companies = { include: companyIncludes };
		}

		return request;
	};

	/** Build filterConfig (for save API) from LushaFilters */
	const lushaFiltersToFilterConfig = useCallback(
		(filters: LushaFilters): SavedFilterFilterConfig => {
			const request = transformFiltersToRequest(filters, 1, 20);
			return request.filters;
		},
		[]
	);

	/** Build LushaFilters from saved filterConfig (for load) */
	const filterConfigToLushaFilters = useCallback(
		(config: SavedFilterFilterConfig): LushaFilters => {
			const contacts = config.contacts?.include;
			const companies = config.companies?.include;
			return {
				departments: contacts?.departments ?? [],
				seniority: (contacts?.seniority ?? []).map(String),
				jobTitle: contacts?.jobTitles?.[0] ?? '',
				mainIndustriesIds: companies?.mainIndustriesIds ?? [],
				subIndustriesIds: companies?.subIndustriesIds ?? [],
				location: contacts?.locations?.[0] ?? null,
				companyName: companies?.companyNames?.[0] ?? '',
				technologies: companies?.technologies ?? [],
			};
		},
		[]
	);

	/** Fetch saved filters list */
	const fetchSavedFilters = useCallback(async () => {
		setSavedFiltersLoading(true);
		try {
			const res = await LushaApiService.getSavedFilters();
			if (res.status_code === 200 && Array.isArray(res.data)) {
				setSavedFilters(res.data);
			}
		} catch (e) {
			console.error('Failed to load saved filters', e);
		} finally {
			setSavedFiltersLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSavedFilters();
	}, [fetchSavedFilters]);

	/**
	 * Perform search with current filters
	 */
	const performSearch = async (filters: LushaFilters, page: number = 1, size?: number) => {
		setLoading(true);
		setError(null);
		setCurrentPage(page);

		// Use provided size or current itemsPerPage state
		const pageSize = size ?? itemsPerPage;
		if (size !== undefined) {
			setItemsPerPage(pageSize);
		}

		try {
			const request = transformFiltersToRequest(filters, page, pageSize);

			console.log('🔍 Search request:', JSON.stringify(request, null, 2));

			let response: ApiResponse<SearchResponse>;

			if (USE_MOCK_DATA) {
				// Use mock data - simulate async behavior
				console.log('📦 Using MOCK DATA instead of API call');
				console.log('📦 Mock data structure:', {
					hasData: !!mockSearchResponse,
					statusCode: mockSearchResponse?.status_code,
					contactsCount: mockSearchResponse?.data?.data?.data?.length || 0,
				});
				// Simulate a small delay to match API behavior
				await new Promise(resolve => setTimeout(resolve, 100));
				response = mockSearchResponse as ApiResponse<SearchResponse>;
			} else {
				// Make actual API call
				response = await LushaApiService.searchLeads(request);

				// Log the full response for copying to mock data file
				console.log('📋 FULL API RESPONSE (copy this to mockLushaSearchResponse.json):');
				console.log('='.repeat(80));
				console.log(JSON.stringify(response, null, 2));
				console.log('='.repeat(80));
			}

			// API returns 201 for successful search
			if ((response.status_code === 200 || response.status_code === 201) && response.data) {
				// Handle nested data structure: response.data.data.data contains the actual results
				const nestedData = response.data.data;
				const contacts = nestedData?.data || [];
				// Total results is in nestedData.totalResults (694) not response.data.totalResults (20)
				const total = nestedData?.totalResults || response.data.totalResults || 0;
				const pageLength = nestedData?.pageLength || contacts.length;

				setSearchResults(contacts);
				setTotalResults(total);
				setLeadId(response.data.leadId || null);
				setRequestId(nestedData?.requestId || null);
				setCurrentFilters(filters);

				console.log('✅ Search successful:', {
					leadId: response.data.leadId,
					totalResults: total,
					resultsCount: contacts.length,
					requestedPageSize: pageSize,
					actualPageSize: pageLength,
					currentPage: page,
					creditsCharged: nestedData?.billing?.creditsCharged,
					usingMockData: USE_MOCK_DATA,
				});

				// Warn if API returned different page size than requested
				if (pageLength !== pageSize && contacts.length > 0) {
					console.warn(`⚠️ API returned ${pageLength} items but ${pageSize} were requested`);
				}
			} else {
				throw new Error(response.message || 'Search failed');
			}
		} catch (err: any) {
			console.error('❌ Search error:', err);
			setError(err.message || 'Failed to search leads. Please try again.');
			setSearchResults([]);
			setTotalResults(0);
		} finally {
			setLoading(false);
		}
	};

	const handleApplyFilters = (filters: LushaFilters) => {
		setSelectedSavedFilterId(null);
		performSearch(filters, 1);
	};

	const handleClearFilters = () => {
		setSearchResults([]);
		setTotalResults(0);
		setLeadId(null);
		setCurrentPage(1);
		setCurrentFilters(null);
		setLoadedInitialFilters(null);
		setSelectedSavedFilterId(null);
		setError(null);
	};

	const handleLoadSavedFilter = (filter: SavedFilter) => {
		const filters = filterConfigToLushaFilters(filter.filterConfig);
		setSelectedSavedFilterId(filter.id);
		setLoadedInitialFilters(filters);
		performSearch(filters, 1);
		setManageSavedOpen(false);
	};

	const handleSaveCurrentFilter = async () => {
		if (!currentFilters || !saveFilterName.trim()) return;
		setSaveFilterSubmitting(true);
		try {
			const payload = {
				name: saveFilterName.trim(),
				filterConfig: lushaFiltersToFilterConfig(currentFilters),
			};
			const res = await LushaApiService.saveFilter(payload);
			if ((res.status_code === 200 || res.status_code === 201) && res.data) {
				setSaveFilterModalOpen(false);
				setSaveFilterName('');
				setSnackbar({ open: true, message: 'Filter saved.', type: 'success' });
				await fetchSavedFilters();
			} else {
				throw new Error(res.message || 'Failed to save filter');
			}
		} catch (e: unknown) {
			const msg = (e as { message?: string })?.message ?? 'Failed to save filter';
			setSnackbar({ open: true, message: msg, type: 'error' });
		} finally {
			setSaveFilterSubmitting(false);
		}
	};

	const handleDeleteSavedFilter = async (id: number) => {
		setDeletingId(id);
		try {
			const res = await LushaApiService.deleteSavedFilter(id);
			if (res.status_code === 200) {
				setSavedFilters(prev => prev.filter(f => f.id !== id));
				setSnackbar({ open: true, message: 'Filter deleted.', type: 'success' });
			} else {
				throw new Error(res.message || 'Failed to delete filter');
			}
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : 'Failed to delete filter';
			setSnackbar({ open: true, message: msg, type: 'error' });
		} finally {
			setDeletingId(null);
		}
	};

	const handlePageChange = (page: number) => {
		if (currentFilters) {
			performSearch(currentFilters, page);
		}
	};

	const handleItemsPerPageChange = (items: number) => {
		if (currentFilters) {
			// Pass the new itemsPerPage directly to performSearch
			performSearch(currentFilters, 1, items);
		} else {
			// If no filters, just update the state
			setItemsPerPage(items);
		}
	};

	/**
	 * Enrich company details
	 */
	const handleEnrichCompany = async (companyId: number, contactId: string) => {
		if (!requestId || !companyId) {
			setError('Request ID or Company ID is missing');
			return;
		}

		const companyIdKey = companyId.toString();

		// If already enriched, just toggle accordion
		if (enrichedCompanies[companyIdKey]) {
			setOpenAccordion(openAccordion === contactId ? null : contactId);
			return;
		}

		// If accordion is already open for this contact, close it first
		if (openAccordion === contactId) {
			setOpenAccordion(null);
			return;
		}

		setEnrichingCompanyId(companyIdKey);
		setError(null);

		try {
			console.log('🏢 Enriching company:', { requestId, companyId });
			const response = await LushaApiService.enrichCompany({
				requestId,
				companiesIds: [companyIdKey],
			});

			if (response.status_code === 200 && response.data?.data?.companies?.length > 0) {
				const company = response.data.data.companies[0];
				setEnrichedCompanies(prev => ({
					...prev,
					[companyIdKey]: company,
				}));
				setOpenAccordion(contactId);
				console.log('✅ Company enriched:', company);
			} else {
				throw new Error(response.message || 'Failed to enrich company');
			}
		} catch (err: any) {
			console.error('❌ Enrich error:', err);
			setError(err.message || 'Failed to enrich company details. Please try again.');
		} finally {
			setEnrichingCompanyId(null);
		}
	};

	/**
	 * Module 1: Selection Helpers
	 */
	const handleToggleSelect = (contactId: string) => {
		setSelectedContacts(prev => {
			const newSet = new Set(prev);
			if (newSet.has(contactId)) {
				newSet.delete(contactId);
			} else {
				newSet.add(contactId);
			}
			return newSet;
		});
	};

	const handleSelectAll = () => {
		if (selectedContacts.size === searchResults.length) {
			setSelectedContacts(new Set());
		} else {
			setSelectedContacts(new Set(searchResults.map(c => c.contactId)));
		}
	};

	const clearSelection = () => {
		setSelectedContacts(new Set());
	};

	/**
	 * Module 1: Reveal contact details (single with type selection)
	 */
	const handleRevealContact = async (
		contactId: string,
		revealType: 'email' | 'phone' | 'both' = 'both'
	) => {
		setRevealingContactId(contactId);
		setError(null);

		try {
			console.log('🔓 Revealing contact:', contactId, revealType);

			// Use LushaApiService for single reveal (camelCase)
			// For 'both', we need to make two calls or use the leadApi
			if (revealType === 'both') {
				// Use LeadApiService for 'both' option
				const response = await LeadApiService.revealContact(contactId, 'both');

				if (response.status === 'Success' && response.data) {
					// Handle both email and phone from response
					const updateData: {
						email?: string;
						phone?: string;
						credits_used?: number;
						already_revealed?: boolean;
					} = {
						credits_used: response.data.credits_used,
						already_revealed: response.data.already_revealed,
					};

					// Only update if value is not null/undefined
					if (response.data.email !== null && response.data.email !== undefined) {
						updateData.email = response.data.email;
					}
					if (response.data.phone !== null && response.data.phone !== undefined) {
						updateData.phone = response.data.phone;
					}

					updateContactAfterReveal(contactId, updateData);
					setSnackbar({
						open: true,
						message: `Contact revealed successfully! Credits used: ${response.data.credits_used}`,
						type: 'success',
					});
				}
			} else {
				// Use LushaApiService for single type (email or phone)
				const response = await LushaApiService.revealContact({
					contactId,
					revealType: revealType === 'email' ? 'email' : 'phone',
				});

				if (response.status_code === 200 && response.data) {
					// Only pass the field that was revealed, preserve the other
					const updateData: {
						email?: string;
						phone?: string;
						credits_used?: number;
						already_revealed?: boolean;
					} = {
						credits_used: response.data.creditsUsed,
						already_revealed: response.data.alreadyRevealed,
					};

					// Only update the field that was revealed
					if (revealType === 'email' && response.data.email) {
						updateData.email = response.data.email;
					}
					if (revealType === 'phone' && response.data.phone) {
						updateData.phone = response.data.phone;
					}

					updateContactAfterReveal(contactId, updateData);

					setSnackbar({
						open: true,
						message: response.data.alreadyRevealed
							? 'Contact already revealed (no credits charged)'
							: `${revealType} revealed! Credits used: ${response.data.creditsUsed}`,
						type: 'success',
					});
				} else {
					throw new Error(response.message || 'Failed to reveal contact');
				}
			}
		} catch (err: any) {
			console.error('❌ Reveal error:', err);
			const errorMsg =
				err.response?.data?.message ||
				err.message ||
				'Failed to reveal contact details. Please try again.';
			setError(errorMsg);
			setSnackbar({
				open: true,
				message: errorMsg,
				type: 'error',
			});
		} finally {
			setRevealingContactId(null);
		}
	};

	const updateContactAfterReveal = (
		contactId: string,
		data: {
			email?: string | null;
			phone?: string | null;
			credits_used?: number;
			already_revealed?: boolean;
		}
	) => {
		setSearchResults(prev =>
			prev.map(contact => {
				if (contact.contactId === contactId) {
					// Preserve existing values - only update what was revealed
					const updatedContact = { ...contact };

					// Update email if provided (and not null), otherwise keep existing
					if (data.email !== undefined && data.email !== null) {
						updatedContact.email = data.email;
						updatedContact.emailAddresses = [data.email];
						updatedContact.hasEmails = true;
					} else if (data.email === null) {
						// Explicitly null means no email available, but keep existing if already revealed
						// Don't overwrite existing email
					}

					// Update phone if provided (and not null), otherwise keep existing
					if (data.phone !== undefined && data.phone !== null) {
						updatedContact.phone = data.phone;
						updatedContact.phoneNumbers = [data.phone];
						updatedContact.hasPhones = true;
					} else if (data.phone === null) {
						// Explicitly null means no phone available, but keep existing if already revealed
						// Don't overwrite existing phone
					}

					return updatedContact;
				}
				return contact;
			})
		);
	};

	/**
	 * Module 1: Bulk reveal contacts
	 */
	const handleBulkReveal = async (revealType: 'email' | 'phone' | 'both') => {
		if (selectedContacts.size === 0) {
			setSnackbar({
				open: true,
				message: 'Please select at least one contact',
				type: 'error',
			});
			return;
		}

		const count = selectedContacts.size;
		if (
			!window.confirm(
				`Reveal ${revealType} for ${count} contact(s)? This will use ${count} credits.`
			)
		) {
			return;
		}

		setBulkRevealing(true);
		setError(null);

		try {
			const contactIds = Array.from(selectedContacts);
			const response = await LeadApiService.bulkReveal(contactIds, revealType);

			if (response.status === 'Success' && response.data) {
				// Update contacts in list
				response.data.results.forEach(result => {
					if (result.success) {
						updateContactAfterReveal(result.contact_id, {
							email: result.email,
							phone: result.phone,
						});
					}
				});

				const { total_revealed, total_failed, credits_used } = response.data;
				setSnackbar({
					open: true,
					message: `${total_revealed} ${revealType}(s) revealed successfully! Credits used: ${credits_used}${total_failed > 0 ? `. ${total_failed} failed.` : ''}`,
					type: total_failed > 0 ? 'error' : 'success',
				});

				if (total_failed === 0) {
					clearSelection();
				}
			} else {
				throw new Error(response.message || 'Bulk reveal failed');
			}
		} catch (err: any) {
			console.error('❌ Bulk reveal error:', err);
			const errorMsg = err.response?.data?.message || err.message || 'Bulk reveal failed';
			setError(errorMsg);
			setSnackbar({
				open: true,
				message: errorMsg,
				type: 'error',
			});
		} finally {
			setBulkRevealing(false);
		}
	};

	/**
	 * Module 1: Check if contact can be tracked
	 */
	const canTrack = (contact: ContactResult): boolean => {
		return !!(
			contact.email ||
			contact.phone ||
			contact.emailAddresses?.[0] ||
			contact.phoneNumbers?.[0]
		);
	};

	const selectedEmailTemplate =
		EMAIL_TEMPLATES.find(template => template.id === selectedEmailTemplateId) || EMAIL_TEMPLATES[0];

	const openBulkEmailComposer = () => {
		if (selectedContacts.size === 0) {
			setSnackbar({
				open: true,
				message: 'Please select at least one contact',
				type: 'error',
			});
			return;
		}

		const selectedRows = searchResults.filter(row => selectedContacts.has(row.contactId));
		const contactPayload: BulkEmailTarget[] = selectedRows.map(row => ({ contactId: row.contactId }));

		if (contactPayload.length === 0) {
			setSnackbar({
				open: true,
				message: 'No valid selected contacts found.',
				type: 'error',
			});
			return;
		}
		setPendingBulkEmailTargets(contactPayload);
		setBulkEmailModalOpen(true);
	};

	const handleBulkSendEmail = async () => {
		if (pendingBulkEmailTargets.length === 0) return;

		setBulkEmailing(true);
		setError(null);

		const contactCount = pendingBulkEmailTargets.length;

		try {
			await LeadApiService.bulkSendFollowupEmail({
				contact_ids: pendingBulkEmailTargets.map(item => item.contactId),
				subject: selectedEmailTemplate.subject,
				template: selectedEmailTemplate.html,
				mock: sendEmailInMockMode,
				redact_recipients: !sendEmailInMockMode,
				...(sendEmailInMockMode ? { mock_recipients: EFFECTIVE_MOCK_RECIPIENTS } : {}),
			});

			// Backend responds 202 Accepted — emails are queued and sending in the background.
			// Optimistically mark all selected contacts as follow-up sent.
			const sentAt = new Date().toISOString();
			const targetContactIds = new Set(pendingBulkEmailTargets.map(item => item.contactId));

			setSearchResults(prev =>
				prev.map(contact => {
					if (!targetContactIds.has(contact.contactId)) return contact;
					const previousCount =
						typeof contact.followup_email_count === 'number' ? contact.followup_email_count : 0;
					return {
						...contact,
						followup_sent: true,
						followup_sent_at: sentAt,
						followup_email_count: previousCount + 1,
						is_tracking: true,
					};
				})
			);

			setSnackbar({
				open: true,
				message: `Sending emails to ${contactCount} contact(s). This runs in the background.`,
				type: 'success',
			});
			setBulkEmailModalOpen(false);
			setPendingBulkEmailTargets([]);
			clearSelection();
		} catch (err: any) {
			console.error('❌ Bulk email error:', err);
			const errorMsg = err.response?.data?.message || err.message || 'Bulk email failed';
			setError(errorMsg);
			setSnackbar({
				open: true,
				message: errorMsg,
				type: 'error',
			});
		} finally {
			setBulkEmailing(false);
		}
	};

	const handleCloseBulkEmailModal = () => {
		if (bulkEmailing) return;
		setBulkEmailModalOpen(false);
		setPendingBulkEmailTargets([]);
	};

	// Removed: handleStartTracking function - no longer used after removing Track Lead button

	/**
	 * Module 1: Bulk start tracking
	 */
	const handleBulkStartTracking = async () => {
		const trackableContacts = Array.from(selectedContacts).filter(contactId => {
			const contact = searchResults.find(c => c.contactId === contactId);
			return contact && canTrack(contact) && !contact.is_tracking;
		});

		if (trackableContacts.length === 0) {
			setSnackbar({
				open: true,
				message: 'No contacts can be tracked. Please reveal contact info first.',
				type: 'error',
			});
			return;
		}

		if (!window.confirm(`Start tracking ${trackableContacts.length} contact(s)?`)) {
			return;
		}

		setBulkTracking(true);
		setError(null);

		try {
			const response = await LeadApiService.bulkStartTracking(trackableContacts);

			if (response.status === 'Success' && response.data) {
				// Update contacts
				response.data.results.forEach(result => {
					if (result.success) {
						setSearchResults(prev =>
							prev.map(contact => {
								if (contact.contactId === result.contact_id) {
									return {
										...contact,
										is_tracking: true,
									};
								}
								return contact;
							})
						);
					}
				});

				const { total_tracked, total_failed } = response.data;
				setSnackbar({
					open: true,
					message: `${total_tracked} contact(s) now being tracked!${total_failed > 0 ? ` ${total_failed} could not be tracked.` : ''}`,
					type: total_failed > 0 ? 'error' : 'success',
				});

				if (total_failed === 0) {
					clearSelection();
				}
			}
		} catch (err: any) {
			console.error('❌ Bulk tracking error:', err);
			const errorMsg = err.response?.data?.message || err.message || 'Bulk tracking failed';
			setError(errorMsg);
			setSnackbar({
				open: true,
				message: errorMsg,
				type: 'error',
			});
		} finally {
			setBulkTracking(false);
		}
	};

	const totalPages = Math.ceil(totalResults / itemsPerPage);

	return (
		<div className='p-6'>
			<div className='mb-6'>
				<h1 className='text-2xl font-bold text-gray-900'>Leads</h1>
				<p className='text-sm text-gray-600 mt-1'>Search and discover new prospects using Lusha</p>
			</div>

			{/* Saved Filters bar */}
			<div className='mb-4 flex flex-wrap items-center gap-3'>
				<span className='text-sm font-medium text-gray-700'>Saved filters:</span>
				<FloatingDropdown
					label=''
					options={savedFilters.map(f => ({ value: String(f.id), label: f.name }))}
					value={selectedSavedFilterId != null ? String(selectedSavedFilterId) : ''}
					onChange={value => {
						const id = value ? parseInt(value, 10) : 0;
						const filter = savedFilters.find(f => f.id === id);
						if (filter) handleLoadSavedFilter(filter);
					}}
					placeholder={savedFiltersLoading ? 'Loading...' : 'Load saved filter...'}
					className='w-56'
					searchable
				/>
				<Button
					variant='outline'
					size='sm'
					onClick={() => setSaveFilterModalOpen(true)}
					disabled={!currentFilters}
					className='inline-flex items-center gap-1.5'
				>
					<Bookmark className='w-4 h-4' />
					Save current filter
				</Button>
				<Button
					variant='ghost'
					size='sm'
					onClick={() => setManageSavedOpen(true)}
					className='inline-flex items-center gap-1.5 text-gray-600'
				>
					Manage
				</Button>
			</div>

			{/* Horizontal Filter Bar */}
			<div className='mb-6'>
				<LushaFilter
					key={selectedSavedFilterId != null ? `saved-${selectedSavedFilterId}` : 'default'}
					onApplyFilters={handleApplyFilters}
					onClearFilters={handleClearFilters}
					initialFilters={loadedInitialFilters}
				/>
			</div>

			{/* Save filter modal */}
			{saveFilterModalOpen && (
				<div
					className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
					onClick={() => !saveFilterSubmitting && setSaveFilterModalOpen(false)}
				>
					<Card className='w-full max-w-md p-6 shadow-xl' onClick={e => e.stopPropagation()}>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>Save current filter</h3>
						<FloatingInput
							label='Filter name'
							value={saveFilterName}
							onChange={setSaveFilterName}
							placeholder='e.g. Engineering leads'
						/>
						<div className='mt-6 flex justify-end gap-2'>
							<Button
								variant='outline'
								onClick={() => setSaveFilterModalOpen(false)}
								disabled={saveFilterSubmitting}
							>
								Cancel
							</Button>
							<Button
								onClick={handleSaveCurrentFilter}
								disabled={!saveFilterName.trim() || saveFilterSubmitting}
								loading={saveFilterSubmitting}
							>
								Save
							</Button>
						</div>
					</Card>
				</div>
			)}

			{/* Manage saved filters modal */}
				{manageSavedOpen && (
					<div
						className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
						onClick={() => setManageSavedOpen(false)}
					>
					<Card
						className='w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-xl'
						onClick={e => e.stopPropagation()}
					>
						<div className='p-6 border-b border-gray-200'>
							<h3 className='text-lg font-semibold text-gray-900'>Saved filters</h3>
							<p className='text-sm text-gray-500 mt-1'>
								Load or delete your saved search filters.
							</p>
						</div>
						<div className='p-4 overflow-y-auto flex-1'>
							{savedFilters.length === 0 ? (
								<p className='text-sm text-gray-500 py-4'>
									No saved filters yet. Run a search and use &quot;Save current filter&quot; to
									create one.
								</p>
							) : (
								<ul className='space-y-2'>
									{savedFilters.map(f => (
										<li
											key={f.id}
											className='flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100'
										>
											<span className='text-sm font-medium text-gray-900 truncate'>{f.name}</span>
											<div className='flex items-center gap-2 flex-shrink-0'>
												<Button variant='ghost' size='sm' onClick={() => handleLoadSavedFilter(f)}>
													Load
												</Button>
												<button
													type='button'
													onClick={() => handleDeleteSavedFilter(f.id)}
													disabled={deletingId === f.id}
													className='p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-50'
													title='Delete filter'
												>
													{deletingId === f.id ? (
														<Loader2 className='w-4 h-4 animate-spin' />
													) : (
														<Trash2 className='w-4 h-4' />
													)}
												</button>
											</div>
										</li>
									))}
								</ul>
							)}
						</div>
						<div className='p-4 border-t border-gray-200'>
							<Button variant='outline' onClick={() => setManageSavedOpen(false)}>
								Close
							</Button>
						</div>
						</Card>
					</div>
				)}

				{bulkEmailModalOpen && (
					<div
						className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
						onClick={handleCloseBulkEmailModal}
					>
						<Card
							className='w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl'
							onClick={e => e.stopPropagation()}
						>
							<div className='p-4 border-b border-gray-200'>
								<h3 className='text-lg font-semibold text-gray-900'>Confirm Bulk Email</h3>
								<p className='text-sm text-gray-600 mt-1'>
									{pendingBulkEmailTargets.length} selected contact(s) with revealed emails
								</p>
							</div>

							<div className='p-4 border-b border-gray-200'>
								<div className='max-w-md'>
									<FloatingDropdown
										label='Email Template'
										options={EMAIL_TEMPLATES.map(template => ({
											value: template.id,
											label: template.name,
										}))}
										value={selectedEmailTemplateId}
										onChange={value => setSelectedEmailTemplateId(value)}
										placeholder='Select template'
									/>
								</div>
								<div className='mt-2 text-sm text-gray-700'>
									<span className='font-medium'>Subject:</span> {selectedEmailTemplate.subject}
								</div>
								<label className='mt-3 inline-flex items-center gap-2 text-sm text-gray-700'>
									<input
										type='checkbox'
										checked={sendEmailInMockMode}
										onChange={e => setSendEmailInMockMode(e.target.checked)}
										className='w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
									/>
									Send in mock mode
								</label>
							</div>

							<div className='p-4 overflow-auto flex-1 bg-gray-50'>
								<div className='text-xs text-gray-500 mb-2'>HTML Preview</div>
								<iframe
									title='Email template preview'
									srcDoc={selectedEmailTemplate.html}
									className='w-full h-[460px] bg-white border border-gray-200 rounded'
								/>
							</div>

							<div className='p-4 border-t border-gray-200 flex items-center justify-between gap-3'>
								<div className='text-xs text-gray-600'>
									{sendEmailInMockMode
										? `Mock mode enabled. mock_recipients: ${EFFECTIVE_MOCK_RECIPIENTS.join(', ')}`
										: 'Mock mode disabled. Emails go to actual contact emails.'}
								</div>
								<div className='flex items-center gap-2'>
									<Button variant='outline' onClick={handleCloseBulkEmailModal} disabled={bulkEmailing}>
										Cancel
									</Button>
									<Button
										onClick={handleBulkSendEmail}
										loading={bulkEmailing}
										disabled={bulkEmailing || pendingBulkEmailTargets.length === 0}
									>
										{bulkEmailing ? 'Sending...' : 'Send Email'}
									</Button>
								</div>
							</div>
						</Card>
					</div>
				)}

				{/* Error Message */}
			{error && (
				<div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
					<div className='text-red-800 font-medium'>Error</div>
					<div className='text-red-700 text-sm mt-1'>{error}</div>
				</div>
			)}

			{/* Results Section */}
			{loading ? (
				<div className='bg-white rounded-lg border border-gray-200 p-12'>
					<div className='flex flex-col items-center justify-center'>
						<Loader2 className='h-8 w-8 text-gray-400 animate-spin mb-4' />
						<p className='text-gray-600'>Searching for leads...</p>
					</div>
				</div>
			) : searchResults.length === 0 && !currentFilters ? (
				<div className='bg-white rounded-lg border border-gray-200 p-12'>
					<div className='flex flex-col items-center justify-center text-center'>
						<div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
							<Search className='w-8 h-8 text-gray-400' />
						</div>
						<p className='text-gray-600 font-medium mb-2'>No search performed</p>
						<p className='text-sm text-gray-400'>Select filters and click "Search" to find leads</p>
					</div>
				</div>
			) : searchResults.length === 0 ? (
				<div className='bg-white rounded-lg border border-gray-200 p-12'>
					<div className='flex flex-col items-center justify-center text-center'>
						<div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
							<Search className='w-8 h-8 text-gray-400' />
						</div>
						<p className='text-gray-600 font-medium mb-2'>No results found</p>
						<p className='text-sm text-gray-400'>Try adjusting your filters</p>
					</div>
				</div>
			) : (
				<>
					{/* Results Summary */}
						<div className='mb-4 flex items-center justify-between gap-3'>
							<div className='text-sm text-gray-600'>
								Found{' '}
								<span className='font-semibold text-gray-900'>{totalResults.toLocaleString()}</span>{' '}
								leads
								{leadId && (
								<span className='ml-2 text-gray-500'>
									(Lead ID: <span className='font-mono'>{leadId}</span>)
									</span>
								)}
							</div>
							<Button
								onClick={openBulkEmailComposer}
								disabled={selectedContacts.size === 0 || bulkEmailing || bulkRevealing}
								variant='outline'
								size='sm'
								leftIcon={<Mail className='w-4 h-4' />}
							>
								Email Template Preview
							</Button>
						</div>

					{/* Module 1: Bulk Action Bar */}
					{selectedContacts.size > 0 && (
						<div className='mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-4'>
									<span className='text-sm font-medium text-blue-900'>
										{selectedContacts.size} contact{selectedContacts.size > 1 ? 's' : ''} selected
									</span>
									<div className='flex items-center gap-2'>
										{/* Reveal Dropdown */}
											<div className='relative' ref={revealDropdownRef}>
												<Button
													onClick={() => setShowRevealDropdown(!showRevealDropdown)}
													disabled={bulkRevealing || bulkEmailing}
													variant='primary'
													size='sm'
													leftIcon={
													bulkRevealing ? (
														<Loader2 className='w-4 h-4 animate-spin' />
													) : (
														<Mail className='w-4 h-4' />
													)
												}
												rightIcon={<ChevronDown className='w-4 h-4' />}
											>
													{bulkRevealing ? 'Revealing...' : 'Reveal Contacts'}
												</Button>

											{showRevealDropdown && !bulkRevealing && (
												<div className='absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden'>
													<div className='py-1'>
														<button
															onClick={() => {
																handleBulkReveal('email');
																setShowRevealDropdown(false);
															}}
															className='w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors'
														>
															<Mail className='w-4 h-4 text-green-600' />
															<div className='flex-1'>
																<div className='text-sm font-medium text-gray-900'>
																	Reveal Emails
																</div>
																<div className='text-xs text-gray-500'>
																	{selectedContacts.size} credits
																</div>
															</div>
														</button>
														<button
															onClick={() => {
																handleBulkReveal('phone');
																setShowRevealDropdown(false);
															}}
															className='w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors'
														>
															<Phone className='w-4 h-4 text-blue-600' />
															<div className='flex-1'>
																<div className='text-sm font-medium text-gray-900'>
																	Reveal Phones
																</div>
																<div className='text-xs text-gray-500'>
																	{selectedContacts.size} credits
																</div>
															</div>
														</button>
														<div className='border-t border-gray-200 my-1'></div>
														<button
															onClick={() => {
																handleBulkReveal('both');
																setShowRevealDropdown(false);
															}}
															className='w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors'
														>
															<div className='flex items-center gap-1'>
																<Mail className='w-4 h-4 text-green-600' />
																<Phone className='w-4 h-4 text-blue-600' />
															</div>
															<div className='flex-1'>
																<div className='text-sm font-medium text-gray-900'>Reveal Both</div>
																<div className='text-xs text-gray-500'>
																	{selectedContacts.size * 2} credits
																</div>
															</div>
														</button>
													</div>
												</div>
											)}
											</div>

											<Button
												onClick={openBulkEmailComposer}
												disabled={bulkEmailing || bulkRevealing}
												variant='primary'
												size='sm'
												leftIcon={
													bulkEmailing ? (
														<Loader2 className='w-4 h-4 animate-spin' />
													) : (
														<Mail className='w-4 h-4' />
													)
												}
											>
												{bulkEmailing ? 'Sending Emails...' : `Send Bulk Email (${selectedContacts.size})`}
											</Button>

											<Button
												onClick={handleBulkStartTracking}
												disabled={bulkTracking || bulkEmailing}
												variant='outline'
												size='sm'
											leftIcon={
												bulkTracking ? (
													<Loader2 className='w-4 h-4 animate-spin' />
												) : (
													<CheckCircle2 className='w-4 h-4' />
												)
											}
										>
											{bulkTracking ? 'Tracking...' : `Start Tracking (${selectedContacts.size})`}
										</Button>
									</div>
								</div>
									<Button onClick={clearSelection} variant='outline' size='sm'>
										Clear Selection
									</Button>
								</div>
								<div className='mt-2 text-xs text-blue-800'>
									Mock recipients are controlled by backend env: LEADS_MOCK_EMAIL_TO
								</div>
							</div>
						)}

					{/* Results Table with Accordion */}
					<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
						<div className='overflow-x-auto'>
							<div className='divide-y divide-gray-200'>
								{/* Table Header */}
								<div className='px-6 py-3 bg-gray-50 border-b border-gray-200'>
									<div className='grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700'>
										<div className='col-span-1'>
											<input
												type='checkbox'
												checked={
													selectedContacts.size === searchResults.length && searchResults.length > 0
												}
												onChange={handleSelectAll}
												className='w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
											/>
										</div>
										<div className='col-span-1'>#</div>
										<div className='col-span-1.5'>Name</div>
										<div className='col-span-1'>LinkedIn</div>
										<div className='col-span-1.5'>Job Title</div>
										<div className='col-span-1.5'>Company</div>
										<div className='col-span-1.5'>Location</div>
										<div className='col-span-2'>Contact Info</div>
										<div className='col-span-1.5'>Actions</div>
									</div>
								</div>

								{/* Table Rows with Accordion */}
								{searchResults.map((row, index) => {
									const isOpen = openAccordion === row.contactId;
									const companyIdKey = row.companyId?.toString() || '';
									const enrichedCompany = companyIdKey ? enrichedCompanies[companyIdKey] : null;

									return (
										<div
											key={row.contactId}
											className={cn(
												'group transition-colors',
												isOpen ? 'border-l-4 border-l-green-500 bg-green-50/30' : 'hover:bg-gray-50'
											)}
										>
											{/* Row Header */}
											<div className='px-6 py-4'>
												<div className='grid grid-cols-12 gap-4 items-center'>
													{/* Checkbox */}
													<div className='col-span-1'>
														<input
															type='checkbox'
															checked={selectedContacts.has(row.contactId)}
															onChange={() => handleToggleSelect(row.contactId)}
															className='w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
														/>
													</div>
													{/* # */}
													<div className='col-span-1'>
														<span className='text-gray-500 font-medium text-sm'>
															{(currentPage - 1) * itemsPerPage + index + 1}
														</span>
													</div>
													{/* Name */}
													<div className='col-span-1.5'>
														<span className='font-medium text-gray-900 text-sm'>
															{row.name || 'N/A'}
														</span>
													</div>
													{/* LinkedIn — use smartLinkedinUrl when linkedinUrl is null */}
													<div className='col-span-1'>
														{row.linkedinUrl || row.smartLinkedinUrl ? (
															<a
																href={row.linkedinUrl || row.smartLinkedinUrl || '#'}
																target='_blank'
																rel='noopener noreferrer'
																className='text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium'
															>
																LinkedIn
															</a>
														) : (
															<span className='text-gray-400 text-sm'>—</span>
														)}
													</div>
													{/* Job Title */}
													<div className='col-span-1.5'>
														<span className='text-gray-700 text-sm'>{row.jobTitle || 'N/A'}</span>
													</div>
													{/* Company */}
													<div className='col-span-1.5'>
														{enrichingCompanyId === companyIdKey ? (
															<div className='flex items-center gap-2 text-sm'>
																<Loader2 className='h-4 w-4 animate-spin text-gray-400' />
																<span className='text-gray-500'>Loading...</span>
															</div>
														) : (
															<button
																onClick={() =>
																	row.companyId && handleEnrichCompany(row.companyId, row.contactId)
																}
																disabled={!row.companyId}
																className={cn(
																	'text-left text-blue-600 hover:text-blue-800 hover:underline transition-colors text-sm font-medium flex items-center gap-1.5',
																	!row.companyId && 'cursor-not-allowed opacity-50 text-gray-700'
																)}
															>
																<Building2 className='h-4 w-4 flex-shrink-0' />
																<span>{row.companyName || 'N/A'}</span>
															</button>
														)}
													</div>
													{/* Location */}
													<div className='col-span-1.5'>
														<span className='text-gray-600 text-sm'>{row.location || 'N/A'}</span>
													</div>
													{/* Contact Info — API may return emailAddresses as [{ email }], phoneNumbers as [{ phone }] or strings */}
													<div className='col-span-2'>
														{(() => {
															const firstEmail = row.emailAddresses?.[0];
															const email =
																row.email ??
																(typeof firstEmail === 'string'
																	? firstEmail
																	: ((firstEmail as { email?: string } | undefined)?.email ?? ''));
															const firstPhone = row.phoneNumbers?.[0];
															const phone =
																row.phone ??
																(typeof firstPhone === 'string'
																	? firstPhone
																	: (() => {
																			const p = firstPhone as
																				| { phone?: string; number?: string }
																				| undefined;
																			return p?.number ?? p?.phone ?? '';
																		})());
															const hasEmail = !!email;
															const hasPhone = !!phone;
															const isRevealing = revealingContactId === row.contactId;

															return (
																<div className='space-y-1.5'>
																	{/* Email Section */}
																	{hasEmail ? (
																		<div className='text-sm text-gray-700'>
																			<span className='font-medium'>Email:</span> {email}
																		</div>
																	) : (
																		<button
																			onClick={() => handleRevealContact(row.contactId, 'email')}
																			disabled={isRevealing}
																			className={cn(
																				'px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 w-full',
																				isRevealing
																					? 'bg-gray-100 text-gray-400 cursor-not-allowed'
																					: 'bg-green-600 hover:bg-green-700 text-white'
																			)}
																		>
																			{isRevealing ? (
																				<Loader2 className='h-3 w-3 animate-spin' />
																			) : (
																				<Mail className='h-3 w-3' />
																			)}
																			Reveal Email
																		</button>
																	)}

																	{/* Phone Section */}
																	{hasPhone ? (
																		<div className='text-sm text-gray-700'>
																			<span className='font-medium'>Phone:</span> {phone}
																		</div>
																	) : (
																		<button
																			onClick={() => handleRevealContact(row.contactId, 'phone')}
																			disabled={isRevealing}
																			className={cn(
																				'px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 w-full',
																				isRevealing
																					? 'bg-gray-100 text-gray-400 cursor-not-allowed'
																					: 'bg-blue-600 hover:bg-blue-700 text-white'
																			)}
																		>
																			{isRevealing ? (
																				<Loader2 className='h-3 w-3 animate-spin' />
																			) : (
																				<Phone className='h-3 w-3' />
																			)}
																			Reveal Phone
																		</button>
																	)}
																</div>
															);
														})()}
													</div>
														{/* Actions */}
														<div className='col-span-1.5'>
															{row.followup_sent === true && (
																<div className='mb-1 inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded'>
																	<Mail className='w-3 h-3' />
																	Follow-up Sent
																</div>
															)}
															{row.followup_sent_at && (
																<div className='text-[11px] text-gray-500 mb-1'>
																	{new Date(row.followup_sent_at).toLocaleString('en-US')}
																</div>
															)}
															{row.is_tracking === true && (
																<span className='inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded'>
																	<CheckCircle2 className='w-3 h-3' />
																	Tracking
																</span>
														)}
													</div>
												</div>
											</div>

											{/* Accordion Content */}
											{enrichedCompany && (
												<div
													className={cn(
														'overflow-hidden transition-all duration-300 ease-in-out',
														isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
													)}
												>
													<div className='px-6 pb-6 border-t border-gray-200 bg-gray-50'>
														<div className='pt-4'>
															<div className='bg-white rounded-lg border border-gray-200 p-6'>
																{/* Company Details */}
																<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
																	{/* Left Column */}
																	<div className='space-y-4'>
																		{/* Company Name & Logo */}
																		<div className='flex items-start gap-4'>
																			{enrichedCompany.logoUrl && (
																				<img
																					src={enrichedCompany.logoUrl}
																					alt={enrichedCompany.name}
																					className='w-16 h-16 object-contain rounded-lg border border-gray-200'
																				/>
																			)}
																			<div className='flex-1'>
																				<h3 className='text-lg font-bold text-gray-900'>
																					{enrichedCompany.name}
																				</h3>
																				{enrichedCompany.fqdn && (
																					<div className='flex items-center gap-1 mt-1 text-sm text-gray-600'>
																						<Globe className='h-4 w-4' />
																						<a
																							href={`https://${enrichedCompany.fqdn}`}
																							target='_blank'
																							rel='noopener noreferrer'
																							className='hover:text-green-600 hover:underline'
																						>
																							{enrichedCompany.fqdn}
																						</a>
																					</div>
																				)}
																			</div>
																		</div>

																		{/* Description */}
																		{enrichedCompany.description && (
																			<div>
																				<p className='text-sm text-gray-700 leading-relaxed'>
																					{enrichedCompany.description}
																				</p>
																			</div>
																		)}

																		{/* Location */}
																		{(enrichedCompany.rawLocation || enrichedCompany.country) && (
																			<div className='flex items-start gap-2'>
																				<MapPin className='h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0' />
																				<div className='text-sm text-gray-700'>
																					{enrichedCompany.rawLocation ||
																						[
																							enrichedCompany.city,
																							enrichedCompany.state,
																							enrichedCompany.country,
																						]
																							.filter(Boolean)
																							.join(', ')}
																				</div>
																			</div>
																		)}

																		{/* Industry */}
																		{(enrichedCompany.mainIndustry ||
																			enrichedCompany.subIndustry) && (
																			<div className='flex items-start gap-2'>
																				<Briefcase className='h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0' />
																				<div className='text-sm text-gray-700'>
																					{enrichedCompany.mainIndustry}
																					{enrichedCompany.subIndustry &&
																						` • ${enrichedCompany.subIndustry}`}
																				</div>
																			</div>
																		)}

																		{/* Employees */}
																		{enrichedCompany.employees && (
																			<div className='flex items-start gap-2'>
																				<Users className='h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0' />
																				<div className='text-sm text-gray-700'>
																					{enrichedCompany.employees}
																				</div>
																			</div>
																		)}

																		{/* Founded */}
																		{enrichedCompany.founded && (
																			<div className='flex items-start gap-2'>
																				<Calendar className='h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0' />
																				<div className='text-sm text-gray-700'>
																					Founded {enrichedCompany.founded}
																				</div>
																			</div>
																		)}

																		{/* Company ID */}
																		<div className='flex items-start gap-2'>
																			<span className='text-xs text-gray-400 mt-0.5'>ID:</span>
																			<div className='text-sm text-gray-700 font-mono'>
																				{enrichedCompany.id}
																			</div>
																		</div>

																		{/* Detailed Location */}
																		{(enrichedCompany.city ||
																			enrichedCompany.state ||
																			enrichedCompany.stateCode) && (
																			<div>
																				<h4 className='text-xs font-semibold text-gray-600 mb-1'>
																					Location Details
																				</h4>
																				<div className='text-sm text-gray-700 space-y-1'>
																					{enrichedCompany.city && (
																						<div>City: {enrichedCompany.city}</div>
																					)}
																					{enrichedCompany.state && (
																						<div>State: {enrichedCompany.state}</div>
																					)}
																					{enrichedCompany.stateCode && (
																						<div>State Code: {enrichedCompany.stateCode}</div>
																					)}
																					{enrichedCompany.country && (
																						<div>Country: {enrichedCompany.country}</div>
																					)}
																					{enrichedCompany.countryIso2 && (
																						<div>Country Code: {enrichedCompany.countryIso2}</div>
																					)}
																					{enrichedCompany.continent && (
																						<div>Continent: {enrichedCompany.continent}</div>
																					)}
																					{enrichedCompany.coordinates &&
																						enrichedCompany.coordinates.length === 2 && (
																							<div className='text-xs text-gray-500'>
																								Coordinates:{' '}
																								{enrichedCompany.coordinates[0].toFixed(6)},{' '}
																								{enrichedCompany.coordinates[1].toFixed(6)}
																							</div>
																						)}
																				</div>
																			</div>
																		)}

																		{/* Domains */}
																		{enrichedCompany.domains && (
																			<div>
																				<h4 className='text-xs font-semibold text-gray-600 mb-1'>
																					Domains
																				</h4>
																				<div className='text-sm text-gray-700 space-y-1'>
																					{enrichedCompany.domains.email && (
																						<div>
																							Email Domain:{' '}
																							<span className='font-mono'>
																								{enrichedCompany.domains.email}
																							</span>
																						</div>
																					)}
																					{enrichedCompany.domains.homepage && (
																						<div>
																							Homepage:{' '}
																							<span className='font-mono'>
																								{enrichedCompany.domains.homepage}
																							</span>
																						</div>
																					)}
																				</div>
																			</div>
																		)}

																		{/* Company Size Details */}
																		{enrichedCompany.companySize && (
																			<div>
																				<h4 className='text-xs font-semibold text-gray-600 mb-1'>
																					Company Size
																				</h4>
																				<div className='text-sm text-gray-700 space-y-1'>
																					<div>
																						Range:{' '}
																						{enrichedCompany.companySize.min?.toLocaleString()} -{' '}
																						{enrichedCompany.companySize.max?.toLocaleString()}{' '}
																						employees
																					</div>
																					{enrichedCompany.companySize.employees_in_linkedin && (
																						<div>
																							LinkedIn Employees:{' '}
																							{enrichedCompany.companySize.employees_in_linkedin.toLocaleString()}
																						</div>
																					)}
																				</div>
																			</div>
																		)}

																		{/* Industry Primary Group Details */}
																		{enrichedCompany.industryPrimaryGroupDetails && (
																			<div>
																				<h4 className='text-xs font-semibold text-gray-600 mb-2'>
																					Industry Classification
																				</h4>
																				{enrichedCompany.industryPrimaryGroupDetails.sics &&
																					enrichedCompany.industryPrimaryGroupDetails.sics.length >
																						0 && (
																						<div className='mb-2'>
																							<div className='text-xs font-medium text-gray-700 mb-1'>
																								SIC Codes:
																							</div>
																							<div className='space-y-1'>
																								{enrichedCompany.industryPrimaryGroupDetails.sics.map(
																									(sic, idx) => (
																										<div
																											key={idx}
																											className='text-sm text-gray-700'
																										>
																											<span className='font-mono'>{sic.sic}</span>:{' '}
																											{sic.description}
																										</div>
																									)
																								)}
																							</div>
																						</div>
																					)}
																				{enrichedCompany.industryPrimaryGroupDetails.naics &&
																					enrichedCompany.industryPrimaryGroupDetails.naics.length >
																						0 && (
																						<div>
																							<div className='text-xs font-medium text-gray-700 mb-1'>
																								NAICS Codes:
																							</div>
																							<div className='space-y-1'>
																								{enrichedCompany.industryPrimaryGroupDetails.naics.map(
																									(naics, idx) => (
																										<div
																											key={idx}
																											className='text-sm text-gray-700'
																										>
																											<span className='font-mono'>
																												{naics.naics}
																											</span>
																											: {naics.description}
																										</div>
																									)
																								)}
																							</div>
																						</div>
																					)}
																			</div>
																		)}
																	</div>

																	{/* Right Column */}
																	<div className='space-y-4'>
																		{/* Social Links */}
																		{enrichedCompany.social && (
																			<div>
																				<h4 className='text-sm font-semibold text-gray-900 mb-2'>
																					Social
																				</h4>
																				<div className='space-y-1'>
																					{enrichedCompany.social.linkedin && (
																						<a
																							href={enrichedCompany.social.linkedin}
																							target='_blank'
																							rel='noopener noreferrer'
																							className='text-sm text-blue-600 hover:underline block'
																						>
																							LinkedIn
																						</a>
																					)}
																					{enrichedCompany.social.crunchbase && (
																						<a
																							href={enrichedCompany.social.crunchbase}
																							target='_blank'
																							rel='noopener noreferrer'
																							className='text-sm text-blue-600 hover:underline block'
																						>
																							Crunchbase
																						</a>
																					)}
																				</div>
																			</div>
																		)}

																		{/* Revenue Range */}
																		{enrichedCompany.revenueRange &&
																			enrichedCompany.revenueRange.length === 2 && (
																				<div>
																					<h4 className='text-sm font-semibold text-gray-900 mb-2'>
																						Revenue
																					</h4>
																					<div className='flex items-center gap-2'>
																						<DollarSign className='h-4 w-4 text-gray-400' />
																						<span className='text-sm text-gray-700'>
																							$
																							{(enrichedCompany.revenueRange[0] / 1000000).toFixed(
																								0
																							)}
																							M - $
																							{(enrichedCompany.revenueRange[1] / 1000000).toFixed(
																								0
																							)}
																							M
																						</span>
																					</div>
																				</div>
																			)}

																		{/* Funding */}
																		{enrichedCompany.funding && (
																			<div>
																				<h4 className='text-sm font-semibold text-gray-900 mb-2'>
																					Funding
																				</h4>
																				<div className='space-y-3'>
																					{enrichedCompany.funding.isIpo !== undefined && (
																						<div className='text-sm text-gray-700'>
																							IPO:{' '}
																							<span className='font-medium'>
																								{enrichedCompany.funding.isIpo ? 'Yes' : 'No'}
																							</span>
																						</div>
																					)}
																					{enrichedCompany.funding.totalRounds > 0 && (
																						<div className='text-sm text-gray-700'>
																							<span className='font-medium'>
																								{enrichedCompany.funding.totalRounds}
																							</span>{' '}
																							rounds
																							{enrichedCompany.funding.totalRoundsAmount && (
																								<span className='ml-2'>
																									• {enrichedCompany.funding.currency || 'USD'} $
																									{(
																										enrichedCompany.funding.totalRoundsAmount /
																										1000000
																									).toFixed(1)}
																									M total
																								</span>
																							)}
																						</div>
																					)}
																					{enrichedCompany.funding.lastRoundDate && (
																						<div className='text-sm text-gray-700'>
																							<div>
																								Last Round:{' '}
																								<span className='font-medium'>
																									{enrichedCompany.funding.lastRoundType}
																								</span>
																							</div>
																							<div className='text-gray-600'>
																								Date: {enrichedCompany.funding.lastRoundDate}
																							</div>
																							{enrichedCompany.funding.lastRoundAmount && (
																								<div className='text-gray-600'>
																									Amount:{' '}
																									{enrichedCompany.funding.currency || 'USD'} $
																									{(
																										enrichedCompany.funding.lastRoundAmount /
																										1000000
																									).toFixed(1)}
																									M
																								</div>
																							)}
																						</div>
																					)}
																					{enrichedCompany.funding.rounds &&
																						enrichedCompany.funding.rounds.length > 0 && (
																							<div>
																								<div className='text-xs font-medium text-gray-700 mb-2'>
																									All Rounds:
																								</div>
																								<div className='space-y-2'>
																									{enrichedCompany.funding.rounds.map(
																										(round, idx) => (
																											<div
																												key={idx}
																												className='text-sm bg-gray-50 p-2 rounded border border-gray-200'
																											>
																												<div className='font-medium text-gray-900'>
																													{round.roundType || 'N/A'}
																												</div>
																												{round.roundDate && (
																													<div className='text-gray-600 text-xs'>
																														Date: {round.roundDate}
																													</div>
																												)}
																												{round.roundAmount && (
																													<div className='text-gray-700 text-xs'>
																														Amount:{' '}
																														{round.currency ||
																															enrichedCompany.funding?.currency ||
																															'USD'}{' '}
																														$
																														{(round.roundAmount / 1000000).toFixed(
																															2
																														)}
																														M
																													</div>
																												)}
																											</div>
																										)
																									)}
																								</div>
																							</div>
																						)}
																				</div>
																			</div>
																		)}

																		{/* Specialities */}
																		{enrichedCompany.specialities &&
																			enrichedCompany.specialities.length > 0 && (
																				<div>
																					<h4 className='text-sm font-semibold text-gray-900 mb-2'>
																						Specialities
																					</h4>
																					<div className='flex flex-wrap gap-2'>
																						{enrichedCompany.specialities
																							.slice(0, 10)
																							.map((speciality, idx) => (
																								<span
																									key={idx}
																									className='px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md'
																								>
																									{speciality}
																								</span>
																							))}
																						{enrichedCompany.specialities.length > 10 && (
																							<span className='px-2 py-1 text-gray-500 text-xs'>
																								+{enrichedCompany.specialities.length - 10} more
																							</span>
																						)}
																					</div>
																				</div>
																			)}
																	</div>
																</div>
															</div>
														</div>
													</div>
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
					</div>

					{/* Pagination */}
					{totalPages > 0 && (
						<div className='mt-4'>
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								totalItems={totalResults}
								itemsPerPage={itemsPerPage}
								onPageChange={handlePageChange}
								onItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					)}
				</>
			)}

			{/* Snackbar for notifications */}
			<Snackbar
				message={snackbar.message}
				type={snackbar.type}
				open={snackbar.open}
				onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
			/>
		</div>
	);
};
