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
}
