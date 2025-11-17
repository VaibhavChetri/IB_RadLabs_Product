import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import { Button, Snackbar } from '../../../components/ui';
import { RootState } from '../../../store';
import { SkuApiService } from '../../../services/skuApi';
import { EscalationTypeService, QCRejectionService } from '../../../services/transitPlanApi';
import type { ClientSkuMapItem } from '../../../services/transitPlanApi';
import type { EscalationType } from '../../../services/transitPlanApi';

interface QCRejectionFormData {
	[skuId: string]: {
		[reasonId: string]: number;
	};
}

export const QCRejectionDetails: React.FC = () => {
	const { clientId, transitId } = useParams<{ clientId: string; transitId: string }>();
	const location = useLocation();
	const navigate = useNavigate();
	const { user } = useSelector((state: RootState) => state.auth);

	const [skus, setSkus] = useState<ClientSkuMapItem[]>([]);
	const [rejectionReasons, setRejectionReasons] = useState<EscalationType[]>([]);
	const [formData, setFormData] = useState<QCRejectionFormData>({});
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({
		open: false,
		message: '',
		type: 'success',
	});

	const clientName = location.state?.clientName || 'Client';
	const transitDate = location.state?.transitDate || '';
	const transitTime = location.state?.transitTime || '';
	const runId = location.state?.runId as number | undefined;

	// Get localStorage key for this run
	const storageKey = useMemo(() => {
		return runId ? `qcRejectionFormData_${runId}` : null;
	}, [runId]);

	// Load SKUs and rejection reasons
	useEffect(() => {
		const loadData = async () => {
			if (!clientId) return;

			setLoading(true);
			try {
				// Load SKUs
				const skuResponse = await SkuApiService.getClientSkuMap(parseInt(clientId, 10));
				if (skuResponse?.result) {
					setSkus(skuResponse.result);
					// Initialize form data - try to restore from localStorage first
					const initialData: QCRejectionFormData = {};
					skuResponse.result.forEach(sku => {
						initialData[sku.containerTypeId.toString()] = {};
					});

					// Try to restore from localStorage
					if (storageKey) {
						const savedData = localStorage.getItem(storageKey);
						if (savedData) {
							try {
								const parsed = JSON.parse(savedData) as QCRejectionFormData;
								// Merge saved data with initial structure
								Object.keys(parsed).forEach(skuId => {
									if (initialData[skuId]) {
										initialData[skuId] = { ...initialData[skuId], ...parsed[skuId] };
									}
								});
							} catch (error) {
								console.error('Failed to parse saved form data:', error);
							}
						}
					}

					setFormData(initialData);
				}

				// Load rejection reasons
				const reasonsResponse = await EscalationTypeService.getEscalationTypes();
				if (reasonsResponse?.data) {
					// Filter only active reasons
					const activeReasons = reasonsResponse.data.filter(
						reason => reason.status === 'Active'
					);
					setRejectionReasons(activeReasons);
				}
			} catch (error) {
				console.error('Failed to load data:', error);
				setSnackbar({
					open: true,
					message: 'Failed to load data',
					type: 'error',
				});
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [clientId, storageKey]);

	// Handle input change
	const handleInputChange = (skuId: string, reasonId: string, value: string) => {
		const numValue = value === '' ? 0 : parseInt(value, 10) || 0;
		setFormData(prev => {
			const newData = {
				...prev,
				[skuId]: {
					...prev[skuId],
					[reasonId]: numValue,
				},
			};
			// Save to localStorage
			if (storageKey) {
				localStorage.setItem(storageKey, JSON.stringify(newData));
			}
			return newData;
		});
	};

	// Calculate total for a SKU
	const calculateTotal = (skuId: string): number => {
		const skuData = formData[skuId] || {};
		return Object.values(skuData).reduce((sum, val) => sum + (val || 0), 0);
	};

	// Calculate grand total
	const grandTotal = useMemo(() => {
		return skus.reduce((sum, sku) => {
			return sum + calculateTotal(sku.containerTypeId.toString());
		}, 0);
	}, [skus, formData]);

	// Handle submit
	const handleSubmit = async () => {
		if (!runId) {
			setSnackbar({
				open: true,
				message: 'Missing run ID',
				type: 'error',
			});
			return;
		}

		// Build payload from formData
		const details: Array<{
			containerTypeId: number;
			reasonId: number;
			rejectedCount: number;
		}> = [];

		Object.keys(formData).forEach(skuId => {
			const skuData = formData[skuId];
			Object.keys(skuData).forEach(reasonId => {
				const count = skuData[reasonId];
				if (count > 0) {
					details.push({
						containerTypeId: parseInt(skuId, 10),
						reasonId: parseInt(reasonId, 10),
						rejectedCount: count,
					});
				}
			});
		});

		if (details.length === 0) {
			setSnackbar({
				open: true,
				message: 'Please enter at least one rejection count',
				type: 'error',
			});
			return;
		}

		setSubmitting(true);
		try {
			await QCRejectionService.submitQCRejections(runId, { details });

			// Clear localStorage after successful submission
			if (storageKey) {
				localStorage.removeItem(storageKey);
			}

			setSnackbar({
				open: true,
				message: 'QC Rejection data submitted successfully',
				type: 'success',
			});

			// Navigate back after 1.5 seconds
			setTimeout(() => {
				navigate('/operations-reporting/qc-rejection/add', {
					state: {
						transitDate: location.state?.filterDate || location.state?.transitDate,
					},
				});
			}, 1500);
		} catch (error) {
			console.error('Failed to submit:', error);
			setSnackbar({
				open: true,
				message: 'Failed to submit QC rejection data',
				type: 'error',
			});
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-white p-4'>
				<div className='max-w-7xl mx-auto'>
					<div className='flex items-center justify-center h-64'>
						<div className='text-gray-500'>Loading...</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				{/* Header */}
				<div className='mb-6'>
					<button
						onClick={() =>
							navigate('/operations-reporting/qc-rejection/add', {
								state: {
									transitDate: location.state?.filterDate || location.state?.transitDate,
								},
							})
						}
						className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors'
					>
						<ArrowLeft className='w-4 h-4' />
						<span className='text-sm'>Back</span>
					</button>
					<h1 className='text-2xl font-semibold text-gray-900 mb-2'>Add QC Rejection Details</h1>
					<p className='text-sm text-gray-600 mb-4'>Fill required details</p>
					<div className='flex items-center gap-4 text-sm text-gray-600'>
						<span>Client: <span className='font-medium'>{clientName}</span></span>
						<span>•</span>
						<span>Date: <span className='font-medium'>{transitDate}</span></span>
						<span>•</span>
						<span>Time: <span className='font-medium'>{transitTime}</span></span>
					</div>
				</div>

				{/* Table */}
				<div className='bg-white border border-gray-200 rounded-lg overflow-hidden mb-6 shadow-sm'>
					<div className='overflow-x-auto'>
						<table className='w-full'>
							{/* Header */}
							<thead className='bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300'>
								<tr>
									<th className='px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 z-10 min-w-[200px] border-r border-gray-300'>
										SKU
									</th>
									{rejectionReasons.map(reason => (
										<th
											key={reason.id}
											className='px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[100px]'
										>
											{reason.name}
										</th>
									))}
									<th className='px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[100px] bg-gray-200 border-l-2 border-gray-400'>
										Total
									</th>
								</tr>
							</thead>
							{/* Body */}
							<tbody className='bg-white divide-y divide-gray-200'>
								{skus.map((sku, index) => {
									const skuId = sku.containerTypeId.toString();
									const total = calculateTotal(skuId);
									return (
										<tr
											key={sku.containerTypeId}
											className={`hover:bg-gray-50 transition-colors ${
												index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
											}`}
										>
											<td className='px-3 py-2 text-xs font-semibold text-gray-900 sticky left-0 z-10 border-r border-gray-200 bg-inherit'>
												{sku.containerType}
											</td>
											{rejectionReasons.map(reason => {
												const reasonId = reason.id.toString();
												const value = formData[skuId]?.[reasonId] || 0;
												return (
													<td key={reason.id} className='px-2 py-2'>
														<input
															type='number'
															min='0'
															value={value === 0 ? '' : value}
															onChange={e =>
																handleInputChange(skuId, reasonId, e.target.value)
															}
															className='w-full px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all'
															placeholder='0'
														/>
													</td>
												);
											})}
											<td className='px-2 py-2 text-center text-xs font-bold text-gray-900 bg-gray-100 border-l border-gray-200'>
												{total}
											</td>
										</tr>
									);
								})}
								{/* Grand Total Row */}
								{skus.length > 0 && (
									<tr className='bg-gray-200 border-t-2 border-gray-400'>
										<td className='px-3 py-2 text-xs font-bold text-gray-900 sticky left-0 bg-gray-200 z-10 border-r-2 border-gray-400'>
											Grand Total
										</td>
										{rejectionReasons.map(reason => {
											const columnTotal = skus.reduce((sum, sku) => {
												const skuId = sku.containerTypeId.toString();
												const reasonId = reason.id.toString();
												return sum + (formData[skuId]?.[reasonId] || 0);
											}, 0);
											return (
												<td
													key={reason.id}
													className='px-2 py-2 text-center text-xs font-bold text-gray-900'
												>
													{columnTotal}
												</td>
											);
										})}
										<td className='px-2 py-2 text-center text-xs font-bold text-gray-900 bg-gray-300 border-l-2 border-gray-400'>
											{grandTotal}
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Submit Button */}
				<div className='flex justify-end'>
					<Button
						onClick={handleSubmit}
						loading={submitting}
						disabled={submitting || skus.length === 0}
						size='lg'
					>
						Submit
					</Button>
				</div>

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

