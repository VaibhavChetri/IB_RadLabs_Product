/**
 * Leads Page - Lusha Prospecting
 * Step 2: Search logic and integration
 */

import React, { useState } from 'react';
import { LushaFilter, LushaFilters } from '../../components/lusha/LushaFilter';
import { LushaApiService, SearchRequest, ContactResult } from '../../services/lushaApi';
import { Table } from '../../components/ui/DataDisplay';
import { Pagination } from '../../components/ui/Pagination';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Leads: React.FC = () => {
	const [loading, setLoading] = useState(false);
	const [searchResults, setSearchResults] = useState<ContactResult[]>([]);
	const [totalResults, setTotalResults] = useState(0);
	const [leadId, setLeadId] = useState<number | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(20);
	const [error, setError] = useState<string | null>(null);
	const [currentFilters, setCurrentFilters] = useState<LushaFilters | null>(null);
	const [revealingContactId, setRevealingContactId] = useState<string | null>(null);
	const [seniorityMap, setSeniorityMap] = useState<Map<string, string>>(new Map()); // Maps seniority name to ID

	/**
	 * Transform LushaFilters to API SearchRequest format
	 */
	const transformFiltersToRequest = (filters: LushaFilters, page: number, size: number): SearchRequest => {
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
			contactIncludes.seniority = filters.seniority.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
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
			industries?: string[];
			companyNames?: string[];
			technologies?: string[];
		} = {};

		if (filters.industries.length > 0) {
			companyIncludes.industries = filters.industries;
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

			const response = await LushaApiService.searchLeads(request);

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
				setCurrentFilters(filters);
				
				console.log('✅ Search successful:', {
					leadId: response.data.leadId,
					totalResults: total,
					resultsCount: contacts.length,
					requestedPageSize: pageSize,
					actualPageSize: pageLength,
					currentPage: page,
					creditsCharged: nestedData?.billing?.creditsCharged,
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
		console.log('📋 Applied filters:', filters);
		performSearch(filters, 1);
	};

	const handleClearFilters = () => {
		console.log('🧹 Filters cleared');
		setSearchResults([]);
		setTotalResults(0);
		setLeadId(null);
		setCurrentPage(1);
		setCurrentFilters(null);
		setError(null);
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
	 * Reveal contact details
	 */
	const handleRevealContact = async (contactId: string) => {
		setRevealingContactId(contactId);
		setError(null);

		try {
			console.log('🔓 Revealing contact:', contactId);
			const response = await LushaApiService.revealContact({ contactId });

			if (response.status_code === 200 && response.data) {
				console.log('✅ Reveal successful:', response.data);

				// Update the specific contact in results with revealed data
				setSearchResults(prev =>
					prev.map(contact => {
						if (contact.contactId === contactId) {
							return {
								...contact,
								email: response.data.email || undefined,
								phone: response.data.phone || undefined,
								emailAddresses: response.data.email ? [response.data.email] : [],
								phoneNumbers: response.data.phone ? [response.data.phone] : [],
								hasEmails: !!response.data.email,
								hasPhones: !!response.data.phone,
							};
						}
						return contact;
					})
				);

				// Show success message if credits were used
				if (response.data.creditsUsed > 0) {
					console.log(`💳 Credits used: ${response.data.creditsUsed}`);
				}
				if (response.data.alreadyRevealed) {
					console.log('ℹ️ Contact was already revealed (no credits charged)');
				}
			} else {
				throw new Error(response.message || 'Failed to reveal contact');
			}
		} catch (err: any) {
			console.error('❌ Reveal error:', err);
			setError(err.message || 'Failed to reveal contact details. Please try again.');
		} finally {
			setRevealingContactId(null);
		}
	};

	// Table columns
	const columns = [
		{
			key: 'index',
			title: '#',
			render: (value: unknown, row: ContactResult, index: number) => (
				<span className='text-gray-500 font-medium'>{(currentPage - 1) * itemsPerPage + index + 1}</span>
			),
		},
		{
			key: 'name',
			title: 'Name',
			render: (value: unknown, row: ContactResult) => (
				<span className='font-medium text-gray-900'>{row.name || 'N/A'}</span>
			),
		},
		{
			key: 'jobTitle',
			title: 'Job Title',
			render: (value: unknown, row: ContactResult) => <span className='text-gray-700'>{row.jobTitle || 'N/A'}</span>,
		},
		{
			key: 'companyName',
			title: 'Company',
			render: (value: unknown, row: ContactResult) => <span className='text-gray-700'>{row.companyName || 'N/A'}</span>,
		},
		{
			key: 'location',
			title: 'Location',
			render: (value: unknown, row: ContactResult) => <span className='text-gray-600'>{row.location || 'N/A'}</span>,
		},
		{
			key: 'contactInfo',
			title: 'Contact Info',
			render: (value: unknown, row: ContactResult) => {
				// Check if contact has revealed email/phone data (from arrays or direct fields)
				const email = row.emailAddresses?.[0] || row.email;
				const phone = row.phoneNumbers?.[0] || row.phone;
				const hasEmail = !!email;
				const hasPhone = !!phone;

				// If we have revealed contact info, display it
				if (hasEmail || hasPhone) {
					return (
						<div className='space-y-1'>
							{hasEmail && (
								<div className='text-sm text-gray-700'>
									<span className='font-medium'>Email:</span> {email}
								</div>
							)}
							{hasPhone && (
								<div className='text-sm text-gray-700'>
									<span className='font-medium'>Phone:</span> {phone}
								</div>
							)}
						</div>
					);
				}

				// Show reveal button (data exists but not revealed yet)
				const isRevealing = revealingContactId === row.contactId;
				return (
					<button
						onClick={() => handleRevealContact(row.contactId)}
						disabled={isRevealing}
						className={cn(
							'px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2',
							isRevealing
								? 'bg-gray-100 text-gray-400 cursor-not-allowed'
								: 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md'
						)}
					>
						{isRevealing ? (
							<>
								<Loader2 className='h-4 w-4 animate-spin' />
								Revealing...
							</>
						) : (
							'Reveal Details'
						)}
					</button>
				);
			},
		},
	];

	const totalPages = Math.ceil(totalResults / itemsPerPage);

	return (
		<div className='p-6'>
			<div className='mb-6'>
				<h1 className='text-2xl font-bold text-gray-900'>Leads</h1>
				<p className='text-sm text-gray-600 mt-1'>Search and discover new prospects using Lusha</p>
			</div>

			{/* Horizontal Filter Bar */}
			<div className='mb-6'>
				<LushaFilter onApplyFilters={handleApplyFilters} onClearFilters={handleClearFilters} />
			</div>

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
					<div className='mb-4 flex items-center justify-between'>
						<div className='text-sm text-gray-600'>
							Found <span className='font-semibold text-gray-900'>{totalResults.toLocaleString()}</span> leads
							{leadId && (
								<span className='ml-2 text-gray-500'>
									(Lead ID: <span className='font-mono'>{leadId}</span>)
								</span>
							)}
						</div>
					</div>

					{/* Results Table */}
					<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
						<div className='overflow-x-auto'>
							<Table<ContactResult>
								columns={columns}
								data={searchResults}
								loading={false}
								emptyText='No leads found'
							/>
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
		</div>
	);
};
