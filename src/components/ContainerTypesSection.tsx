import React from 'react';
import { FloatingInput } from './ui/FloatingInput';
import { ClientSkuMapItem } from '../services/transitPlanApi';

interface ContainerTypesSectionProps {
	skuMapData: ClientSkuMapItem[];
	containerCounts: Record<number, number>;
	onContainerCountChange: (containerTypeId: number, count: number) => void;
}

const ContainerTypesSection: React.FC<ContainerTypesSectionProps> = ({
	skuMapData,
	containerCounts,
	onContainerCountChange,
}) => {
	return (
		<div className='lg:col-span-2'>
			<div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
				<h2 className='text-xl font-semibold text-gray-900 mb-6'>📦 Container Types</h2>
				<div className='grid grid-cols-1 gap-4'>
					{skuMapData.map(item => {
						// Handle both camelCase and potential alternative field names
						const containerTypeName = item.containerType || (item as any).container_type || (item as any).containerTypeName || 'Container Type';
						return (
							<div key={item.containerTypeId}>
								<FloatingInput
									label={containerTypeName}
									type='number'
									value={containerCounts[item.containerTypeId]?.toString() || ''}
									onChange={value =>
										onContainerCountChange(item.containerTypeId, parseInt(value) || 0)
									}
									placeholder='0'
									className='w-full'
								/>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default ContainerTypesSection;
