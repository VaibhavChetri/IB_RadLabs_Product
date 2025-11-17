import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PageHeader, Button, Snackbar, FloatingDropdown } from '../../../components/ui';
import { Table } from '../../../components/ui/DataDisplay';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { Plus } from 'lucide-react';
import { EscalationTypeModal } from '../../../features/escalation-type/components/EscalationTypeModal';
import { useEscalationTypeData } from '../../../features/escalation-type/hooks/useEscalationTypeData';
import { useURLFilters } from '../../../features/escalation-type/hooks/useURLFilters';
import { getEscalationTypeColumns } from '../../../features/escalation-type/config/tableColumns';
import { STATUS_OPTIONS } from '../../../features/escalation-type/config/constants';
import { useDebounce } from '../../../hooks/useDebounce';
import { RootState } from '../../../store';
import type { EscalationType as EscalationTypeItem } from '../../../services/transitPlanApi';

export const EscalationType: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const { filters: urlFilters, updateFilters } = useURLFilters();
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState<EscalationTypeItem | null>(null);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({
		open: false,
		message: '',
		type: 'success',
	});

	// Debounce filters to prevent rapid filtering
	const debouncedStatus = useDebounce(urlFilters.status, 300);

	// Fetch escalation types
	const {
		data: listingData,
		isLoading: loading,
		error: listingError,
	} = useEscalationTypeData({
		status: debouncedStatus || undefined,
	});

	// Show error snackbar if API fails
	useEffect(() => {
		if (listingError) {
			setSnackbar({
				open: true,
				message: 'Failed to load escalation types',
				type: 'error',
			});
		}
	}, [listingError]);

	const handleAdd = () => {
		setEditingItem(null);
		setShowModal(true);
	};

	const handleEdit = React.useCallback((item: EscalationTypeItem) => {
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
			message: editingItem
				? 'Escalation type updated successfully'
				: 'Escalation type added successfully',
			type: 'success',
		});
		setShowModal(false);
		setEditingItem(null);
		// React Query mutations handle optimistic updates and refetch automatically
	};

	const handleFilterChange = (key: 'status', value: string) => {
		updateFilters({ [key]: value });
	};

	const columns = useMemo(
		() =>
			getEscalationTypeColumns({
				onEdit: handleEdit,
			}),
		[handleEdit]
	);

	const tableData = (listingData?.data || []) as unknown as Record<string, unknown>[];

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader
						title='Escalation Type'
						locationName={user?.city_name || 'City'}
						totalItems={tableData.length}
						itemType='escalation types'
						icon='📋'
					/>
					<Button onClick={handleAdd} variant='primary' leftIcon={<Plus className='w-4 h-4' />}>
						Add Escalation Type
					</Button>
				</div>

				{/* Filter Section */}
				<div className='mb-6 flex w-full'>
					<div className='bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 flex w-full gap-3'>
						<div className='flex items-center gap-4 w-full'>
							<FloatingDropdown
								label='Status'
								options={[...STATUS_OPTIONS]}
								value={urlFilters.status}
								onChange={(value: string) => handleFilterChange('status', value)}
								placeholder='All Status'
							/>
						</div>
					</div>
				</div>

				{loading ? (
					<TableSkeleton rows={10} columns={4} />
				) : (
					<Table columns={columns} data={tableData} loading={false} size='sm' />
				)}

				{showModal && (
					<EscalationTypeModal
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
