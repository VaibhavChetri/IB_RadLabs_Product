import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X, Briefcase, DollarSign, Mail, Globe, Eye, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { FloatingInput, FloatingDropdown, MultiSelectDropdown, Snackbar } from '../../../components/ui';
import { Textarea } from '../../../components/ui/Input';
import { Switch } from '../../../components/ui/Form';
import { CareerApiService, Category } from '../../../services/careerApi';

// Types based on schema
interface JobDescription {
	overview: string;
	paragraphs: string[];
	salary?: {
		min: number;
		max: number;
		currency: string;
		period: string;
		display: string;
	};
	requirements: string[];
	responsibilities: string[];
	benefits: string[];
	qualifications?: {
		required: string[];
		preferred: string[];
	};
}

interface JobPostingFormData {
	// Basic Information
	title: string;
	slug: string;
	department: string;
	jobType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
	location: string;
	isRemote: boolean;

	// Status and Visibility
	isActive: boolean;
	isFeatured: boolean;
	publishedAt: string;
	expiresAt: string;

	// Description Structure
	description: JobDescription;

	// Salary Fields
	salaryMin: string;
	salaryMax: string;
	salaryCurrency: string;

	// Experience Level
	experienceLevel: 'entry' | 'mid' | 'senior' | 'executive' | '';

	// Application Information
	applicationEmail: string;
	applicationUrl: string;
	applicationDeadline: string;

	// SEO and Metadata
	metaTitle: string;
	metaDescription: string;
	metaKeywords: string;

	// Categories
	categoryIds: number[];
}

// Default options (fallback if API fails)
const defaultJobTypeOptions = [
	{ value: 'full-time', label: 'Full Time' },
	{ value: 'part-time', label: 'Part Time' },
	{ value: 'contract', label: 'Contract' },
	{ value: 'internship', label: 'Internship' },
	{ value: 'freelance', label: 'Freelance' },
];

const defaultExperienceLevelOptions = [
	{ value: 'entry', label: 'Entry Level' },
	{ value: 'mid', label: 'Mid Level' },
	{ value: 'senior', label: 'Senior Level' },
	{ value: 'executive', label: 'Executive' },
];

const currencyOptions = [
	{ value: 'USD', label: 'USD ($)' },
	{ value: 'EUR', label: 'EUR (€)' },
	{ value: 'GBP', label: 'GBP (£)' },
	{ value: 'INR', label: 'INR (₹)' },
];

const salaryPeriodOptions = [
	{ value: 'yearly', label: 'Per Year' },
	{ value: 'monthly', label: 'Per Month' },
	{ value: 'hourly', label: 'Per Hour' },
];

// Helper function to generate slug from title
const generateSlug = (title: string): string => {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
};

export const AddJobPosting: React.FC = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id?: string }>();
	const isEditMode = !!id;
	const jobId = id ? parseInt(id, 10) : null;
	
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [loadingJobData, setLoadingJobData] = useState(false);
	const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
	const [categories, setCategories] = useState<Category[]>([]);
	const [loadingCategories, setLoadingCategories] = useState(false);
	
	// Job Type and Experience Level from API
	const [jobTypeOptions, setJobTypeOptions] = useState<{ value: string; label: string }[]>(defaultJobTypeOptions);
	const [experienceLevelOptions, setExperienceLevelOptions] = useState<{ value: string; label: string }[]>(defaultExperienceLevelOptions);
	const [loadingJobTypes, setLoadingJobTypes] = useState(false);
	const [loadingExperienceLevels, setLoadingExperienceLevels] = useState(false);

	// Helper to get future date in datetime-local format
	const getFutureDate = (days: number): string => {
		const date = new Date();
		date.setDate(date.getDate() + days);
		return date.toISOString().slice(0, 16);
	};

	const [formData, setFormData] = useState<JobPostingFormData>({
		title: '',
		slug: '',
		department: '',
		jobType: 'full-time',
		location: '',
		isRemote: false,
		isActive: true,
		isFeatured: false,
		publishedAt: getFutureDate(0),
		expiresAt: getFutureDate(90),
		description: {
			overview: '',
			paragraphs: [''],
			requirements: [''],
			responsibilities: [''],
			benefits: [''],
			qualifications: {
				required: [''],
				preferred: [''],
			},
		},
		salaryMin: '',
		salaryMax: '',
		salaryCurrency: 'USD',
		experienceLevel: '',
		applicationEmail: '',
		applicationUrl: '',
		applicationDeadline: getFutureDate(60),
		metaTitle: '',
		metaDescription: '',
		metaKeywords: '',
		categoryIds: [],
	});

	const [errors, setErrors] = useState<Partial<Record<keyof JobPostingFormData, string>>>({});

	// Fetch categories on mount
	useEffect(() => {
		const fetchCategories = async () => {
			setLoadingCategories(true);
			try {
				const response = await CareerApiService.getCategories();
				if (response.status === 'Success' && response.data) {
					setCategories(response.data);
				}
			} catch {
				setSnackbar({ message: 'Failed to load categories', type: 'error' });
			} finally {
				setLoadingCategories(false);
			}
		};
		fetchCategories();
	}, []);

	// Fetch filter options (job types, experience levels, departments, locations) from API
	useEffect(() => {
		const fetchFilterOptions = async () => {
			setLoadingJobTypes(true);
			setLoadingExperienceLevels(true);
			try {
				const response = await CareerApiService.getFilterOptions();
				if (response.status === 'Success' && response.data) {
					// Set job types from API
					if (response.data.jobTypes && response.data.jobTypes.length > 0) {
						setJobTypeOptions(response.data.jobTypes);
					} else {
						setJobTypeOptions(defaultJobTypeOptions);
					}
					
					// Set experience levels from API
					if (response.data.experienceLevels && response.data.experienceLevels.length > 0) {
						setExperienceLevelOptions(response.data.experienceLevels);
					} else {
						setExperienceLevelOptions(defaultExperienceLevelOptions);
					}
				} else {
					// Fallback to defaults if API response is invalid
					setJobTypeOptions(defaultJobTypeOptions);
					setExperienceLevelOptions(defaultExperienceLevelOptions);
				}
			} catch {
				// Fallback to defaults on error
				// Fallback to defaults on error
				setJobTypeOptions(defaultJobTypeOptions);
				setExperienceLevelOptions(defaultExperienceLevelOptions);
			} finally {
				setLoadingJobTypes(false);
				setLoadingExperienceLevels(false);
			}
		};
		fetchFilterOptions();
	}, []);

	// Auto-generate slug when title changes
	const handleTitleChange = (value: string) => {
		setFormData(prev => ({
			...prev,
			title: value,
			slug: generateSlug(value),
			metaTitle: prev.metaTitle || value,
		}));
	};

	// Dynamic list handlers
	const addListItem = (field: 'paragraphs' | 'requirements' | 'responsibilities' | 'benefits' | 'required' | 'preferred') => {
		setFormData(prev => {
			if (field === 'required' || field === 'preferred') {
				return {
					...prev,
					description: {
						...prev.description,
						qualifications: {
							...prev.description.qualifications!,
							[field]: [...(prev.description.qualifications?.[field] || []), ''],
						},
					},
				};
			}
			return {
				...prev,
				description: {
					...prev.description,
					[field]: [...(prev.description[field] as string[]), ''],
				},
			};
		});
	};

	const removeListItem = (
		field: 'paragraphs' | 'requirements' | 'responsibilities' | 'benefits' | 'required' | 'preferred',
		index: number
	) => {
		setFormData(prev => {
			if (field === 'required' || field === 'preferred') {
				const newList = prev.description.qualifications?.[field].filter((_, i) => i !== index) || [];
				return {
					...prev,
					description: {
						...prev.description,
						qualifications: {
							...prev.description.qualifications!,
							[field]: newList,
						},
					},
				};
			}
			const newList = (prev.description[field] as string[]).filter((_, i) => i !== index);
			return {
				...prev,
				description: {
					...prev.description,
					[field]: newList,
				},
			};
		});
	};

	const updateListItem = (
		field: 'paragraphs' | 'requirements' | 'responsibilities' | 'benefits' | 'required' | 'preferred',
		index: number,
		value: string
	) => {
		setFormData(prev => {
			if (field === 'required' || field === 'preferred') {
				const newList = [...(prev.description.qualifications?.[field] || [])];
				newList[index] = value;
				return {
					...prev,
					description: {
						...prev.description,
						qualifications: {
							...prev.description.qualifications!,
							[field]: newList,
						},
					},
				};
			}
			const newList = [...(prev.description[field] as string[])];
			newList[index] = value;
			return {
				...prev,
				description: {
					...prev.description,
					[field]: newList,
				},
			};
		});
	};

	// Calculate salary display
	const calculateSalaryDisplay = () => {
		if (!formData.salaryMin || !formData.salaryMax) return '';
		const period = formData.description.salary?.period || 'yearly';
		const currency = formData.salaryCurrency;
		const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';
		const periodText = period === 'yearly' ? '/year' : period === 'monthly' ? '/month' : '/hour';
		return `${symbol}${parseFloat(formData.salaryMin).toLocaleString()} - ${symbol}${parseFloat(formData.salaryMax).toLocaleString()}${periodText}`;
	};

	// Update salary in description when salary fields change
	React.useEffect(() => {
		if (formData.salaryMin && formData.salaryMax) {
			const period = formData.description.salary?.period || 'yearly';
			const currency = formData.salaryCurrency;
			const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';
			const periodText = period === 'yearly' ? '/year' : period === 'monthly' ? '/month' : '/hour';
			const display = `${symbol}${parseFloat(formData.salaryMin).toLocaleString()} - ${symbol}${parseFloat(formData.salaryMax).toLocaleString()}${periodText}`;
			
			setFormData(prev => ({
				...prev,
				description: {
					...prev.description,
					salary: {
						min: parseFloat(prev.salaryMin),
						max: parseFloat(prev.salaryMax),
						currency: prev.salaryCurrency,
						period: period as 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly',
						display: display,
					},
				},
			}));
		}
	}, [formData.salaryMin, formData.salaryMax, formData.salaryCurrency, formData.description.salary?.period]);

	const validateForm = (): boolean => {
		const newErrors: Partial<Record<keyof JobPostingFormData, string>> = {};

		if (!formData.title.trim()) newErrors.title = 'Job title is required';
		if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
		if (!formData.department.trim()) newErrors.department = 'Department is required';
		if (!formData.location.trim() && !formData.isRemote) newErrors.location = 'Location is required for non-remote jobs';
		if (!formData.description.overview.trim()) {
			newErrors.description = 'Job overview is required' as keyof JobPostingFormData & string;
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Helper function to convert datetime-local to ISO format
	const convertToISO = (dateTimeLocal: string): string | undefined => {
		if (!dateTimeLocal) return undefined;
		// Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO format
		return new Date(dateTimeLocal).toISOString();
	};

	// Helper function to convert ISO datetime to datetime-local format
	const convertToDateTimeLocal = (isoString: string | null | undefined): string => {
		if (!isoString) return '';
		const date = new Date(isoString);
		// Format as YYYY-MM-DDTHH:mm for datetime-local input
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	};

	// Helper function to populate form from API response
	const populateFormFromJobData = useCallback((jobData: {
		title?: string;
		slug?: string;
		department?: string | null;
		job_type?: string;
		location?: string | null;
		is_remote?: boolean;
		is_active?: boolean;
		is_featured?: boolean;
		published_at?: string | null;
		expires_at?: string | null;
		description?: {
			overview?: string;
			paragraphs?: string[];
			salary?: { min?: number; max?: number; currency?: string; period?: string; display?: string };
			requirements?: string[];
			responsibilities?: string[];
			benefits?: string[];
			qualifications?: { required?: string[]; preferred?: string[] };
		};
		salary_min?: number | null;
		salary_max?: number | null;
		salary_currency?: string;
		experience_level?: string | null;
		application_email?: string | null;
		application_url?: string | null;
		application_deadline?: string | null;
		meta_title?: string | null;
		meta_description?: string | null;
		meta_keywords?: string | null;
		category_ids?: number[];
	}) => {
		const jobType = (jobData.job_type || 'full-time') as 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
		const experienceLevel = (jobData.experience_level || '') as '' | 'entry' | 'mid' | 'senior' | 'executive';
		
		setFormData({
			title: jobData.title || '',
			slug: jobData.slug || '',
			department: jobData.department || '',
			jobType: jobType,
			location: jobData.location || '',
			isRemote: jobData.is_remote || false,
			isActive: jobData.is_active ?? true,
			isFeatured: jobData.is_featured || false,
			publishedAt: convertToDateTimeLocal(jobData.published_at),
			expiresAt: convertToDateTimeLocal(jobData.expires_at),
			description: {
				overview: jobData.description?.overview || '',
				paragraphs: jobData.description?.paragraphs || [],
				salary: jobData.description?.salary && 
					jobData.description.salary.min && 
					jobData.description.salary.max && 
					jobData.description.salary.currency && 
					jobData.description.salary.period
					? {
						min: jobData.description.salary.min,
						max: jobData.description.salary.max,
						currency: jobData.description.salary.currency,
						period: jobData.description.salary.period,
						display: jobData.description.salary.display || '',
					}
					: undefined,
				requirements: jobData.description?.requirements || [],
				responsibilities: jobData.description?.responsibilities || [],
				benefits: jobData.description?.benefits || [],
				qualifications: {
					required: jobData.description?.qualifications?.required || [],
					preferred: jobData.description?.qualifications?.preferred || [],
				},
			},
			salaryMin: jobData.salary_min?.toString() || '',
			salaryMax: jobData.salary_max?.toString() || '',
			salaryCurrency: jobData.salary_currency || 'USD',
			experienceLevel: experienceLevel,
			applicationEmail: jobData.application_email || '',
			applicationUrl: jobData.application_url || '',
			applicationDeadline: convertToDateTimeLocal(jobData.application_deadline),
			metaTitle: jobData.meta_title || '',
			metaDescription: jobData.meta_description || '',
			metaKeywords: jobData.meta_keywords || '',
			categoryIds: jobData.category_ids || [],
		});
	}, []);

	// Fetch job data when in edit mode
	useEffect(() => {
		if (isEditMode && jobId) {
			const fetchJobData = async () => {
				setLoadingJobData(true);
				try {
					const response = await CareerApiService.getJobListingById(jobId);
					if (response.status === 'Success' && response.data) {
						populateFormFromJobData(response.data);
					} else {
						setSnackbar({ message: 'Failed to load job posting', type: 'error' });
						setTimeout(() => navigate('/hr/job-posting'), 2000);
					}
				} catch {
					setSnackbar({ 
						message: 'Failed to load job posting. Please try again.', 
						type: 'error' 
					});
					setTimeout(() => navigate('/hr/job-posting'), 2000);
				} finally {
					setLoadingJobData(false);
				}
			};
			fetchJobData();
		}
	}, [isEditMode, jobId, navigate, populateFormFromJobData]);

	// Helper function to filter out empty strings from arrays
	const filterEmptyStrings = (arr: string[]): string[] => {
		return arr.filter(item => item.trim() !== '');
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			setSnackbar({ message: 'Please fix the errors in the form', type: 'error' });
			return;
		}

		setIsSubmitting(true);

		try {
			// Prepare data for API - filter empty strings and format dates
			// Ensure boolean values are explicitly boolean (not strings)
			const isRemote = typeof formData.isRemote === 'boolean' ? formData.isRemote : Boolean(formData.isRemote);
			const isActive = typeof formData.isActive === 'boolean' ? formData.isActive : Boolean(formData.isActive);
			const isFeatured = typeof formData.isFeatured === 'boolean' ? formData.isFeatured : Boolean(formData.isFeatured);
			
			const apiData = {
				title: formData.title,
				slug: formData.slug || undefined, // API will auto-generate if not provided
				department: formData.department || undefined,
				job_type: formData.jobType,
				location: formData.location || undefined,
				is_remote: isRemote,
				is_active: isActive,
				is_featured: isFeatured,
				published_at: convertToISO(formData.publishedAt),
				expires_at: convertToISO(formData.expiresAt),
				description: {
					overview: formData.description.overview,
					paragraphs: filterEmptyStrings(formData.description.paragraphs),
					salary: formData.salaryMin && formData.salaryMax ? {
						min: parseFloat(formData.salaryMin),
						max: parseFloat(formData.salaryMax),
						currency: formData.salaryCurrency,
						period: (formData.description.salary?.period || 'yearly') as 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly',
						display: calculateSalaryDisplay(),
					} : undefined,
					requirements: filterEmptyStrings(formData.description.requirements),
					responsibilities: filterEmptyStrings(formData.description.responsibilities),
					benefits: filterEmptyStrings(formData.description.benefits),
					qualifications: {
						required: filterEmptyStrings(formData.description.qualifications?.required || []),
						preferred: filterEmptyStrings(formData.description.qualifications?.preferred || []),
					},
				},
				salary_min: formData.salaryMin ? parseFloat(formData.salaryMin) : undefined,
				salary_max: formData.salaryMax ? parseFloat(formData.salaryMax) : undefined,
				salary_currency: formData.salaryCurrency,
				experience_level: formData.experienceLevel || undefined,
				application_email: formData.applicationEmail || undefined,
				application_url: formData.applicationUrl || undefined,
				application_deadline: convertToISO(formData.applicationDeadline),
				meta_title: formData.metaTitle || undefined,
				meta_description: formData.metaDescription || undefined,
				meta_keywords: formData.metaKeywords || undefined,
				category_ids: formData.categoryIds.length > 0 ? formData.categoryIds : undefined,
			};

			let response;
			if (isEditMode && jobId) {
				// Update existing job
				response = await CareerApiService.updateJobListing(jobId, apiData);
				if (response.status === 'Success') {
					setSnackbar({ message: 'Job posting updated successfully!', type: 'success' });
					setTimeout(() => {
						navigate('/hr/job-posting');
					}, 1500);
				} else {
					setSnackbar({ message: response.message || 'Failed to update job posting', type: 'error' });
				}
			} else {
				// Create new job
				response = await CareerApiService.createJobListing(apiData);
				if (response.status === 'Success') {
					setSnackbar({ message: 'Job posting created successfully!', type: 'success' });
					setTimeout(() => {
						navigate('/hr/job-posting');
					}, 1500);
				} else {
					setSnackbar({ message: response.message || 'Failed to create job posting', type: 'error' });
				}
			}
		} catch {
			setSnackbar({ 
				message: `Failed to ${isEditMode ? 'update' : 'create'} job posting. Please try again.`, 
				type: 'error' 
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Show loading state while fetching job data in edit mode
	if (isEditMode && loadingJobData) {
		return (
			<div className='min-h-screen bg-gray-50 p-6 flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4'></div>
					<p className='text-gray-600'>Loading job posting...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gray-50 p-6'>
			<div className='max-w-7xl mx-auto'>
				{/* Header */}
				<div className='mb-6 flex items-center justify-between'>
					<div className='flex items-center gap-4'>
						<button
							onClick={() => navigate('/hr/job-posting')}
							className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
						>
							<ArrowLeft className='w-5 h-5 text-gray-600' />
						</button>
						<div>
							<h1 className='text-2xl font-bold text-gray-900'>
								{isEditMode ? 'Edit Job Posting' : 'Create Job Posting'}
							</h1>
							<p className='text-sm text-gray-500 mt-1'>
								{isEditMode 
									? 'Update the job posting details below' 
									: 'Add a new career opportunity to attract top talent'}
							</p>
						</div>
					</div>
				</div>

				<form onSubmit={handleSubmit} className='space-y-6'>
					{/* Basic Information */}
					<Card className='p-6'>
						<div className='flex items-center gap-2 mb-6'>
							<Briefcase className='w-5 h-5 text-green-600' />
							<h2 className='text-lg font-semibold text-gray-900'>Basic Information</h2>
						</div>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<FloatingInput
								label='Job Title'
								value={formData.title}
								onChange={handleTitleChange}
								required
								error={!!errors.title}
								errorMessage={errors.title}
							/>
							<FloatingInput
								label='URL Slug'
								value={formData.slug}
								onChange={value => setFormData(prev => ({ ...prev, slug: value }))}
								required
								error={!!errors.slug}
								errorMessage={errors.slug}
								placeholder='e.g., senior-software-engineer'
							/>
							<FloatingInput
								label='Department'
								value={formData.department}
								onChange={value => setFormData(prev => ({ ...prev, department: value }))}
								required
								error={!!errors.department}
								errorMessage={errors.department}
								placeholder='e.g., Engineering, Sales, Marketing'
							/>
							<FloatingDropdown
								label='Job Type'
								value={formData.jobType}
								onChange={value => setFormData(prev => ({ ...prev, jobType: value as 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance' }))}
								options={jobTypeOptions}
								loading={loadingJobTypes}
								required
							/>
							<div className='md:col-span-2'>
								<FloatingInput
									label='Location'
									value={formData.location}
									onChange={value => setFormData(prev => ({ ...prev, location: value }))}
									error={!!errors.location}
									errorMessage={errors.location}
									placeholder='e.g., Remote, New York, NY, Hybrid - San Francisco'
									disabled={formData.isRemote}
								/>
							</div>
							<div className='md:col-span-2'>
								<div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'>
									<div className='flex-1'>
										<label className='text-sm font-semibold text-gray-900 block mb-1'>
											Remote Position
										</label>
										<p className='text-xs text-gray-500'>
											Enable if this job can be performed remotely
										</p>
									</div>
									<Switch
										checked={formData.isRemote}
										onChange={e => setFormData(prev => ({ ...prev, isRemote: e.target.checked }))}
									/>
								</div>
							</div>
							<FloatingDropdown
								label='Experience Level'
								value={formData.experienceLevel}
								onChange={value => setFormData(prev => ({ ...prev, experienceLevel: value as 'entry' | 'mid' | 'senior' | 'executive' | '' }))}
								options={experienceLevelOptions}
								loading={loadingExperienceLevels}
							/>
							<div className='md:col-span-2'>
								<MultiSelectDropdown
									label='Categories'
									value={formData.categoryIds.map(id => id.toString())}
									onChange={values => setFormData(prev => ({
										...prev,
										categoryIds: values.map(v => parseInt(v))
									}))}
									options={categories.map(cat => ({
										value: cat.id.toString(),
										label: cat.name,
									}))}
									placeholder={loadingCategories ? 'Loading categories...' : 'Select categories...'}
									disabled={loadingCategories}
								/>
							</div>
						</div>
					</Card>

					{/* Job Description */}
					<Card className='p-6'>
						<div className='flex items-center gap-2 mb-6'>
							<FileText className='w-5 h-5 text-green-600' />
							<h2 className='text-lg font-semibold text-gray-900'>Job Description</h2>
						</div>
						<div className='space-y-6'>
							<Textarea
								label='Overview'
								value={formData.description.overview}
								onChange={e => setFormData(prev => ({
									...prev,
									description: { ...prev.description, overview: e.target.value }
								}))}
								required
								error={errors.description as string}
								placeholder='Provide a compelling overview of the role...'
								rows={4}
							/>

							{/* Description Paragraphs */}
							<div>
								<label className='text-sm font-medium text-gray-700 mb-2 block'>
									Description Paragraphs
								</label>
								{formData.description.paragraphs.map((paragraph, index) => (
									<div key={index} className='flex gap-2 mb-3'>
										<Textarea
											value={paragraph}
											onChange={e => updateListItem('paragraphs', index, e.target.value)}
											placeholder={`Paragraph ${index + 1}...`}
											rows={3}
											className='flex-1'
										/>
										{formData.description.paragraphs.length > 1 && (
											<button
												type='button'
												onClick={() => removeListItem('paragraphs', index)}
												className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
											>
												<X className='w-4 h-4' />
											</button>
										)}
									</div>
								))}
								<button
									type='button'
									onClick={() => addListItem('paragraphs')}
									className='flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium'
								>
									<Plus className='w-4 h-4' />
									Add Paragraph
								</button>
							</div>
						</div>
					</Card>

					{/* Salary Information */}
					<Card className='p-6'>
						<div className='flex items-center gap-2 mb-6'>
							<DollarSign className='w-5 h-5 text-green-600' />
							<h2 className='text-lg font-semibold text-gray-900'>Salary Information</h2>
						</div>
						<div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
							<FloatingInput
								label='Minimum Salary'
								value={formData.salaryMin}
								onChange={value => setFormData(prev => ({ ...prev, salaryMin: value }))}
								type='number'
								placeholder='80000'
							/>
							<FloatingInput
								label='Maximum Salary'
								value={formData.salaryMax}
								onChange={value => setFormData(prev => ({ ...prev, salaryMax: value }))}
								type='number'
								placeholder='120000'
							/>
							<FloatingDropdown
								label='Currency'
								value={formData.salaryCurrency}
								onChange={value => setFormData(prev => ({ ...prev, salaryCurrency: value }))}
								options={currencyOptions}
							/>
							<FloatingDropdown
								label='Period'
								value={formData.description.salary?.period || 'yearly'}
								onChange={value => setFormData(prev => ({
									...prev,
									description: {
										...prev.description,
										salary: {
											...prev.description.salary!,
											period: value,
										},
									},
								}))}
								options={salaryPeriodOptions}
							/>
						</div>
						{formData.salaryMin && formData.salaryMax && (
							<div className='mt-4 p-3 bg-green-50 rounded-lg'>
								<p className='text-sm text-gray-600'>
									<span className='font-medium'>Display:</span> {calculateSalaryDisplay()}
								</p>
							</div>
						)}
					</Card>

					{/* Requirements & Responsibilities */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<Card className='p-6'>
							<h3 className='text-md font-semibold text-gray-900 mb-4'>Requirements</h3>
							<div className='space-y-3'>
								{formData.description.requirements.map((req, index) => (
									<div key={index} className='flex gap-2'>
										<FloatingInput
											label={`Requirement ${index + 1}`}
											value={req}
											onChange={value => updateListItem('requirements', index, value)}
											placeholder={`Requirement ${index + 1}...`}
										/>
										{formData.description.requirements.length > 1 && (
											<button
												type='button'
												onClick={() => removeListItem('requirements', index)}
												className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
											>
												<X className='w-4 h-4' />
											</button>
										)}
									</div>
								))}
								<button
									type='button'
									onClick={() => addListItem('requirements')}
									className='flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium'
								>
									<Plus className='w-4 h-4' />
									Add Requirement
								</button>
							</div>
						</Card>

						<Card className='p-6'>
							<h3 className='text-md font-semibold text-gray-900 mb-4'>Responsibilities</h3>
							<div className='space-y-3'>
								{formData.description.responsibilities.map((resp, index) => (
									<div key={index} className='flex gap-2'>
										<FloatingInput
											label={`Responsibility ${index + 1}`}
											value={resp}
											onChange={value => updateListItem('responsibilities', index, value)}
											placeholder={`Responsibility ${index + 1}...`}
										/>
										{formData.description.responsibilities.length > 1 && (
											<button
												type='button'
												onClick={() => removeListItem('responsibilities', index)}
												className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
											>
												<X className='w-4 h-4' />
											</button>
										)}
									</div>
								))}
								<button
									type='button'
									onClick={() => addListItem('responsibilities')}
									className='flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium'
								>
									<Plus className='w-4 h-4' />
									Add Responsibility
								</button>
							</div>
						</Card>
					</div>

					{/* Benefits & Qualifications */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<Card className='p-6'>
							<h3 className='text-md font-semibold text-gray-900 mb-4'>Benefits</h3>
							<div className='space-y-3'>
								{formData.description.benefits.map((benefit, index) => (
									<div key={index} className='flex gap-2'>
										<FloatingInput
											label={`Benefit ${index + 1}`}
											value={benefit}
											onChange={value => updateListItem('benefits', index, value)}
											placeholder={`Benefit ${index + 1}...`}
										/>
										{formData.description.benefits.length > 1 && (
											<button
												type='button'
												onClick={() => removeListItem('benefits', index)}
												className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
											>
												<X className='w-4 h-4' />
											</button>
										)}
									</div>
								))}
								<button
									type='button'
									onClick={() => addListItem('benefits')}
									className='flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium'
								>
									<Plus className='w-4 h-4' />
									Add Benefit
								</button>
							</div>
						</Card>

						<Card className='p-6'>
							<h3 className='text-md font-semibold text-gray-900 mb-4'>Qualifications</h3>
							<div className='space-y-4'>
								<div>
									<label className='text-sm font-medium text-gray-700 mb-2 block'>Required</label>
									<div className='space-y-3'>
										{formData.description.qualifications?.required.map((qual, index) => (
											<div key={index} className='flex gap-2'>
												<FloatingInput
													label={`Required ${index + 1}`}
													value={qual}
													onChange={value => updateListItem('required', index, value)}
													placeholder={`Required qualification ${index + 1}...`}
												/>
												{formData.description.qualifications!.required.length > 1 && (
													<button
														type='button'
														onClick={() => removeListItem('required', index)}
														className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
													>
														<X className='w-4 h-4' />
													</button>
												)}
											</div>
										))}
										<button
											type='button'
											onClick={() => addListItem('required')}
											className='flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium'
										>
											<Plus className='w-4 h-4' />
											Add Required
										</button>
									</div>
								</div>
								<div>
									<label className='text-sm font-medium text-gray-700 mb-2 block'>Preferred</label>
									<div className='space-y-3'>
										{formData.description.qualifications?.preferred.map((qual, index) => (
											<div key={index} className='flex gap-2'>
												<FloatingInput
													label={`Preferred ${index + 1}`}
													value={qual}
													onChange={value => updateListItem('preferred', index, value)}
													placeholder={`Preferred qualification ${index + 1}...`}
												/>
												{formData.description.qualifications!.preferred.length > 1 && (
													<button
														type='button'
														onClick={() => removeListItem('preferred', index)}
														className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
													>
														<X className='w-4 h-4' />
													</button>
												)}
											</div>
										))}
										<button
											type='button'
											onClick={() => addListItem('preferred')}
											className='flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium'
										>
											<Plus className='w-4 h-4' />
											Add Preferred
										</button>
									</div>
								</div>
							</div>
						</Card>
					</div>

					{/* Application Information */}
					<Card className='p-6'>
						<div className='flex items-center gap-2 mb-6'>
							<Mail className='w-5 h-5 text-green-600' />
							<h2 className='text-lg font-semibold text-gray-900'>Application Information</h2>
						</div>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<FloatingInput
								label='Application Email'
								value={formData.applicationEmail}
								onChange={value => setFormData(prev => ({ ...prev, applicationEmail: value }))}
								type='email'
								placeholder='careers@company.com'
							/>
							<FloatingInput
								label='Application URL'
								value={formData.applicationUrl}
								onChange={value => setFormData(prev => ({ ...prev, applicationUrl: value }))}
								type='text'
								placeholder='https://apply.example.com/job/123'
							/>
							<FloatingInput
								label='Application Deadline'
								value={formData.applicationDeadline}
								onChange={value => setFormData(prev => ({ ...prev, applicationDeadline: value }))}
								type='date'
							/>
						</div>
					</Card>

					{/* Status & Visibility */}
					<Card className='p-6'>
						<div className='flex items-center gap-2 mb-6'>
							<Eye className='w-5 h-5 text-green-600' />
							<h2 className='text-lg font-semibold text-gray-900'>Status & Visibility</h2>
						</div>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'>
								<div className='flex-1'>
									<label className='text-sm font-semibold text-gray-900 block mb-1'>
										Active
									</label>
									<p className='text-xs text-gray-500'>
										Make this job posting visible to candidates
									</p>
								</div>
								<Switch
									checked={formData.isActive}
									onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
								/>
							</div>
							<div className='flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'>
								<div className='flex-1'>
									<label className='text-sm font-semibold text-gray-900 block mb-1'>
										Featured
									</label>
									<p className='text-xs text-gray-500'>
										Highlight this job on the careers page
									</p>
								</div>
								<Switch
									checked={formData.isFeatured}
									onChange={e => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
								/>
							</div>
							<FloatingInput
								label='Published Date'
								value={formData.publishedAt}
								onChange={value => setFormData(prev => ({ ...prev, publishedAt: value }))}
								type='datetime-local'
							/>
							<FloatingInput
								label='Expiration Date'
								value={formData.expiresAt}
								onChange={value => setFormData(prev => ({ ...prev, expiresAt: value }))}
								type='datetime-local'
							/>
						</div>
					</Card>

					{/* SEO & Metadata */}
					<Card className='p-6'>
						<div className='flex items-center gap-2 mb-6'>
							<Globe className='w-5 h-5 text-green-600' />
							<h2 className='text-lg font-semibold text-gray-900'>SEO & Metadata</h2>
						</div>
						<div className='space-y-6'>
							<FloatingInput
								label='Meta Title'
								value={formData.metaTitle}
								onChange={value => setFormData(prev => ({ ...prev, metaTitle: value }))}
								placeholder='SEO title for search engines'
							/>
							<Textarea
								label='Meta Description'
								value={formData.metaDescription}
								onChange={e => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
								placeholder='Brief description for search engine results'
								rows={3}
							/>
							<FloatingInput
								label='Meta Keywords'
								value={formData.metaKeywords}
								onChange={value => setFormData(prev => ({ ...prev, metaKeywords: value }))}
								placeholder='Comma-separated keywords (e.g., software engineer, remote, full-time)'
							/>
						</div>
					</Card>

					{/* Submit Button */}
					<div className='flex justify-end gap-4 pt-6'>
						<Button
							type='button'
							variant='outline'
							onClick={() => navigate('/hr/job-posting')}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button
							type='submit'
							disabled={isSubmitting}
							className='min-w-[120px]'
						>
							{isSubmitting 
								? (isEditMode ? 'Updating...' : 'Creating...') 
								: (isEditMode ? 'Update Job Posting' : 'Create Job Posting')}
						</Button>
					</div>
				</form>
			</div>

			{snackbar && (
				<Snackbar
					message={snackbar.message}
					type={snackbar.type}
					open={!!snackbar}
					onClose={() => setSnackbar(null)}
				/>
			)}
		</div>
	);
};
