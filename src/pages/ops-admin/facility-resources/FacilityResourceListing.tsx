/**
 * Facility Resource Listing Page
 * Displays all facility resources in a table with Add/Edit functionality
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Edit2 } from 'lucide-react';
import { PageHeader, Button, Snackbar, Table } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { ShiftApiService, FacilityResource } from '../../../services/shiftApi';
import { RootState } from '../../../store';
import { FacilityResourceModal } from './FacilityResourceModal';

// Status Toggle Component
const StatusToggle: React.FC<{
	isActive: boolean;
	onToggle: () => void;
	disabled?: boolean;
}> = ({ isActive, onToggle, disabled = false }) => {
	return (
		<div className='flex items-center justify-center'>
			<button
				onClick={onToggle}
				disabled={disabled}
				className={`
					relative inline-flex h-4 w-8 items-center justify-center rounded-full transition-all duration-200 ease-in-out focus:outline-none
					${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
					${isActive ? 'bg-green-500' : 'bg-gray-300 hover:bg-gray-400'}
				`}
			>
				<span
					className={`
						absolute h-3 w-3 transform rounded-full bg-white transition-all duration-200 ease-in-out
						${isActive ? 'translate-x-2' : '-translate-x-2'}
					`}
				/>
			</button>
			<span className={`ml-2 text-xs font-medium ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
				{isActive ? 'Active' : 'Inactive'}
			</span>
		</div>
	);
};

export const FacilityResourceListing: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const [resources, setResources] = useState<FacilityResource[]>([]);
	const [loading, setLoading] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState<FacilityResource | null>(null);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({
		open: false,
		message: '',
		type: 'success',
	});

	// Fetch facility resources
	const fetchResources = useCallback(async () => {
		if (!user?.city_id) return;

		setLoading(true);
		try {
			const response = await ShiftApiService.getFacilityResources(1, 100, user.city_id);
			if (response.status === 'Success' && response.data) {
				setResources(response.data);
			} else {
				setSnackbar({
					open: true,
					message: 'Failed to load facility resources',
					type: 'error',
				});
			}
		} catch (error) {
			console.error('Failed to fetch facility resources:', error);
			setSnackbar({
				open: true,
				message: 'Failed to load facility resources',
				type: 'error',
			});
		} finally {
			setLoading(false);
		}
	}, [user?.city_id]);

	useEffect(() => {
		fetchResources();
	}, [fetchResources]);

	const handleAdd = () => {
		setEditingItem(null);
		setShowModal(true);
	};

	const handleEdit = useCallback((item: FacilityResource) => {
		setEditingItem(item);
		setShowModal(true);
	}, []);

	const handleModalClose = () => {
		setShowModal(false);
		setEditingItem(null);
	};

	const handleModalSuccess = () => {
		setSnackbar({
			open: true,
			message: editingItem ? 'Facility resource updated successfully' : 'Facility resource added successfully',
			type: 'success',
		});
		setShowModal(false);
		setEditingItem(null);
		fetchResources(); // Refresh the list
	};

	const handleStatusToggle = useCallback(
		async (resource: FacilityResource) => {
			const newStatus = resource.status === 'Active' ? 0 : 1;
			try {
				const response = await ShiftApiService.updateFacilityResource({
					id: resource.id,
					name: resource.name,
					status: newStatus,
				});
				if (response.status === 'Success') {
					setSnackbar({
						open: true,
						message: 'Status updated successfully',
						type: 'success',
					});
					fetchResources(); // Refresh the list
				} else {
					setSnackbar({
						open: true,
						message: 'Failed to update status',
						type: 'error',
					});
				}
			} catch (error) {
				console.error('Failed to update status:', error);
				setSnackbar({
					open: true,
					message: 'Failed to update status',
					type: 'error',
				});
			}
		},
		[fetchResources]
	);

	const columns = useMemo(
		() => [
			{
				key: 'id',
				title: '#',
				render: (_: unknown, __: unknown, index: number) => index + 1,
				width: '60px',
			},
			{
				key: 'name',
				title: 'Resource Name',
				render: (_: unknown, record: FacilityResource) => (
					<span className='font-medium'>{record.name}</span>
				),
			},
			{
				key: 'status',
				title: 'Status',
				render: (_: unknown, record: FacilityResource) => (
					<StatusToggle
						isActive={record.status === 'Active'}
						onToggle={() => handleStatusToggle(record)}
						disabled={loading}
					/>
				),
			},
			{
				key: 'created_by_name',
				title: 'Created By',
				render: (_: unknown, record: FacilityResource) => record.created_by_name || '-',
			},
			{
				key: 'created_at',
				title: 'Created At',
				render: (_: unknown, record: FacilityResource) => {
					if (!record.created_at) return '-';
					return new Date(record.created_at).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'short',
						day: 'numeric',
					});
				},
			},
			{
				key: 'actions',
				title: 'Actions',
				render: (_: unknown, record: FacilityResource) => (
					<button
						onClick={() => handleEdit(record)}
						className='p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors'
						title='Edit'
					>
						<Edit2 className='w-4 h-4' />
					</button>
				),
				width: '80px',
			},
		],
		[handleEdit, handleStatusToggle, loading]
	);

	const tableData = resources as unknown as Record<string, unknown>[];

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader
						title='Facility Resources'
						locationName={user?.city_name || 'City'}
						totalItems={tableData.length}
						itemType='facility resources'
						icon='🏭'
					/>
					<Button onClick={handleAdd} variant='primary' leftIcon={<Plus className='w-4 h-4' />}>
						Add Resource
					</Button>
				</div>

				{loading ? (
					<TableSkeleton rows={10} columns={6} />
				) : (
					<Table columns={columns} data={tableData} loading={false} size='sm' />
				)}

				{showModal && (
					<FacilityResourceModal
						open={showModal}
						onClose={handleModalClose}
						onSuccess={handleModalSuccess}
						editingItem={editingItem}
					/>
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

export default FacilityResourceListing;

