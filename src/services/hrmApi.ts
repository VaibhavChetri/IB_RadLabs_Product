/**
 * HRM API Service
 * Handles all HRM-related API operations: Employees, Departments, Designations,
 * Salary Structures, Tax Declarations, and Hierarchies
 */

import { ApiService, ApiResponse } from './api';

const api = ApiService.getInstance();
const BASE_PATH = '/hrm';

/** HRM list endpoints reject `limit` above this value. */
const HRM_LIST_LIMIT_MAX = 100;

function clampHrmListLimit(limit: number): number {
	return Math.min(Math.max(1, limit), HRM_LIST_LIMIT_MAX);
}

// ─── Shared Types ────────────────────────────────────────────────────────────

export interface HrmPagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface HrmListResponse<T> {
	success: string;
	data: T[];
	pagination: HrmPagination;
}

// ─── Employee Types ──────────────────────────────────────────────────────────

export interface HrmEmployee {
	id: number;
	employee_code: string;
	first_name: string;
	last_name: string;
	full_name: string;
	gender: string;
	email: string;
	phone: string;
	whatsapp_opt_in: boolean;
	date_of_joining: string;
	date_of_birth: string;
	date_of_exit: string | null;
	department_id: number | null;
	department_name: string | null;
	designation_id: number | null;
	designation_title: string | null;
	employment_type: string;
	status: string;
	state_id: number | null;
	state_name: string | null;
	pt_state_id: number | null;
	pt_state_name: string | null;
	lwf_state_id: number | null;
	lwf_state_name: string | null;
	primary_manager_id: number | null;
	primary_manager_name: string | null;
	admin_id: number | null;
	is_active: boolean;
}

export interface HrmEmployeeFilters {
	page?: number;
	limit?: number;
	q?: string;
	department_id?: number;
	designation_id?: number;
	manager_id?: number;
	status?: string;
	employment_type?: string;
	is_active?: boolean;
}

export interface CreateEmployeeRequest {
	employee_code: string;
	first_name: string;
	last_name: string;
	gender: string;
	email: string;
	phone: string;
	whatsapp_opt_in?: boolean;
	date_of_joining: string;
	date_of_birth?: string;
	department_id?: number;
	designation_id?: number;
	/** Reporting manager; omit or set null to clear */
	primary_manager_id?: number | null;
	/** Linked admin/user account; omit or set null to clear */
	admin_id?: number | null;
	employment_type: string;
	status?: string;
	pan_number?: string;
	aadhaar_number?: string;
	uan_number?: string;
	bank_account_number?: string;
	bank_ifsc?: string;
	state_id?: number;
	pt_state_id?: number;
	lwf_state_id?: number | null;
	is_active?: boolean;
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {}

// ─── Department Types ────────────────────────────────────────────────────────

export interface HrmDepartment {
	id: number;
	name: string;
	code: string;
	parent_department_id: number | null;
	is_active: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface HrmDepartmentFilters {
	page?: number;
	limit?: number;
	q?: string;
	parent_department_id?: number;
	is_active?: boolean;
}

export interface CreateDepartmentRequest {
	name: string;
	code: string;
	parent_department_id?: number | null;
	is_active?: boolean;
}

export interface UpdateDepartmentRequest extends Partial<CreateDepartmentRequest> {}

// ─── Designation Types ───────────────────────────────────────────────────────

export interface HrmDesignation {
	id: number;
	title: string;
	level: number;
	is_active: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface HrmDesignationFilters {
	page?: number;
	limit?: number;
	q?: string;
	level?: number;
	is_active?: boolean;
}

export interface CreateDesignationRequest {
	title: string;
	level: number;
	is_active?: boolean;
}

export interface UpdateDesignationRequest extends Partial<CreateDesignationRequest> {}

// ─── Salary Structure Types ──────────────────────────────────────────────────

export interface HrmSalaryStructure {
	id: number;
	employee_id: number;
	effective_from: string;
	effective_to: string | null;
	ctc_annual: number;
	basic_monthly: number;
	hra_monthly: number;
	da_monthly: number;
	special_allowance_monthly: number;
	conveyance_monthly: number;
	medical_allowance_monthly: number;
	other_allowance_monthly: number;
	employer_pf_monthly: number;
	employer_esi_monthly: number;
	is_pf_applicable: boolean;
	pf_registration_status: string | null;
	pf_wage_calculation: string | null;
	is_esi_applicable: boolean;
	esic_registration_status: string | null;
	esic_ip_number: string | null;
	is_pt_applicable: boolean;
	is_tds_applicable: boolean;
	nps_enabled: boolean;
	pran_number: string | null;
	lwf_enabled: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface HrmSalaryStructureFilters {
	page?: number;
	limit?: number;
	employee_id?: number;
	current_only?: boolean;
}

export interface CreateSalaryStructureRequest {
	employee_id: number;
	effective_from: string;
	effective_to?: string | null;
	ctc_annual: number;
	basic_monthly: number;
	hra_monthly: number;
	da_monthly?: number;
	special_allowance_monthly?: number;
	conveyance_monthly?: number;
	medical_allowance_monthly?: number;
	other_allowance_monthly?: number;
	employer_pf_monthly?: number;
	employer_esi_monthly?: number;
	is_pf_applicable?: boolean;
	pf_registration_status?: string;
	pf_wage_calculation?: string;
	is_esi_applicable?: boolean;
	esic_registration_status?: string;
	esic_ip_number?: string;
	is_pt_applicable?: boolean;
	is_tds_applicable?: boolean;
	nps_enabled?: boolean;
	pran_number?: string;
	lwf_enabled?: boolean;
}

export interface UpdateSalaryStructureRequest extends Partial<CreateSalaryStructureRequest> {}

// ─── Tax Declaration Types ───────────────────────────────────────────────────

export interface HrmTaxDeclaration {
	id: number;
	employee_id: number;
	financial_year: string;
	status: string;
	created_at?: string;
	updated_at?: string;
	[key: string]: any;
}

export interface HrmTaxDeclarationFilters {
	page?: number;
	limit?: number;
	employee_id?: number;
	financial_year?: string;
	status?: string;
}

// ─── Hierarchy Types ─────────────────────────────────────────────────────────

export interface HrmHierarchy {
	id: number;
	employee_id: number;
	manager_id: number;
	department_id: number;
	hierarchy_type: string;
	is_primary: boolean;
	effective_from: string;
	effective_to: string | null;
	created_at?: string;
	updated_at?: string;
	employee_name?: string;
	manager_name?: string;
	department_name?: string;
}

export interface HrmHierarchyFilters {
	page?: number;
	limit?: number;
	employee_id?: number;
	manager_id?: number;
	department_id?: number;
	active_only?: boolean;
}

export interface CreateHierarchyRequest {
	employee_id: number;
	manager_id: number;
	department_id: number;
	hierarchy_type: string;
	is_primary: boolean;
	effective_from: string;
	effective_to?: string | null;
}

export interface UpdateHierarchyRequest extends Partial<CreateHierarchyRequest> {}

// ─── Holiday Types ──────────────────────────────────────────────────────────

export interface HrmHoliday {
	id: number;
	name: string;
	date: string;
	type: 'national' | 'company' | 'restricted';
	year: number;
	is_optional: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface HrmHolidayFilters {
	year?: number;
	type?: string;
	page?: number;
	limit?: number;
}

export interface CreateHolidayRequest {
	name: string;
	date: string;
	type: 'national' | 'company' | 'restricted';
	year: number;
}

export interface UpdateHolidayRequest extends Partial<CreateHolidayRequest> {}

export interface HrmHolidayChoice {
	id: number;
	holiday_id: number;
	holiday_name?: string;
	holiday_date?: string;
	status: string;
	chosen_at?: string;
}

export interface HrmMyChoicesResponse {
	year: number;
	quota: number;
	chosen_count: number;
	remaining: number;
	choices: HrmHolidayChoice[];
}

export interface HrmTeamChoice {
	id: number;
	employee_id: number;
	employee_name: string;
	employee_code: string;
	holiday_id: number;
	holiday_name: string;
	holiday_date: string;
	status: string;
}

export interface HrmTeamChoiceFilters {
	year?: number;
	employee_id?: number;
	holiday_id?: number;
	status?: string;
	page?: number;
	limit?: number;
}

export interface HrmChoiceSummary {
	holiday_id: number;
	holiday_name: string;
	date: string;
	total_chosen: number;
}

export interface HrmConfig {
	config_key: string;
	config_value: string;
	description: string;
}

// ─── Leave Types ────────────────────────────────────────────────────────────

export interface HrmLeaveType {
	id: number;
	name: string;
	code: string;
	annual_quota: number;
	max_carry_forward: number;
	max_consecutive_days?: number | null;
	is_paid: boolean;
	requires_document: boolean;
	min_days_advance: number;
	is_active: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface HrmLeaveTypeFilters {
	page?: number;
	limit?: number | 'all';
	is_active?: boolean;
}

export interface CreateLeaveTypeRequest {
	name: string;
	code: string;
	annual_quota?: number;
	max_carry_forward?: number;
	max_consecutive_days?: number | null;
	is_paid?: boolean;
	requires_document?: boolean;
	min_days_advance?: number;
	is_active?: boolean;
}

export interface UpdateLeaveTypeRequest extends Partial<CreateLeaveTypeRequest> {}

export interface HrmLeaveBalance {
	leave_type_id: number;
	leave_type_name: string;
	leave_type_code: string;
	annual_quota: number;
	opening_balance: number;
	accrued: number;
	used: number;
	lapsed: number;
	closing_balance: number;
}

export interface HrmMyLeaveBalancesResponse {
	employee_id: number;
	financial_year: string;
	balances: HrmLeaveBalance[];
}

export interface HrmCompOff {
	id: number;
	employee_id?: number;
	employee_name?: string;
	earned_date: string;
	expiry_date: string;
	status: 'available' | 'used' | 'expired';
	remarks?: string | null;
}

export interface HrmCompOffFilters {
	status?: 'available' | 'used' | 'expired';
	employee_id?: number;
	page?: number;
	limit?: number | 'all';
}

export interface CreateCompOffRequest {
	employee_id: number;
	earned_date: string;
	expiry_date?: string;
	remarks?: string;
}

export interface HrmLeaveApplication {
	id: number;
	employee_id?: number;
	employee_name?: string;
	employee_code?: string;
	leave_type_id?: number;
	leave_type_name: string;
	leave_type_code: string;
	from_date: string;
	to_date: string;
	total_days: number;
	is_half_day: boolean;
	half_day_type?: 'first_half' | 'second_half' | null;
	reason: string;
	status: 'pending' | 'approved' | 'rejected' | 'cancelled';
	auto_lop_converted: boolean;
	applied_at?: string;
	reviewed_by_name?: string | null;
	reviewer_remarks?: string | null;
	document_url?: string | null;
}

export interface HrmLeaveApplicationFilters {
	status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
	employee_id?: number;
	leave_type_id?: number;
	month?: number;
	year?: number;
	page?: number;
	limit?: number | 'all';
}

export interface CreateLeaveApplicationRequest {
	leave_type_id: number;
	from_date: string;
	to_date: string;
	is_half_day?: boolean;
	half_day_type?: 'first_half' | 'second_half' | null;
	reason: string;
	document_url?: string | null;
}

export interface ReviewLeaveApplicationRequest {
	status: 'approved' | 'rejected';
	remarks?: string;
}

export interface CancelLeaveApplicationRequest {
	cancellation_reason: string;
}

export interface RevertLopRequest {
	new_leave_type_id: number;
	remarks?: string;
}

// ─── Attendance Types ───────────────────────────────────────────────────────

export type HrmAttendanceStatus =
	| 'present'
	| 'absent'
	| 'half_day'
	| 'on_leave'
	| 'holiday'
	| 'weekend'
	| 'comp_off';

export interface HrmAttendanceRecord {
	id: number;
	employee_id: number;
	employee_name?: string;
	employee_code?: string;
	attendance_date: string;
	status: HrmAttendanceStatus;
	source?: string;
	approval_status?: string;
	remarks?: string | null;
}

export interface HrmAttendanceSummary {
	employee_id?: number;
	month: number;
	year: number;
	total_calendar_days?: number;
	total_working_days?: number;
	present: number;
	absent: number;
	half_day: number;
	on_leave: number;
	holiday: number;
	weekend: number;
	comp_off: number;
	paid_days?: number;
	lop_days?: number;
}

export interface HrmMyAttendanceResponse {
	data: HrmAttendanceRecord[];
	summary: HrmAttendanceSummary;
	pagination?: HrmPagination;
}

export interface HrmTeamAttendanceRow {
	employee_id: number;
	employee_code: string;
	employee_name: string;
	records: Array<{ date: string; status: HrmAttendanceStatus; source?: string }>;
	summary: HrmAttendanceSummary;
}

export interface HrmTeamAttendanceFilters {
	month: number;
	year: number;
	employee_id?: number;
	status?: HrmAttendanceStatus;
	page?: number;
	limit?: number | 'all';
}

export interface MarkAttendanceRequest {
	employee_ids: number[];
	from_date: string;
	to_date: string;
	status: 'present' | 'absent' | 'half_day' | 'comp_off';
	half_day_session?: 'first_half' | 'second_half' | null;
	remarks?: string;
}

export interface HrmAttendanceRegularization {
	id: number;
	attendance_id: number;
	employee_id: number;
	employee_name?: string;
	employee_code?: string;
	attendance_date: string;
	original_status: HrmAttendanceStatus;
	requested_status: HrmAttendanceStatus;
	reason: string;
	review_status: 'pending' | 'approved' | 'rejected';
	requested_at?: string;
	remarks?: string | null;
}

export interface HrmAttendanceRegularizationFilters {
	review_status?: 'pending' | 'approved' | 'rejected';
	employee_id?: number;
	month?: number;
	year?: number;
	page?: number;
	limit?: number | 'all';
}

export interface CreateAttendanceRegularizationRequest {
	attendance_id: number;
	requested_status: HrmAttendanceStatus;
	reason: string;
}

export interface ReviewAttendanceRegularizationRequest {
	review_status: 'approved' | 'rejected';
	remarks?: string;
}

// ─── API Service ─────────────────────────────────────────────────────────────

export class HrmApiService {
	// ── Employee APIs ──────────────────────────────────────────────────────

	static async getEmployees(filters?: HrmEmployeeFilters): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {};
		if (filters?.page) params.page = filters.page.toString();
		if (filters?.limit !== undefined) params.limit = clampHrmListLimit(filters.limit).toString();
		if (filters?.q) params.q = filters.q;
		if (filters?.department_id) params.department_id = filters.department_id.toString();
		if (filters?.designation_id) params.designation_id = filters.designation_id.toString();
		if (filters?.manager_id) params.manager_id = filters.manager_id.toString();
		if (filters?.status) params.status = filters.status;
		if (filters?.employment_type) params.employment_type = filters.employment_type;
		if (filters?.is_active !== undefined) params.is_active = filters.is_active.toString();
		return api.get(`${BASE_PATH}/employees`, { params });
	}

	static async getEmployee(id: number): Promise<ApiResponse<HrmEmployee>> {
		return api.get(`${BASE_PATH}/employees/${id}`);
	}

	static async createEmployee(data: CreateEmployeeRequest): Promise<ApiResponse<HrmEmployee>> {
		return api.post(`${BASE_PATH}/employees`, data);
	}

	static async updateEmployee(id: number, data: UpdateEmployeeRequest): Promise<ApiResponse<HrmEmployee>> {
		return api.patch(`${BASE_PATH}/employees/${id}`, data);
	}

	static async deleteEmployee(id: number): Promise<ApiResponse<any>> {
		return api.delete(`${BASE_PATH}/employees/${id}`);
	}

	// ── Department APIs ────────────────────────────────────────────────────

	static async getDepartments(filters?: HrmDepartmentFilters): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {};
		if (filters?.page) params.page = filters.page.toString();
		if (filters?.limit !== undefined) params.limit = clampHrmListLimit(filters.limit).toString();
		if (filters?.q) params.q = filters.q;
		if (filters?.parent_department_id) params.parent_department_id = filters.parent_department_id.toString();
		if (filters?.is_active !== undefined) params.is_active = filters.is_active.toString();
		return api.get(`${BASE_PATH}/departments`, { params });
	}

	static async getDepartment(id: number): Promise<ApiResponse<HrmDepartment>> {
		return api.get(`${BASE_PATH}/departments/${id}`);
	}

	static async createDepartment(data: CreateDepartmentRequest): Promise<ApiResponse<HrmDepartment>> {
		return api.post(`${BASE_PATH}/departments`, data);
	}

	static async updateDepartment(id: number, data: UpdateDepartmentRequest): Promise<ApiResponse<HrmDepartment>> {
		return api.patch(`${BASE_PATH}/departments/${id}`, data);
	}

	static async deleteDepartment(id: number): Promise<ApiResponse<any>> {
		return api.delete(`${BASE_PATH}/departments/${id}`);
	}

	// ── Designation APIs ───────────────────────────────────────────────────

	static async getDesignations(filters?: HrmDesignationFilters): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {};
		if (filters?.page) params.page = filters.page.toString();
		if (filters?.limit !== undefined) params.limit = clampHrmListLimit(filters.limit).toString();
		if (filters?.q) params.q = filters.q;
		if (filters?.level !== undefined) params.level = filters.level.toString();
		if (filters?.is_active !== undefined) params.is_active = filters.is_active.toString();
		return api.get(`${BASE_PATH}/designations`, { params });
	}

	static async getDesignation(id: number): Promise<ApiResponse<HrmDesignation>> {
		return api.get(`${BASE_PATH}/designations/${id}`);
	}

	static async createDesignation(data: CreateDesignationRequest): Promise<ApiResponse<HrmDesignation>> {
		return api.post(`${BASE_PATH}/designations`, data);
	}

	static async updateDesignation(id: number, data: UpdateDesignationRequest): Promise<ApiResponse<HrmDesignation>> {
		return api.patch(`${BASE_PATH}/designations/${id}`, data);
	}

	static async deleteDesignation(id: number): Promise<ApiResponse<any>> {
		return api.delete(`${BASE_PATH}/designations/${id}`);
	}

	// ── Salary Structure APIs ──────────────────────────────────────────────

	static async getSalaryStructures(filters?: HrmSalaryStructureFilters): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {};
		if (filters?.page) params.page = filters.page.toString();
		if (filters?.limit !== undefined) params.limit = clampHrmListLimit(filters.limit).toString();
		if (filters?.employee_id) params.employee_id = filters.employee_id.toString();
		if (filters?.current_only !== undefined) params.current_only = filters.current_only.toString();
		return api.get(`${BASE_PATH}/salary-structures`, { params });
	}

	static async getSalaryStructure(id: number): Promise<ApiResponse<HrmSalaryStructure>> {
		return api.get(`${BASE_PATH}/salary-structures/${id}`);
	}

	static async createSalaryStructure(data: CreateSalaryStructureRequest): Promise<ApiResponse<HrmSalaryStructure>> {
		return api.post(`${BASE_PATH}/salary-structures`, data);
	}

	static async updateSalaryStructure(id: number, data: UpdateSalaryStructureRequest): Promise<ApiResponse<HrmSalaryStructure>> {
		return api.patch(`${BASE_PATH}/salary-structures/${id}`, data);
	}

	static async deleteSalaryStructure(id: number): Promise<ApiResponse<any>> {
		return api.delete(`${BASE_PATH}/salary-structures/${id}`);
	}

	// ── Tax Declaration APIs ───────────────────────────────────────────────

	static async getTaxDeclarations(filters?: HrmTaxDeclarationFilters): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {};
		if (filters?.page) params.page = filters.page.toString();
		if (filters?.limit !== undefined) params.limit = clampHrmListLimit(filters.limit).toString();
		if (filters?.employee_id) params.employee_id = filters.employee_id.toString();
		if (filters?.financial_year) params.financial_year = filters.financial_year;
		if (filters?.status) params.status = filters.status;
		return api.get(`${BASE_PATH}/tax-declarations`, { params });
	}

	static async getTaxDeclaration(id: number): Promise<ApiResponse<HrmTaxDeclaration>> {
		return api.get(`${BASE_PATH}/tax-declarations/${id}`);
	}

	static async createTaxDeclaration(data: any): Promise<ApiResponse<HrmTaxDeclaration>> {
		return api.post(`${BASE_PATH}/tax-declarations`, data);
	}

	static async updateTaxDeclaration(id: number, data: any): Promise<ApiResponse<HrmTaxDeclaration>> {
		return api.patch(`${BASE_PATH}/tax-declarations/${id}`, data);
	}

	static async deleteTaxDeclaration(id: number): Promise<ApiResponse<any>> {
		return api.delete(`${BASE_PATH}/tax-declarations/${id}`);
	}

	// ── Hierarchy APIs ─────────────────────────────────────────────────────

	static async getHierarchies(filters?: HrmHierarchyFilters): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {};
		if (filters?.page) params.page = filters.page.toString();
		if (filters?.limit !== undefined) params.limit = clampHrmListLimit(filters.limit).toString();
		if (filters?.employee_id) params.employee_id = filters.employee_id.toString();
		if (filters?.manager_id) params.manager_id = filters.manager_id.toString();
		if (filters?.department_id) params.department_id = filters.department_id.toString();
		if (filters?.active_only !== undefined) params.active_only = filters.active_only.toString();
		return api.get(`${BASE_PATH}/hierarchies`, { params });
	}

	static async getHierarchy(id: number): Promise<ApiResponse<HrmHierarchy>> {
		return api.get(`${BASE_PATH}/hierarchies/${id}`);
	}

	static async createHierarchy(data: CreateHierarchyRequest): Promise<ApiResponse<HrmHierarchy>> {
		return api.post(`${BASE_PATH}/hierarchies`, data);
	}

	static async updateHierarchy(id: number, data: UpdateHierarchyRequest): Promise<ApiResponse<HrmHierarchy>> {
		return api.patch(`${BASE_PATH}/hierarchies/${id}`, data);
	}

	static async deleteHierarchy(id: number): Promise<ApiResponse<any>> {
		return api.delete(`${BASE_PATH}/hierarchies/${id}`);
	}

	// ── Holiday APIs ──────────────────────────────────────────────────────

	static async getHolidays(filters?: HrmHolidayFilters): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {};
		if (filters?.year) params.year = filters.year.toString();
		if (filters?.type) params.type = filters.type;
		if (filters?.page) params.page = filters.page.toString();
		if (filters?.limit !== undefined) params.limit = clampHrmListLimit(filters.limit).toString();
		return api.get(`${BASE_PATH}/holidays`, { params });
	}

	static async createHoliday(data: CreateHolidayRequest): Promise<ApiResponse<HrmHoliday>> {
		return api.post(`${BASE_PATH}/holidays`, data);
	}

	static async updateHoliday(id: number, data: UpdateHolidayRequest): Promise<ApiResponse<HrmHoliday>> {
		return api.patch(`${BASE_PATH}/holidays/${id}`, data);
	}

	static async deleteHoliday(id: number): Promise<ApiResponse<any>> {
		return api.delete(`${BASE_PATH}/holidays/${id}`);
	}

	// ── Holiday Choice APIs ───────────────────────────────────────────────

	static async getMyHolidayChoices(year?: number): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {};
		if (year) params.year = year.toString();
		return api.get(`${BASE_PATH}/holidays/choices/my`, { params });
	}

	static async createHolidayChoice(data: { holiday_id: number; year: number }): Promise<ApiResponse<any>> {
		return api.post(`${BASE_PATH}/holidays/choices`, data);
	}

	static async deleteHolidayChoice(choiceId: number): Promise<ApiResponse<any>> {
		return api.delete(`${BASE_PATH}/holidays/choices/${choiceId}`);
	}

	static async getTeamHolidayChoices(filters?: HrmTeamChoiceFilters): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {};
		if (filters?.year) params.year = filters.year.toString();
		if (filters?.employee_id) params.employee_id = filters.employee_id.toString();
		if (filters?.holiday_id) params.holiday_id = filters.holiday_id.toString();
		if (filters?.status) params.status = filters.status;
		if (filters?.page) params.page = filters.page.toString();
		if (filters?.limit !== undefined) params.limit = clampHrmListLimit(filters.limit).toString();
		return api.get(`${BASE_PATH}/holidays/choices/team`, { params });
	}

	static async getHolidayChoicesSummary(year?: number): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {};
		if (year) params.year = year.toString();
		return api.get(`${BASE_PATH}/holidays/choices/summary`, { params });
	}

	// ── Leave Type APIs ───────────────────────────────────────────────────

	static async getLeaveTypes(filters?: HrmLeaveTypeFilters): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {};
		if (filters?.is_active !== undefined) params.is_active = filters.is_active.toString();
		if (filters?.page) params.page = filters.page.toString();
		if (filters?.limit !== undefined && filters.limit !== 'all') params.limit = clampHrmListLimit(filters.limit).toString();
		if (filters?.limit === 'all') params.limit = 'all';
		return api.get(`${BASE_PATH}/leave-types`, { params });
	}

	static async getLeaveType(id: number): Promise<ApiResponse<HrmLeaveType>> {
		return api.get(`${BASE_PATH}/leave-types/${id}`);
	}

	static async createLeaveType(data: CreateLeaveTypeRequest): Promise<ApiResponse<HrmLeaveType>> {
		return api.post(`${BASE_PATH}/leave-types`, data);
	}

	static async updateLeaveType(id: number, data: UpdateLeaveTypeRequest): Promise<ApiResponse<HrmLeaveType>> {
		return api.patch(`${BASE_PATH}/leave-types/${id}`, data);
	}

	// ── Leave Balance APIs ────────────────────────────────────────────────

	static async getMyLeaveBalances(financialYear?: string): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {};
		if (financialYear) params.financial_year = financialYear;
		return api.get(`${BASE_PATH}/leave-balances/my`, { params });
	}

	static async getLeaveBalancesByEmployee(employeeId: number, financialYear?: string): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {};
		if (financialYear) params.financial_year = financialYear;
		return api.get(`${BASE_PATH}/leave-balances/${employeeId}`, { params });
	}

	static async initializeLeaveBalances(employeeId: number, financialYear: string): Promise<ApiResponse<any>> {
		return api.post(`${BASE_PATH}/leave-balances/${employeeId}/initialize`, { financial_year: financialYear });
	}

	// ── Leave Application APIs ────────────────────────────────────────────

	static async getLeaveApplications(filters?: HrmLeaveApplicationFilters): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {};
		if (filters?.status) params.status = filters.status;
		if (filters?.employee_id) params.employee_id = filters.employee_id.toString();
		if (filters?.leave_type_id) params.leave_type_id = filters.leave_type_id.toString();
		if (filters?.month) params.month = filters.month.toString();
		if (filters?.year) params.year = filters.year.toString();
		if (filters?.page) params.page = filters.page.toString();
		if (filters?.limit !== undefined && filters.limit !== 'all') params.limit = clampHrmListLimit(filters.limit).toString();
		if (filters?.limit === 'all') params.limit = 'all';
		return api.get(`${BASE_PATH}/leave-applications`, { params });
	}

	static async getLeaveApplication(id: number): Promise<ApiResponse<HrmLeaveApplication>> {
		return api.get(`${BASE_PATH}/leave-applications/${id}`);
	}

	static async createLeaveApplication(data: CreateLeaveApplicationRequest): Promise<ApiResponse<any>> {
		return api.post(`${BASE_PATH}/leave-applications`, data);
	}

	static async reviewLeaveApplication(id: number, data: ReviewLeaveApplicationRequest): Promise<ApiResponse<any>> {
		return api.patch(`${BASE_PATH}/leave-applications/${id}/review`, data);
	}

	static async cancelLeaveApplication(id: number, data: CancelLeaveApplicationRequest): Promise<ApiResponse<any>> {
		return api.patch(`${BASE_PATH}/leave-applications/${id}/cancel`, data);
	}

	static async revertLopLeaveApplication(id: number, data: RevertLopRequest): Promise<ApiResponse<any>> {
		return api.patch(`${BASE_PATH}/leave-applications/${id}/revert-lop`, data);
	}

	// ── Comp-Off APIs ─────────────────────────────────────────────────────

	static async getCompOffs(filters?: HrmCompOffFilters): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {};
		if (filters?.status) params.status = filters.status;
		if (filters?.employee_id) params.employee_id = filters.employee_id.toString();
		if (filters?.page) params.page = filters.page.toString();
		if (filters?.limit !== undefined && filters.limit !== 'all') params.limit = clampHrmListLimit(filters.limit).toString();
		if (filters?.limit === 'all') params.limit = 'all';
		return api.get(`${BASE_PATH}/comp-off`, { params });
	}

	static async createCompOff(data: CreateCompOffRequest): Promise<ApiResponse<any>> {
		return api.post(`${BASE_PATH}/comp-off`, data);
	}

	// ── Attendance APIs ───────────────────────────────────────────────────

	static async getMyAttendance(filters: { month: number; year: number; status?: HrmAttendanceStatus; page?: number; limit?: number | 'all' }): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {
			month: filters.month.toString(),
			year: filters.year.toString(),
		};
		if (filters.status) params.status = filters.status;
		if (filters.page) params.page = filters.page.toString();
		if (filters.limit !== undefined && filters.limit !== 'all') params.limit = clampHrmListLimit(filters.limit).toString();
		if (filters.limit === 'all') params.limit = 'all';
		return api.get(`${BASE_PATH}/attendance/my`, { params });
	}

	static async markAttendance(data: MarkAttendanceRequest): Promise<ApiResponse<any>> {
		return api.post(`${BASE_PATH}/attendance/mark`, data);
	}

	static async getTeamAttendance(filters: HrmTeamAttendanceFilters): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {
			month: filters.month.toString(),
			year: filters.year.toString(),
		};
		if (filters.employee_id) params.employee_id = filters.employee_id.toString();
		if (filters.status) params.status = filters.status;
		if (filters.page) params.page = filters.page.toString();
		if (filters.limit !== undefined && filters.limit !== 'all') params.limit = clampHrmListLimit(filters.limit).toString();
		if (filters.limit === 'all') params.limit = 'all';
		return api.get(`${BASE_PATH}/attendance/team`, { params });
	}

	static async getAttendanceSummary(filters: { employee_id: number; month: number; year: number }): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {
			employee_id: filters.employee_id.toString(),
			month: filters.month.toString(),
			year: filters.year.toString(),
		};
		return api.get(`${BASE_PATH}/attendance/summary`, { params });
	}

	static async getAttendanceRegularizations(filters?: HrmAttendanceRegularizationFilters): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {};
		if (filters?.review_status) params.review_status = filters.review_status;
		if (filters?.employee_id) params.employee_id = filters.employee_id.toString();
		if (filters?.month) params.month = filters.month.toString();
		if (filters?.year) params.year = filters.year.toString();
		if (filters?.page) params.page = filters.page.toString();
		if (filters?.limit !== undefined && filters.limit !== 'all') params.limit = clampHrmListLimit(filters.limit).toString();
		if (filters?.limit === 'all') params.limit = 'all';
		return api.get(`${BASE_PATH}/attendance/regularize`, { params });
	}

	static async createAttendanceRegularization(data: CreateAttendanceRegularizationRequest): Promise<ApiResponse<any>> {
		return api.post(`${BASE_PATH}/attendance/regularize`, data);
	}

	static async reviewAttendanceRegularization(id: number, data: ReviewAttendanceRegularizationRequest): Promise<ApiResponse<any>> {
		return api.patch(`${BASE_PATH}/attendance/regularize/${id}`, data);
	}

	static async getAttendanceRecord(id: number): Promise<ApiResponse<HrmAttendanceRecord>> {
		return api.get(`${BASE_PATH}/attendance/${id}`);
	}

	// ── HRM Config APIs ───────────────────────────────────────────────────

	static async getConfig(): Promise<ApiResponse<any>> {
		return api.get(`${BASE_PATH}/config`);
	}

	static async updateConfig(key: string, value: string): Promise<ApiResponse<any>> {
		return api.patch(`${BASE_PATH}/config/${key}`, { value });
	}
}
