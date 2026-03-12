/**
 * Manage Users Page
 * Lists all users with CRUD operations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
	PageHeader,
	Card,
	Button,
	FloatingInput,
	Pagination,
	Snackbar,
} from '../../../components/ui';
import { Table } from '../../../components/ui/DataDisplay';
import { UserApiService, User, UserFilters } from '../../../services/userApi';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TableColumn } from '../../../components/ui/DataDisplay';

interface PaginationData {
	totalCount: number;
	pageSize: number;
	currentPage: number;
	totalPages: number;
}

export const ManageUsers: React.FC = () => {
	const navigate = useNavigate();

	// State
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [filters, setFilters] = useState<UserFilters>({
		page: 1,
		limit: 10,
		name: '',
	});
	const [pagination, setPagination] = useState<PaginationData>({
		totalCount: 0,
		pageSize: 10,
		currentPage: 1,
		totalPages: 0,
	});
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'success' as 'success' | 'error',
	});
	const [isDeleting, setIsDeleting] = useState(false);


	// Fetch users
	const fetchUsers = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await UserApiService.getUsers(filters);
			if (response.status_code === 200 && response.data) {
				setUsers(response.data);
				const paginationData = response.pagination || {
					page: 1,
					limit: 10,
					totalItems: 0,
					totalPages: 0,
				};
				setPagination({
					totalCount: paginationData.totalItems,
					pageSize: paginationData.limit,
					currentPage: paginationData.page,
					totalPages: paginationData.totalPages,
				});
			}
		} catch (err: any) {
			const errorMsg =
				err.response?.data?.message || err.message || 'Failed to fetch users';
			setError(errorMsg);
			setSnackbar({ open: true, message: errorMsg, type: 'error' });
		} finally {
			setLoading(false);
		}
	}, [filters]);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	// Handle search
	const handleSearch = (value: string) => {
		setFilters(prev => ({ ...prev, name: value, page: 1 }));
	};

	// Handle pagination
	const handlePageChange = (newPage: number) => {
		setFilters(prev => ({ ...prev, page: newPage }));
	};

	// Handle delete
	const handleDelete = async (userId: number) => {
		if (!window.confirm('Are you sure you want to delete this user?')) return;

		setIsDeleting(true);
		try {
			const response = await UserApiService.deleteUser(userId);
			if (response.status_code === 200) {
				setSnackbar({
					open: true,
					message: 'User deleted successfully',
					type: 'success',
				});
				fetchUsers();
			}
		} catch (err: any) {
			const errorMsg = err.response?.data?.message || 'Failed to delete user';
			setSnackbar({ open: true, message: errorMsg, type: 'error' });
		} finally {
			setIsDeleting(false);
		}
	};

	// Table columns
	const columns: TableColumn<User>[] = [
		{
			key: 'username',
			title: 'Username',
			dataIndex: 'username',
			sortable: true,
		},
		{
			key: 'name',
			title: 'Name',
			render: (_, record: User) => `${record.firstName} ${record.lastName}`,
		},
		{
			key: 'email',
			title: 'Email',
			dataIndex: 'email',
		},
		{
			key: 'contact',
			title: 'Contact',
			render: (_, record: User) => record.contact || '—',
		},
		{
			key: 'userTypeName',
			title: 'User Type',
			render: (_, record: User) => record.userTypeName || '—',
		},
		{
			key: 'cityName',
			title: 'City',
			render: (_, record: User) => record.cityName || '—',
		},
		{
			key: 'status',
			title: 'Status',
			render: (_, record: User) => {
				const isActive = record.status === 'Active' || record.status === 1 || record.status === '1';
				return (
					<span
						className={`inline-block px-2 py-1 rounded text-xs font-medium ${
							isActive
								? 'bg-success-50 text-success-700'
								: 'bg-error-50 text-error-700'
						}`}
					>
						{isActive ? 'Active' : 'Disabled'}
					</span>
				);
			},
		},
		{
			key: 'actions',
			title: 'Actions',
			render: (_, record: User) => (
				<div className='flex gap-2'>
					<button
						onClick={() => navigate(`/ops-admin/users/${record.id}`)}
						className='p-2 hover:bg-background-secondary rounded transition-colors'
						title='Edit user'
					>
						<Edit className='w-4 h-4 text-primary' />
					</button>
					<button
						onClick={() => handleDelete(record.id)}
						className='p-2 hover:bg-background-secondary rounded transition-colors disabled:opacity-50'
						disabled={isDeleting}
						title='Delete user'
					>
						<Trash2 className='w-4 h-4 text-error' />
					</button>
				</div>
			),
		},
	];

	return (
		<div className='space-y-6'>
			<PageHeader
				title='User Management'
				totalItems={pagination.totalCount}
				itemType='users'
				icon='👥'
			/>

			{/* Filters and Actions */}
			<Card className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div className='flex-1'>
					<FloatingInput
						label='Search by username or name'
						value={filters.name || ''}
						onChange={handleSearch}
						placeholder='Search...'
					/>
				</div>

				<Button
					variant='primary'
					size='md'
					onClick={() => navigate('/ops-admin/users/add')}
					leftIcon={<Plus className='w-4 h-4' />}
				>
					Add User
				</Button>
			</Card>

			{/* Users Table */}
			<Card>
				{loading ? (
					<div className='text-center py-12'>
						<p className='text-foreground-secondary'>Loading users...</p>
					</div>
				) : error ? (
					<div className='text-center py-12'>
						<p className='text-error'>{error}</p>
					</div>
				) : users.length === 0 ? (
					<div className='text-center py-12'>
						<p className='text-foreground-secondary'>No users found</p>
					</div>
				) : (
					<Table
						columns={columns as any}
						data={users as any}
						hoverable
						striped
					/>
				)}
			</Card>

			{/* Pagination */}
			{pagination.totalPages > 1 && (
				<Card className='flex justify-center'>
					<Pagination
						currentPage={pagination.currentPage}
						totalPages={pagination.totalPages}
						totalItems={pagination.totalCount}
						itemsPerPage={pagination.pageSize}
						onPageChange={handlePageChange}
					/>
				</Card>
			)}

			{/* Snackbar */}
			<Snackbar
				open={snackbar.open}
				message={snackbar.message}
				type={snackbar.type}
				autoHideDuration={4000}
				onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
			/>
		</div>
	);
};
