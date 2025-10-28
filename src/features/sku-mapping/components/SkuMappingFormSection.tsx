import React from 'react';
import { FloatingInput } from '../../../components/ui/FloatingInput';

interface SkuMappingFormSectionProps {
	impactType: string;
	electricityConsumed: string;
	setElectricityConsumed: (value: string) => void;
	waterConsumed: string;
	setWaterConsumed: (value: string) => void;
	srcingDistance: string;
	setSrcingDistance: (value: string) => void;
	qtyTransportedOneTrip: string;
	setQtyTransportedOneTrip: (value: string) => void;
}

export const SkuMappingFormSection: React.FC<SkuMappingFormSectionProps> = ({
	impactType,
	electricityConsumed,
	setElectricityConsumed,
	waterConsumed,
	setWaterConsumed,
	srcingDistance,
	setSrcingDistance,
	qtyTransportedOneTrip,
	setQtyTransportedOneTrip,
}) => {
	const showDistanceFields = impactType === 'Single use PP' || impactType === 'Clamshell';

	return (
		<div className='bg-background rounded-lg border border-border p-4 mb-4'>
			<h3 className='text-base font-semibold mb-4'>Fields</h3>
			<div className='grid grid-cols-2 gap-4'>
				<FloatingInput
					label='Electricity consumed per dishwasher'
					type='number'
					value={electricityConsumed}
					onChange={value => setElectricityConsumed(value)}
				/>
				<FloatingInput
					label='Water consumed per cycle'
					type='number'
					value={waterConsumed}
					onChange={value => setWaterConsumed(value)}
				/>
				{showDistanceFields && (
					<>
						<FloatingInput
							label='Distance travelled from vendor'
							type='number'
							value={srcingDistance}
							onChange={value => setSrcingDistance(value)}
						/>
						<FloatingInput
							label='Qty transported in one trip'
							type='number'
							value={qtyTransportedOneTrip}
							onChange={value => setQtyTransportedOneTrip(value)}
						/>
					</>
				)}
			</div>
		</div>
	);
};
