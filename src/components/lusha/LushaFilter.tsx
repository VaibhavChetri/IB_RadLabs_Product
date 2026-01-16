/**
 * Lusha Filter Component - Horizontal Filter Bar Design
 * Clean horizontal filter interface
 */

import React, { useState, useEffect } from 'react';
import { X, Filter, Search, Users, Building2, MapPin, Briefcase, Sparkles } from 'lucide-react';
import { MultiSelectDropdown } from '../ui/MultiSelectDropdown';
import { FloatingDropdown } from '../ui/FloatingDropdown';
import { FloatingInput } from '../ui/FloatingInput';
import { AsyncAutocomplete } from '../ui/AsyncAutocomplete';
import { Button } from '../ui/Button';
import { LushaApiService, Location } from '../../services/lushaApi';
import { cn } from '../../utils/cn';

export interface LushaFilters {
	departments: string[];
	seniority: string[];
	jobTitle: string;
	industries: string[];
	location: Location | null;
	companyName: string;
	technologies: string[];
}

interface LushaFilterProps {
	onApplyFilters: (filters: LushaFilters) => void;
	onClearFilters: () => void;
	className?: string;
}

export const LushaFilter: React.FC<LushaFilterProps> = ({
	onApplyFilters,
	onClearFilters,
	className,
}) => {
	const [loading, setLoading] = useState(true);
	const [showAdvanced, setShowAdvanced] = useState(false);
	
	// Filter options from API
	const [departments, setDepartments] = useState<string[]>([]);
	const [seniorityOptions, setSeniorityOptions] = useState<Array<{ id: number; name: string }>>([]);
	const [industryOptions, setIndustryOptions] = useState<Array<{ value: string; label: string }>>([]);

	// Filter state
	const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
	const [selectedSeniority, setSelectedSeniority] = useState<string>('');
	const [jobTitle, setJobTitle] = useState<string>('');
	const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
	const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
	const [companyName, setCompanyName] = useState<string>('');
	const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);

	// Load filter options on mount
	useEffect(() => {
		const loadFilters = async () => {
			setLoading(true);
			try {
				// Load contact filters
				const contactFiltersResponse = await LushaApiService.getContactFilters();
				if (contactFiltersResponse.status_code === 200) {
					const contactData = contactFiltersResponse.data;
					setDepartments(contactData.departments || []);
					setSeniorityOptions(contactData.seniority || []);
				}

				// Load company filters
				const companyFiltersResponse = await LushaApiService.getCompanyFilters();
				if (companyFiltersResponse.status_code === 200) {
					const companyData = companyFiltersResponse.data;
					// Flatten industries: main_industry and all sub_industries
					const industries: Array<{ value: string; label: string }> = [];
					if (companyData.industries && Array.isArray(companyData.industries)) {
						companyData.industries.forEach((industry: any) => {
							// Add main industry
							industries.push({
								value: industry.main_industry,
								label: industry.main_industry,
							});
							// Add sub industries
							if (industry.sub_industries && Array.isArray(industry.sub_industries)) {
								industry.sub_industries.forEach((sub: any) => {
									industries.push({
										value: sub.value || sub.id?.toString() || '',
										label: sub.value || '',
									});
								});
							}
						});
					}
					setIndustryOptions(industries);
				}
			} catch (error) {
				console.error('Failed to load filter options:', error);
			} finally {
				setLoading(false);
			}
		};

		loadFilters();
	}, []);

	const handleApplyFilters = () => {
		const filters: LushaFilters = {
			departments: selectedDepartments,
			seniority: selectedSeniority ? [selectedSeniority] : [],
			jobTitle,
			industries: selectedIndustries,
			location: selectedLocation,
			companyName,
			technologies: selectedTechnologies,
		};
		onApplyFilters(filters);
	};

	const handleClearFilters = () => {
		setSelectedDepartments([]);
		setSelectedSeniority('');
		setJobTitle('');
		setSelectedIndustries([]);
		setSelectedLocation(null);
		setCompanyName('');
		setSelectedTechnologies([]);
		onClearFilters();
	};

	const hasActiveFilters =
		selectedDepartments.length > 0 ||
		selectedSeniority !== '' ||
		jobTitle !== '' ||
		selectedIndustries.length > 0 ||
		selectedLocation !== null ||
		companyName !== '' ||
		selectedTechnologies.length > 0;

	const activeFilterCount = [
		selectedDepartments.length,
		selectedSeniority ? 1 : 0,
		jobTitle ? 1 : 0,
		selectedIndustries.length,
		selectedLocation ? 1 : 0,
		companyName ? 1 : 0,
		selectedTechnologies.length,
	].reduce((a, b) => a + b, 0);

	return (
		<div
			className={cn(
				'bg-white border border-gray-200 rounded-lg shadow-sm',
				className
			)}
		>
			{loading ? (
				<div className='flex items-center justify-center py-8 px-6'>
					<div className='animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600 mr-3'></div>
					<p className='text-sm text-gray-500'>Loading filters...</p>
				</div>
			) : (
				<>
					{/* Main Filter Row */}
					<div className='p-4'>
						<div className='flex flex-wrap items-end gap-3'>
							{/* Departments */}
							<div className='flex-1 min-w-[200px]'>
								<MultiSelectDropdown
									label='Departments'
									options={departments.map(dept => ({ value: dept, label: dept }))}
									value={selectedDepartments}
									onChange={setSelectedDepartments}
									placeholder='All departments'
									searchable
									showSelectedCount
								/>
							</div>

							{/* Seniority */}
							<div className='w-48'>
								<FloatingDropdown
									label='Seniority'
									options={seniorityOptions.map(s => ({
										value: s.id.toString(),
										label: s.name.charAt(0).toUpperCase() + s.name.slice(1),
									}))}
									value={selectedSeniority}
									onChange={setSelectedSeniority}
									placeholder='All levels'
									searchable
								/>
							</div>

							{/* Job Title */}
							<div className='w-56'>
								<FloatingInput
									label='Job Title'
									value={jobTitle}
									onChange={setJobTitle}
									placeholder='e.g., CTO, VP'
								/>
							</div>

							{/* Industries */}
							<div className='flex-1 min-w-[200px]'>
								<MultiSelectDropdown
									label='Industries'
									options={industryOptions.map(ind => ({
										value: ind.value,
										label: ind.label,
									}))}
									value={selectedIndustries}
									onChange={setSelectedIndustries}
									placeholder='All industries'
									searchable
									showSelectedCount
								/>
							</div>

							{/* Company Name */}
							<div className='w-56'>
								<label className='block text-xs font-medium text-gray-700 mb-1.5'>
									Company
								</label>
								<AsyncAutocomplete
									label=''
									value={companyName}
									onChange={setCompanyName}
									onSelect={(item) => {
										const value = typeof item === 'string' ? item : item.label;
										setCompanyName(value);
									}}
									searchFn={async (text) => {
										const response = await LushaApiService.searchCompanyNames(text);
										if (response.status_code === 200 && Array.isArray(response.data)) {
											return response.data;
										}
										return [];
									}}
									placeholder='Search company...'
								/>
							</div>

							{/* Action Buttons */}
							<div className='flex items-end gap-2'>
								<Button
									onClick={handleApplyFilters}
									className={cn(
										'px-6 py-2.5 font-medium',
										hasActiveFilters
											? 'bg-gray-900 text-white hover:bg-gray-800'
											: 'bg-gray-100 text-gray-400 cursor-not-allowed'
									)}
									disabled={!hasActiveFilters}
								>
									<Search className='h-4 w-4 mr-1.5' />
									Search
								</Button>
								{hasActiveFilters && (
									<button
										onClick={handleClearFilters}
										className='px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors'
									>
										<X className='h-4 w-4' />
									</button>
								)}
							</div>
						</div>

						{/* Advanced Filters Toggle */}
						<div className='mt-3 pt-3 border-t border-gray-100'>
							<button
								onClick={() => setShowAdvanced(!showAdvanced)}
								className='text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1.5'
							>
								<Filter className='h-3.5 w-3.5' />
								{showAdvanced ? 'Hide' : 'Show'} Advanced Filters
								{!showAdvanced && activeFilterCount > 0 && (
									<span className='ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs'>
										{activeFilterCount}
									</span>
								)}
							</button>
						</div>
					</div>

					{/* Advanced Filters Section */}
					{showAdvanced && (
						<div className='px-4 pb-4 border-t border-gray-100 bg-gray-50/50'>
							<div className='pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
								{/* Location */}
								<div>
									<label className='block text-xs font-medium text-gray-700 mb-1.5'>
										<MapPin className='h-3.5 w-3.5 inline mr-1' />
										Location
									</label>
									<AsyncAutocomplete
										label=''
										value={selectedLocation ? `${selectedLocation.city}, ${selectedLocation.state}` : ''}
										onChange={(value) => {
											if (!value) {
												setSelectedLocation(null);
											}
										}}
										onSelect={(item) => {
											if (typeof item === 'object' && item.value) {
												setSelectedLocation(item.value);
											}
										}}
										searchFn={async (text) => {
											const response = await LushaApiService.searchLocations(text, 'contact');
											if (response.status_code === 200 && Array.isArray(response.data)) {
												return response.data.map((loc: Location) => ({
													label: `${loc.city}, ${loc.state}, ${loc.country}`,
													value: loc,
												}));
											}
											return [];
										}}
										formatItem={(item) => {
											if (typeof item === 'object' && item.value) {
												const loc = item.value as Location;
												return `${loc.city}, ${loc.state}`;
											}
											return typeof item === 'string' ? item : item.label;
										}}
										placeholder='Search location...'
									/>
								</div>

								{/* Technologies */}
								<div>
									<label className='block text-xs font-medium text-gray-700 mb-1.5'>
										<Sparkles className='h-3.5 w-3.5 inline mr-1' />
										Technologies
									</label>
									<AsyncAutocomplete
										label=''
										value=''
										onChange={() => {}}
										onSelect={(item) => {
											const value = typeof item === 'string' ? item : item.label;
											if (value && !selectedTechnologies.includes(value)) {
												setSelectedTechnologies(prev => [...prev, value]);
											}
										}}
										searchFn={async (text) => {
											const response = await LushaApiService.searchTechnologies(text);
											if (response.status_code === 200 && Array.isArray(response.data)) {
												return response.data;
											}
											return [];
										}}
										placeholder='Search technologies...'
									/>
									{selectedTechnologies.length > 0 && (
										<div className='flex flex-wrap gap-1.5 mt-2'>
											{selectedTechnologies.map(tech => (
												<span
													key={tech}
													className='inline-flex items-center gap-1 bg-white text-gray-700 px-2 py-1 rounded text-xs border border-gray-200'
												>
													{tech}
													<button
														type='button'
														onClick={() => {
															setSelectedTechnologies(prev =>
																prev.filter(t => t !== tech)
															);
														}}
														className='text-gray-400 hover:text-gray-600 transition-colors'
													>
														<X className='h-3 w-3' />
													</button>
												</span>
											))}
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};
