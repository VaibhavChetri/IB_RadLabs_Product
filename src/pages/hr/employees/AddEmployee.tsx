/**
 * Add/Edit Employee Page
 * Handles creating new employees and editing existing ones
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { FloatingInput, FloatingDropdown, Snackbar } from '../../../components/ui';
import { Textarea } from '../../../components/ui/Input';
import { Switch } from '../../../components/ui/Form';
import {
	HrmApiService,
	CreateEmployeeRequest,
	HrmEmployee,
} from '../../../services/hrmApi';
import {
	useDepartmentOptions,
	useDesignationOptions,
	useEmployeeManagerOptions,
	useUserOptions,
	GENDER_OPTIONS,
	EMPLOYMENT_TYPE_OPTIONS,
	EMPLOYEE_STATUS_OPTIONS,
} from '../../../features/hrm';

interface FormData {
	employee_code: string;
	first_name: string;
	last_name: string;
	gender: string;
	email: string;
	personal_email: string;
	phone: string;
	whatsapp_opt_in: boolean;
	city: string;
	address: string;
	team: string;
	date_of_joining: string;
	date_of_birth: string;
	department_id: string;
	designation_id: string;
	primary_manager_id: string;
	admin_id: string;
	employment_type: string;
	status: string;
	annual_ctc: string;
	monthly_salary: string;
	bonus_variable_yearly: string;
	joining_bonus: string;
	emergency_contact_name: string;
	emergency_contact_number: string;
	emergency_contact_relation: string;
	pan_number: string;
	aadhaar_number: string;
	uan_number: string;
	bank_account_number: string;
	bank_ifsc: string;
	is_active: boolean;
}

const initialFormData: FormData = {
	employee_code: '',
	first_name: '',
	last_name: '',
	gender: '',
	email: '',
	personal_email: '',
	phone: '',
	whatsapp_opt_in: true,
	city: '',
	address: '',
	team: '',
	date_of_joining: '',
	date_of_birth: '',
	department_id: '',
	designation_id: '',
	primary_manager_id: '',
	admin_id: '',
	employment_type: 'full_time',
	status: 'active',
	annual_ctc: '',
	monthly_salary: '',
	bonus_variable_yearly: '',
	joining_bonus: '',
	emergency_contact_name: '',
	emergency_contact_number: '',
	emergency_contact_relation: '',
	pan_number: '',
	aadhaar_number: '',
	uan_number: '',
	bank_account_number: '',
	bank_ifsc: '',
	is_active: true,
};

const EMERGENCY_CONTACT_RELATION_OPTIONS = [
	{ value: '', label: 'Select relation' },
	{ value: 'Spouse', label: 'Spouse' },
	{ value: 'Parent', label: 'Parent' },
	{ value: 'Sibling', label: 'Sibling' },
	{ value: 'Child', label: 'Child' },
	{ value: 'Friend', label: 'Friend' },
	{ value: 'Relative', label: 'Relative' },
	{ value: 'Other', label: 'Other' },
];

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidPhone = (value: string) => /^[+]?[0-9()\-\s]{7,20}$/.test(value);

const parseOptionalDecimal = (value: string) => {
	if (!value.trim()) return null;

	const amount = Number(value);
	return Number.isNaN(amount) ? null : amount;
};

export const AddEmployee: React.FC = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const isEditing = Boolean(id);

	const [formData, setFormData] = useState<FormData>(initialFormData);
	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({
		open: false,
		message: '',
		type: 'success',
	});

	// Fetch dropdown options
	const { data: deptData } = useDepartmentOptions();
	const { data: desigData } = useDesignationOptions();
	const { data: managerRaw, isLoading: managerOptionsLoading } = useEmployeeManagerOptions();
	const { data: usersRaw, isLoading: userOptionsLoading } = useUserOptions();

	const departmentOptions = React.useMemo(() => {
		const raw = deptData as any;
		const depts = raw?.data?.data || raw?.data || raw || [];
		const items = Array.isArray(depts) ? depts : [];
		return items.map((d: any) => ({ value: String(d.id), label: d.name }));
	}, [deptData]);

	const designationOptions = React.useMemo(() => {
		const raw = desigData as any;
		const desigs = raw?.data?.data || raw?.data || raw || [];
		const items = Array.isArray(desigs) ? desigs : [];
		return items.map((d: any) => ({ value: String(d.id), label: d.title }));
	}, [desigData]);

	const userOptions = React.useMemo(() => {
		const list = Array.isArray(usersRaw) ? usersRaw : [];
		return [
			{ value: '', label: 'No linked account' },
			...list.map((u: any) => ({
				value: String(u.id),
				label: `${u.firstName || ''} ${u.lastName || ''}`.trim() + ` (${u.username})`,
			})),
		];
	}, [usersRaw]);

	const managerOptions = React.useMemo(() => {
		const raw = managerRaw as any;
		const list = raw?.data?.data || raw?.data || raw || [];
		const items = Array.isArray(list) ? list : [];
		const selfId = id ? parseInt(id, 10) : NaN;
		const mapped = items
			.filter((e: { id?: number }) => e?.id != null && Number(e.id) !== selfId)
			.map((e: HrmEmployee & { employee_code?: string }) => ({
				value: String(e.id),
				label: `${e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim()} (${e.employee_code ?? e.id})`,
			}));
		return [{ value: '', label: 'No manager' }, ...mapped];
	}, [managerRaw, id]);

	// Filter out empty-value options for form dropdowns
	const employmentTypeFormOptions = EMPLOYMENT_TYPE_OPTIONS.filter(o => o.value !== '');
	const statusFormOptions = EMPLOYEE_STATUS_OPTIONS.filter(o => o.value !== '');

	// Fetch employee data if editing
	const fetchEmployee = useCallback(async () => {
		if (!id) return;
		setFetching(true);
		try {
			const response = await HrmApiService.getEmployee(parseInt(id, 10));
			const emp = (response.data as any)?.data || response.data as HrmEmployee;
			setFormData({
				employee_code: emp.employee_code || '',
				first_name: emp.first_name || '',
				last_name: emp.last_name || '',
				gender: emp.gender || '',
				email: emp.email || '',
				personal_email: (emp as any).personal_email || '',
				phone: emp.phone || '',
				whatsapp_opt_in: emp.whatsapp_opt_in ?? true,
				city: (emp as any).city || '',
				address: (emp as any).address || '',
				team: (emp as any).team || '',
				date_of_joining: emp.date_of_joining ? emp.date_of_joining.split('T')[0] : '',
				date_of_birth: emp.date_of_birth ? emp.date_of_birth.split('T')[0] : '',
				department_id: emp.department_id ? String(emp.department_id) : '',
				designation_id: emp.designation_id ? String(emp.designation_id) : '',
				primary_manager_id: emp.primary_manager_id ? String(emp.primary_manager_id) : '',
				admin_id: emp.admin_id ? String(emp.admin_id) : '',
				employment_type: emp.employment_type || 'full_time',
				status: emp.status || 'active',
				annual_ctc: (emp as any).annual_ctc != null ? String((emp as any).annual_ctc) : '',
				monthly_salary: (emp as any).monthly_salary != null ? String((emp as any).monthly_salary) : '',
				bonus_variable_yearly:
					(emp as any).bonus_variable_yearly != null ? String((emp as any).bonus_variable_yearly) : '',
				joining_bonus: (emp as any).joining_bonus != null ? String((emp as any).joining_bonus) : '',
				emergency_contact_name: (emp as any).emergency_contact_name || '',
				emergency_contact_number: (emp as any).emergency_contact_number || '',
				emergency_contact_relation: (emp as any).emergency_contact_relation || '',
				pan_number: (emp as any).pan_number || '',
				aadhaar_number: (emp as any).aadhaar_number || '',
				uan_number: (emp as any).uan_number || '',
				bank_account_number: (emp as any).bank_account_number || '',
				bank_ifsc: (emp as any).bank_ifsc || '',
				is_active: emp.is_active ?? true,
			});
		} catch {
			setSnackbar({ open: true, message: 'Failed to load employee', type: 'error' });
		} finally {
			setFetching(false);
		}
	}, [id]);

	useEffect(() => {
		if (isEditing) {
			fetchEmployee();
		}
	}, [isEditing, fetchEmployee]);

	const handleChange = (key: keyof FormData, value: string | boolean) => {
		setFormData(prev => ({ ...prev, [key]: value }));
		if (errors[key]) {
			setErrors(prev => {
				const next = { ...prev };
				delete next[key];
				return next;
			});
		}
	};

	const validate = (): boolean => {
		const newErrors: Record<string, string> = {};
		if (!formData.employee_code.trim()) newErrors.employee_code = 'Employee code is required';
		if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
		if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
		if (!formData.email.trim()) newErrors.email = 'Email is required';
		else if (!isValidEmail(formData.email.trim())) newErrors.email = 'Enter a valid work email';
		if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
		else if (!isValidPhone(formData.phone.trim())) newErrors.phone = 'Enter a valid phone number';
		if (!formData.date_of_joining) newErrors.date_of_joining = 'Date of joining is required';
		if (!formData.gender) newErrors.gender = 'Gender is required';
		if (formData.personal_email.trim() && !isValidEmail(formData.personal_email.trim())) {
			newErrors.personal_email = 'Enter a valid personal email';
		}
		if (
			formData.emergency_contact_number.trim() &&
			!isValidPhone(formData.emergency_contact_number.trim())
		) {
			newErrors.emergency_contact_number = 'Enter a valid emergency contact number';
		}
		(['annual_ctc', 'monthly_salary', 'bonus_variable_yearly', 'joining_bonus'] as const).forEach(
			field => {
				const value = formData[field];
				if (!value.trim()) return;

				const amount = Number(value);
				if (Number.isNaN(amount) || amount <= 0) {
					newErrors[field] = 'Enter a number greater than 0';
				}
			}
		);
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async () => {
		if (!validate()) return;

		setLoading(true);
		try {
			const payload: CreateEmployeeRequest = {
				employee_code: formData.employee_code.trim(),
				first_name: formData.first_name.trim(),
				last_name: formData.last_name.trim(),
				gender: formData.gender,
				email: formData.email.trim(),
				personal_email: formData.personal_email.trim() || null,
				phone: formData.phone.trim(),
				whatsapp_opt_in: Boolean(formData.whatsapp_opt_in),
				city: formData.city.trim() || null,
				address: formData.address.trim() || null,
				team: formData.team.trim() || null,
				date_of_joining: formData.date_of_joining,
				employment_type: formData.employment_type,
				status: formData.status,
				annual_ctc: parseOptionalDecimal(formData.annual_ctc),
				monthly_salary: parseOptionalDecimal(formData.monthly_salary),
				bonus_variable_yearly: parseOptionalDecimal(formData.bonus_variable_yearly),
				joining_bonus: parseOptionalDecimal(formData.joining_bonus),
				emergency_contact_name: formData.emergency_contact_name.trim() || null,
				emergency_contact_number: formData.emergency_contact_number.trim() || null,
				emergency_contact_relation: formData.emergency_contact_relation || null,
				is_active: Boolean(formData.is_active),
			};

			if (formData.date_of_birth) payload.date_of_birth = formData.date_of_birth;
			if (formData.department_id) payload.department_id = parseInt(formData.department_id, 10);
			if (formData.designation_id) payload.designation_id = parseInt(formData.designation_id, 10);
			payload.primary_manager_id = formData.primary_manager_id
				? parseInt(formData.primary_manager_id, 10)
				: null;
			payload.admin_id = formData.admin_id ? parseInt(formData.admin_id, 10) : null;
			if (formData.pan_number) payload.pan_number = formData.pan_number.trim();
			if (formData.aadhaar_number) payload.aadhaar_number = formData.aadhaar_number.trim();
			if (formData.uan_number) payload.uan_number = formData.uan_number.trim();
			if (formData.bank_account_number) payload.bank_account_number = formData.bank_account_number.trim();
			if (formData.bank_ifsc) payload.bank_ifsc = formData.bank_ifsc.trim();

			if (isEditing) {
				await HrmApiService.updateEmployee(parseInt(id!, 10), payload);
				setSnackbar({ open: true, message: 'Employee updated successfully', type: 'success' });
			} else {
				await HrmApiService.createEmployee(payload);
				setSnackbar({ open: true, message: 'Employee created successfully', type: 'success' });
			}

			setTimeout(() => navigate('/hr/employees'), 1000);
		} catch (err: any) {
			const message = err?.message || `Failed to ${isEditing ? 'update' : 'create'} employee`;
			setSnackbar({ open: true, message, type: 'error' });
		} finally {
			setLoading(false);
		}
	};

	if (fetching) {
		return (
			<div className='min-h-screen bg-white p-4'>
				<div className='max-w-4xl mx-auto'>
					<div className='animate-pulse space-y-4'>
						<div className='h-8 bg-gray-200 rounded w-1/3'></div>
						<div className='h-64 bg-gray-100 rounded'></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-4xl mx-auto'>
				{/* Header */}
				<div className='flex items-center gap-4 mb-6'>
					<button
						onClick={() => navigate('/hr/employees')}
						className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
					>
						<ArrowLeft className='w-5 h-5' />
					</button>
					<h1 className='text-2xl font-bold text-gray-900'>
						{isEditing ? 'Edit Employee' : 'Add Employee'}
					</h1>
				</div>

				{/* Basic Information */}
				<Card className='p-6 mb-6'>
					<h2 className='text-lg font-semibold text-gray-900 mb-4'>Basic Information</h2>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						<FloatingInput
							label='Employee Code *'
							value={formData.employee_code}
							onChange={(value: string) => handleChange('employee_code', value)}
							placeholder='e.g. IB-001'
							error={!!errors.employee_code}
							errorMessage={errors.employee_code}
						/>
						<FloatingInput
							label='First Name *'
							value={formData.first_name}
							onChange={(value: string) => handleChange('first_name', value)}
							placeholder='First name'
							error={!!errors.first_name}
							errorMessage={errors.first_name}
						/>
						<FloatingInput
							label='Last Name *'
							value={formData.last_name}
							onChange={(value: string) => handleChange('last_name', value)}
							placeholder='Last name'
							error={!!errors.last_name}
							errorMessage={errors.last_name}
						/>
						<FloatingDropdown
							label='Gender *'
							options={GENDER_OPTIONS}
							value={formData.gender}
							onChange={(value: string) => handleChange('gender', value)}
							placeholder='Select gender'
						/>
						<FloatingInput
							label='Email *'
							value={formData.email}
							onChange={(value: string) => handleChange('email', value)}
							placeholder='email@example.com'
							error={!!errors.email}
							errorMessage={errors.email}
						/>
						<FloatingInput
							label='Personal Email'
							value={formData.personal_email}
							onChange={(value: string) => handleChange('personal_email', value)}
							placeholder='personal@example.com'
							error={!!errors.personal_email}
							errorMessage={errors.personal_email}
						/>
						<FloatingInput
							label='Phone *'
							value={formData.phone}
							onChange={(value: string) => handleChange('phone', value)}
							placeholder='+91-9876543210'
							error={!!errors.phone}
							errorMessage={errors.phone}
						/>
						<FloatingInput
							label='City'
							value={formData.city}
							onChange={(value: string) => handleChange('city', value)}
							placeholder='City of residence'
						/>
						<FloatingInput
							label='Date of Birth'
							value={formData.date_of_birth}
							onChange={(value: string) => handleChange('date_of_birth', value)}
							placeholder='YYYY-MM-DD'
							type='date'
						/>
						<FloatingInput
							label='Date of Joining *'
							value={formData.date_of_joining}
							onChange={(value: string) => handleChange('date_of_joining', value)}
							placeholder='YYYY-MM-DD'
							type='date'
							error={!!errors.date_of_joining}
							errorMessage={errors.date_of_joining}
						/>
						<FloatingInput
							label='Team'
							value={formData.team}
							onChange={(value: string) => handleChange('team', value)}
							placeholder='Team / division name'
						/>
						<div className='flex items-center gap-3 pt-2'>
							<Switch
								checked={formData.whatsapp_opt_in}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('whatsapp_opt_in', e.target.checked)}
							/>
							<span className='text-sm text-gray-700'>WhatsApp Opt-in</span>
						</div>
					</div>
					<div className='mt-4'>
						<Textarea
							label='Address'
							value={formData.address}
							onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('address', e.target.value)}
							placeholder='Full residential address'
							rows={4}
						/>
					</div>
				</Card>

				{/* Organization */}
				<Card className='p-6 mb-6'>
					<h2 className='text-lg font-semibold text-gray-900 mb-4'>Organization</h2>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						<FloatingDropdown
							label='Department'
							options={departmentOptions}
							value={formData.department_id}
							onChange={(value: string) => handleChange('department_id', value)}
							placeholder='Select department'
						/>
						<FloatingDropdown
							label='Designation'
							options={designationOptions}
							value={formData.designation_id}
							onChange={(value: string) => handleChange('designation_id', value)}
							placeholder='Select designation'
						/>
						<FloatingDropdown
							label='Manager'
							options={managerOptions}
							value={formData.primary_manager_id}
							onChange={(value: string) => handleChange('primary_manager_id', value)}
							placeholder='Select manager'
							loading={managerOptionsLoading}
						/>
						<FloatingDropdown
							label='Linked System User'
							options={userOptions}
							value={formData.admin_id}
							onChange={(value: string) => handleChange('admin_id', value)}
							placeholder='Select system user'
							loading={userOptionsLoading}
							searchable
						/>
						<FloatingDropdown
							label='Employment Type'
							options={employmentTypeFormOptions}
							value={formData.employment_type}
							onChange={(value: string) => handleChange('employment_type', value)}
							placeholder='Select type'
						/>
						<FloatingDropdown
							label='Status'
							options={statusFormOptions}
							value={formData.status}
							onChange={(value: string) => handleChange('status', value)}
							placeholder='Select status'
						/>
						<div className='flex items-center gap-3 pt-2'>
							<Switch
								checked={formData.is_active}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('is_active', e.target.checked)}
							/>
							<span className='text-sm text-gray-700'>Active</span>
						</div>
					</div>
				</Card>

				{/* Compensation */}
				<Card className='p-6 mb-6'>
					<h2 className='text-lg font-semibold text-gray-900 mb-4'>Compensation</h2>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
						<FloatingInput
							label='Annual CTC'
							value={formData.annual_ctc}
							onChange={(value: string) => handleChange('annual_ctc', value)}
							placeholder='2500000'
							type='number'
							error={!!errors.annual_ctc}
							errorMessage={errors.annual_ctc}
						/>
						<FloatingInput
							label='Monthly Salary'
							value={formData.monthly_salary}
							onChange={(value: string) => handleChange('monthly_salary', value)}
							placeholder='208333.33'
							type='number'
							error={!!errors.monthly_salary}
							errorMessage={errors.monthly_salary}
						/>
						<FloatingInput
							label='Yearly Bonus'
							value={formData.bonus_variable_yearly}
							onChange={(value: string) => handleChange('bonus_variable_yearly', value)}
							placeholder='500000'
							type='number'
							error={!!errors.bonus_variable_yearly}
							errorMessage={errors.bonus_variable_yearly}
						/>
						<FloatingInput
							label='Joining Bonus'
							value={formData.joining_bonus}
							onChange={(value: string) => handleChange('joining_bonus', value)}
							placeholder='100000'
							type='number'
							error={!!errors.joining_bonus}
							errorMessage={errors.joining_bonus}
						/>
					</div>
				</Card>

				{/* Emergency Contact */}
				<Card className='p-6 mb-6'>
					<h2 className='text-lg font-semibold text-gray-900 mb-4'>Emergency Contact</h2>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						<FloatingInput
							label='Contact Name'
							value={formData.emergency_contact_name}
							onChange={(value: string) => handleChange('emergency_contact_name', value)}
							placeholder='Emergency contact name'
						/>
						<FloatingDropdown
							label='Relation'
							options={EMERGENCY_CONTACT_RELATION_OPTIONS}
							value={formData.emergency_contact_relation}
							onChange={(value: string) => handleChange('emergency_contact_relation', value)}
							placeholder='Select relation'
						/>
						<FloatingInput
							label='Phone Number'
							value={formData.emergency_contact_number}
							onChange={(value: string) => handleChange('emergency_contact_number', value)}
							placeholder='+91-9876543211'
							error={!!errors.emergency_contact_number}
							errorMessage={errors.emergency_contact_number}
						/>
					</div>
				</Card>

				{/* Statutory & Bank Details */}
				<Card className='p-6 mb-6'>
					<h2 className='text-lg font-semibold text-gray-900 mb-4'>Statutory & Bank Details</h2>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						<FloatingInput
							label='PAN Number'
							value={formData.pan_number}
							onChange={(value: string) => handleChange('pan_number', value.toUpperCase())}
							placeholder='ABCDE1234F'
						/>
						<FloatingInput
							label='Aadhaar Number'
							value={formData.aadhaar_number}
							onChange={(value: string) => handleChange('aadhaar_number', value)}
							placeholder='12 digit Aadhaar'
						/>
						<FloatingInput
							label='UAN Number'
							value={formData.uan_number}
							onChange={(value: string) => handleChange('uan_number', value)}
							placeholder='UAN for PF'
						/>
						<FloatingInput
							label='Bank Account Number'
							value={formData.bank_account_number}
							onChange={(value: string) => handleChange('bank_account_number', value)}
							placeholder='Account number'
						/>
						<FloatingInput
							label='Bank IFSC'
							value={formData.bank_ifsc}
							onChange={(value: string) => handleChange('bank_ifsc', value.toUpperCase())}
							placeholder='HDFC0001234'
						/>
					</div>
				</Card>

				{/* Submit */}
				<div className='flex items-center justify-end gap-3'>
					<Button
						variant='secondary'
						onClick={() => navigate('/hr/employees')}
					>
						Cancel
					</Button>
					<Button
						variant='primary'
						onClick={handleSubmit}
						disabled={loading}
					>
						{loading
							? isEditing
								? 'Updating...'
								: 'Creating...'
							: isEditing
								? 'Update Employee'
								: 'Create Employee'}
					</Button>
				</div>
			</div>

			<Snackbar
				message={snackbar.message}
				type={snackbar.type}
				open={snackbar.open}
				onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
			/>
		</div>
	);
};

export default AddEmployee;
