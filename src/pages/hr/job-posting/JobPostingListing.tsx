import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Eye, Trash2, Search } from 'lucide-react';
import { PageHeader, Button, Snackbar, Table, FloatingInput, FloatingDropdown, Pagination, TableSkeleton } from '../../../components/ui';
import { TableColumn } from '../../../components/ui/DataDisplay';
import { HrIconTooltip } from '../../../features/hrm/components/HrIconTooltip';
import { CareerApiService, JobListing, JobListingFilters } from '../../../services/careerApi';
import { Category } from '../../../services/careerApi';

export const JobPostingListing: React.FC = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [jobs, setJobs] = useState<JobListing[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
		open: false,
		message: '',
		type: 'success',
	});

	// Pagination state
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(20);
	const [totalItems, setTotalItems] = useState(0);
	const [totalPages, setTotalPages] = useState(0);

	// Filter state
	const [filters, setFilters] = useState<JobListingFilters>({
		page: 1,
		limit: 20,
		sort_by: 'created_at',
		sort_order: 'desc',
	});

	// Search and filter inputs
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedDepartment, setSelectedDepartment] = useState('');
	const [selectedJobType, setSelectedJobType] = useState('');
	const [selectedExperienceLevel, setSelectedExperienceLevel] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('');
	const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
	const [isFeaturedFilter, setIsFeaturedFilter] = useState<boolean | undefined>(undefined);

	// Filter options from API
	const [filterOptions, setFilterOptions] = useState<{
		jobTypes: Array<{ value: string; label: string }>;
		experienceLevels: Array<{ value: string; label: string }>;
		departments: Array<{ value: string; label: string }>;
	}>({
		jobTypes: [],
		experienceLevels: [],
		departments: [],
	});

	// Fetch filter options on mount
	useEffect(() => {
		const fetchFilterOptions = async () => {
			try {
				const [filtersResponse, categoriesResponse] = await Promise.all([
					CareerApiService.getFilterOptions(),
					CareerApiService.getCategories(),
				]);

				if (filtersResponse.status === 'Success' && filtersResponse.data) {
					setFilterOptions({
						jobTypes: filtersResponse.data.jobTypes || [],
						experienceLevels: filtersResponse.data.experienceLevels || [],
						departments: filtersResponse.data.departments || [],
					});
				}

				if (categoriesResponse.status === 'Success' && categoriesResponse.data) {
					setCategories(categoriesResponse.data);
				}
			} catch (error) {
				console.error('Failed to load filter options:', error);
			}
		};
		fetchFilterOptions();
	}, []);

	// Fetch job listings
	const fetchJobs = useCallback(async () => {
		setLoading(true);
		try {
			const apiFilters: JobListingFilters = {
				page: filters.page || 1,
				limit: filters.limit || 20,
				sort_by: filters.sort_by || 'created_at',
				sort_order: filters.sort_order || 'desc',
			};

			if (searchTerm) apiFilters.search = searchTerm;
			if (selectedDepartment) apiFilters.department = selectedDepartment;
			if (selectedJobType) apiFilters.job_type = selectedJobType;
			if (selectedExperienceLevel) apiFilters.experience_level = selectedExperienceLevel;
			if (selectedCategory) apiFilters.category_id = parseInt(selectedCategory);
			if (isActiveFilter !== undefined) apiFilters.is_active = isActiveFilter;
			if (isFeaturedFilter !== undefined) apiFilters.is_featured = isFeaturedFilter;

			const response = await CareerApiService.getJobListings(apiFilters);

			if (response.status === 'Success' && response.data) {
				setJobs(response.data.jobs || []);
				setTotalItems(response.data.pagination?.total || 0);
				setTotalPages(response.data.pagination?.totalPages || 0);
				setPage(response.data.pagination?.page || 1);
				setLimit(response.data.pagination?.limit || 20);
			}
		} catch (error) {
			setSnackbar({
				open: true,
				message: 'Failed to load job postings',
				type: 'error',
			});
		} finally {
			setLoading(false);
		}
	}, [filters, searchTerm, selectedDepartment, selectedJobType, selectedExperienceLevel, selectedCategory, isActiveFilter, isFeaturedFilter]);

	// Fetch jobs when filters change
	useEffect(() => {
		fetchJobs();
	}, [fetchJobs]);

	// Handle filter changes
	const handleFilterChange = () => {
		setFilters(prev => ({ ...prev, page: 1 }));
	};

	// Handle search
	const handleSearch = () => {
		setFilters(prev => ({ ...prev, page: 1 }));
		fetchJobs();
	};

	// Handle edit
	const handleEdit = (job: JobListing) => {
		navigate(`/hr/job-posting/edit/${job.id}`);
	};

	// Handle view
	const handleView = (job: JobListing) => {
		// TODO: Navigate to view/details page if needed
		console.log('View job:', job);
	};

	// Handle delete
	const handleDelete = async (job: JobListing) => {
		if (!window.confirm(`Are you sure you want to delete "${job.title}"?`)) {
			return;
		}

		try {
			await CareerApiService.deleteJobListing(job.id);
			setSnackbar({
				open: true,
				message: 'Job posting deleted successfully',
				type: 'success',
			});
			fetchJobs();
		} catch (error) {
			setSnackbar({
				open: true,
				message: 'Failed to delete job posting',
				type: 'error',
			});
		}
	};

	// Table columns
	const columns: TableColumn<Record<string, unknown>>[] = useMemo(
		() => [
			{
				key: 'actions',
				title: 'Actions',
				sortable: false,
				align: 'center',
				render: (_value: unknown, record: Record<string, unknown>) => {
					const row = record as unknown as JobListing;
					return (
						<div className='flex items-center justify-center gap-2'>
							<HrIconTooltip label='View'>
								<button
									type='button'
									onClick={() => handleView(row)}
									className='p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors'
								>
									<Eye className='w-4 h-4' />
								</button>
							</HrIconTooltip>
							<HrIconTooltip label='Edit'>
								<button
									type='button'
									onClick={() => handleEdit(row)}
									className='p-2 text-green-600 hover:bg-green-50 rounded transition-colors'
								>
									<Edit className='w-4 h-4' />
								</button>
							</HrIconTooltip>
							<HrIconTooltip label='Delete'>
								<button
									type='button'
									onClick={() => handleDelete(row)}
									className='p-2 text-red-600 hover:bg-red-50 rounded transition-colors'
								>
									<Trash2 className='w-4 h-4' />
								</button>
							</HrIconTooltip>
						</div>
					);
				},
			},
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
				key: 'title',
				title: 'Job Title',
				sortable: true,
				align: 'left',
				render: (value: unknown) => (
					<div className='font-semibold text-gray-900'>{String(value || '')}</div>
				),
			},
			{
				key: 'department',
				title: 'Department',
				sortable: true,
				align: 'center',
				render: (value: unknown) => (
					<div className='text-gray-700'>{String(value || 'N/A')}</div>
				),
			},
			{
				key: 'job_type',
				title: 'Job Type',
				sortable: true,
				align: 'center',
				render: (value: unknown) => {
					const jobType = String(value || '');
					const formatted = jobType
						.split('-')
						.map(word => word.charAt(0).toUpperCase() + word.slice(1))
						.join(' ');
					return <div className='text-gray-700'>{formatted}</div>;
				},
			},
			{
				key: 'location',
				title: 'Location',
				sortable: true,
				align: 'center',
				render: (value: unknown, record: Record<string, unknown>) => {
					const row = record as unknown as JobListing;
					return (
						<div className='text-gray-700'>
							{row.is_remote ? (
								<span className='px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium'>
									Remote
								</span>
							) : (
								String(value || 'N/A')
							)}
						</div>
					);
				},
			},
			{
				key: 'experience_level',
				title: 'Experience',
				sortable: true,
				align: 'center',
				render: (value: unknown) => {
					const level = String(value || '');
					const formatted = level
						.split('-')
						.map(word => word.charAt(0).toUpperCase() + word.slice(1))
						.join(' ');
					return <div className='text-gray-700'>{formatted || 'N/A'}</div>;
				},
			},
			{
				key: 'salary',
				title: 'Salary',
				sortable: false,
				align: 'center',
				render: (_value: unknown, record: Record<string, unknown>) => {
					const row = record as unknown as JobListing;
					if (!row.salary_min || !row.salary_max) return <div className='text-gray-500'>N/A</div>;
					const currency = row.salary_currency || 'USD';
					const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';
					return (
						<div className='text-gray-700 font-medium'>
							{symbol}
							{row.salary_min.toLocaleString()} - {symbol}
							{row.salary_max.toLocaleString()}
						</div>
					);
				},
			},
			{
				key: 'categories',
				title: 'Categories',
				sortable: false,
				align: 'center',
				render: (_value: unknown, record: Record<string, unknown>) => {
					const row = record as unknown as JobListing;
					const categoryNames = row.category_names || [];
					if (categoryNames.length === 0) return <div className='text-gray-500'>None</div>;
					return (
						<div className='flex flex-wrap gap-1 justify-center'>
							{categoryNames.slice(0, 2).map((cat, idx) => (
								<span
									key={idx}
									className='px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs'
								>
									{cat}
								</span>
							))}
							{categoryNames.length > 2 && (
								<span className='px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs'>
									+{categoryNames.length - 2}
								</span>
							)}
						</div>
					);
				},
			},
			{
				key: 'status',
				title: 'Status',
				sortable: true,
				align: 'center',
				render: (_value: unknown, record: Record<string, unknown>) => {
					const row = record as unknown as JobListing;
					return (
						<div className='flex flex-col gap-1 items-center'>
							<span
								className={`px-2 py-1 rounded text-xs font-medium ${
									row.is_active
										? 'bg-green-100 text-green-800'
										: 'bg-red-100 text-red-800'
								}`}
							>
								{row.is_active ? 'Active' : 'Inactive'}
							</span>
							{row.is_featured && (
								<span className='px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium'>
									Featured
								</span>
							)}
						</div>
					);
				},
			},
			{
				key: 'stats',
				title: 'Stats',
				sortable: false,
				align: 'center',
				render: (_value: unknown, record: Record<string, unknown>) => {
					const row = record as unknown as JobListing;
					return (
						<div className='text-xs text-gray-600 space-y-1'>
							<div>Views: {row.view_count || 0}</div>
							<div>Applications: {row.application_count || 0}</div>
						</div>
					);
				},
			},
			{
				key: 'published_at',
				title: 'Published',
				sortable: true,
				align: 'center',
				render: (value: unknown) => {
					if (!value) return <div className='text-gray-500'>Not published</div>;
					const date = new Date(String(value));
					return <div className='text-gray-700 text-sm'>{date.toLocaleDateString()}</div>;
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
						title='Job Postings'
						totalItems={totalItems}
						itemType='job postings'
						icon='💼'
					/>
					<Button
						onClick={() => navigate('/hr/job-posting/add')}
						variant='primary'
						leftIcon={<Plus className='w-4 h-4' />}
					>
						Add Job Posting
					</Button>
				</div>

				{/* Filters */}
				<div className='bg-white p-4 rounded-lg shadow-sm mb-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
						<FloatingInput
							label='Search'
							value={searchTerm}
							onChange={setSearchTerm}
							placeholder='Search by title, location...'
						/>
						<FloatingDropdown
							label='Department'
							value={selectedDepartment}
							onChange={value => {
								setSelectedDepartment(value);
								handleFilterChange();
							}}
							options={filterOptions.departments}
							placeholder='All Departments'
						/>
						<FloatingDropdown
							label='Job Type'
							value={selectedJobType}
							onChange={value => {
								setSelectedJobType(value);
								handleFilterChange();
							}}
							options={filterOptions.jobTypes}
							placeholder='All Job Types'
						/>
						<FloatingDropdown
							label='Experience Level'
							value={selectedExperienceLevel}
							onChange={value => {
								setSelectedExperienceLevel(value);
								handleFilterChange();
							}}
							options={filterOptions.experienceLevels}
							placeholder='All Levels'
						/>
						<FloatingDropdown
							label='Category'
							value={selectedCategory}
							onChange={value => {
								setSelectedCategory(value);
								handleFilterChange();
							}}
							options={categories.map(cat => ({
								value: cat.id.toString(),
								label: cat.name,
							}))}
							placeholder='All Categories'
						/>
						<FloatingDropdown
							label='Status'
							value={isActiveFilter === undefined ? '' : isActiveFilter.toString()}
							onChange={value => {
								setIsActiveFilter(value === '' ? undefined : value === 'true');
								handleFilterChange();
							}}
							options={[
								{ value: '', label: 'All' },
								{ value: 'true', label: 'Active' },
								{ value: 'false', label: 'Inactive' },
							]}
						/>
						<FloatingDropdown
							label='Featured'
							value={isFeaturedFilter === undefined ? '' : isFeaturedFilter.toString()}
							onChange={value => {
								setIsFeaturedFilter(value === '' ? undefined : value === 'true');
								handleFilterChange();
							}}
							options={[
								{ value: '', label: 'All' },
								{ value: 'true', label: 'Featured' },
								{ value: 'false', label: 'Not Featured' },
							]}
						/>
						<Button
							onClick={handleSearch}
							variant='primary'
							leftIcon={<Search className='w-4 h-4' />}
							className='h-10'
						>
							Search
						</Button>
					</div>
				</div>

				{/* Table */}
				{loading ? (
					<TableSkeleton rows={10} columns={12} />
				) : (
					<>
						<div className='bg-white rounded-lg shadow-sm overflow-hidden'>
							<Table
								columns={columns}
								data={jobs as unknown as Record<string, unknown>[]}
								loading={loading}
								emptyText='No job postings found.'
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
									setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }));
								}}
								className='mt-4'
							/>
						)}
					</>
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
