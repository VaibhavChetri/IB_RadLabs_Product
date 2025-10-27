import React from 'react';
import { FloatingInput } from './ui/FloatingInput';
import ImagePreview from './ImagePreview';

interface PickupFormSectionProps {
	adhocTransportation: boolean;
	onAdhocTransportationChange: (value: boolean) => void;
	pickupVehicleNumber: string;
	onPickupVehicleNumberChange: (value: string) => void;
	signatureName: string;
	onSignatureNameChange: (value: string) => void;
	photograph: File | null;
	imageUrl: string;
	fileBase64?: string;
	uploadingImage: boolean;
	uploadedImageUrl: string;
	onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const PickupFormSection: React.FC<PickupFormSectionProps> = ({
	adhocTransportation,
	onAdhocTransportationChange,
	pickupVehicleNumber,
	onPickupVehicleNumberChange,
	signatureName,
	onSignatureNameChange,
	photograph,
	imageUrl,
	fileBase64,
	uploadingImage,
	uploadedImageUrl,
	onFileUpload,
}) => {
	const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
		console.error('❌ Image load error:', e);
		console.error('❌ Failed URL:', imageUrl);
		console.error('❌ File type:', photograph?.type);
		console.error('❌ File name:', photograph?.name);
		e.currentTarget.style.display = 'none';
		const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
		if (errorDiv) errorDiv.style.display = 'block';
	};

	const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
		console.log('✅ Image loaded successfully:', imageUrl);
		console.log('✅ File type:', photograph?.type);
	};

	return (
		<div className='lg:col-span-3'>
			<div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
				<h2 className='text-xl font-semibold text-gray-900 mb-4'>Pickup Details</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{/* Adhoc Transportation Toggle */}
					<div className='md:col-span-2'>
						<label className='flex items-center space-x-3'>
							<input
								type='checkbox'
								checked={adhocTransportation}
								onChange={e => onAdhocTransportationChange(e.target.checked)}
								className='w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2'
							/>
							<span className='text-sm font-medium text-gray-700'>Adhoc Transportation</span>
						</label>
					</div>

					{/* Pickup Vehicle Number */}
					<div>
						<FloatingInput
							label='Pickup Vehicle Number*'
							type='text'
							value={pickupVehicleNumber}
							onChange={onPickupVehicleNumberChange}
							placeholder='Enter vehicle number'
						/>
					</div>

					{/* Signature Name */}
					<div>
						<FloatingInput
							label='Signature Name'
							type='text'
							value={signatureName}
							onChange={onSignatureNameChange}
							placeholder='Enter signature name'
						/>
					</div>

					{/* Photograph Upload */}
					<div className='md:col-span-2'>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Photo After Unloading Containers From Vehicle
						</label>
						<div className='flex gap-2'>
							{/* Take Picture Button */}
							<div className='relative flex-1'>
								<input
									type='file'
									accept='image/*'
									capture='environment'
									onChange={onFileUpload}
									disabled={uploadingImage}
									className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
								/>
								<div className='flex items-center justify-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors'>
									<span className='text-sm font-medium text-green-600'>📸 Take Picture</span>
								</div>
							</div>

							{/* Choose File Button */}
							<div className='relative flex-1'>
								<input
									type='file'
									accept='image/*'
									onChange={onFileUpload}
									disabled={uploadingImage}
									className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
								/>
								<div className='flex items-center justify-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors'>
									<span className='text-sm font-medium text-blue-600'>📁 Choose File</span>
								</div>
							</div>
						</div>
						{uploadingImage && <p className='mt-2 text-sm text-blue-600'>📸 Uploading image...</p>}
						{photograph && !uploadingImage && (
							<p className='mt-2 text-sm text-gray-600'>
								Selected: {photograph.name}
								{uploadedImageUrl && <span className='ml-2 text-green-600'>✅ Uploaded</span>}
							</p>
						)}
						{!photograph && uploadedImageUrl && !uploadingImage && (
							<p className='mt-2 text-sm text-green-600'>
								📸 Image uploaded: {uploadedImageUrl.split('/').pop()}
							</p>
						)}
						{imageUrl && (
							<ImagePreview
								imageUrl={imageUrl}
								fileBase64={fileBase64}
								photograph={photograph}
								uploadingImage={uploadingImage}
								onError={handleImageError}
								onLoad={handleImageLoad}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default PickupFormSection;
