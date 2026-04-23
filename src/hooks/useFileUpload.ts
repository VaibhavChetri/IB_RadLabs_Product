import { useState, useCallback } from 'react';
import { TransitPlanApi } from '../services/transitPlanApi';

export const useFileUpload = () => {
	const [photograph, setPhotograph] = useState<File | null>(null);
	const [imageUrl, setImageUrl] = useState<string>('');
	const [localPreviewUrl, setLocalPreviewUrl] = useState<string>('');
	const [fileBase64, setFileBase64] = useState<string>('');
	const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
	const [uploadingImage, setUploadingImage] = useState(false);

	const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
		console.log('📁 File input changed:', event.target.files);
		const file = event.target.files?.[0];
		if (file) {
			console.log('📁 File selected:', file.name, file.size, file.type);
			setPhotograph(file);

			// Create local preview URL immediately
			const newLocalPreviewUrl = URL.createObjectURL(file);
			console.log('🖼️ Created new local preview URL:', newLocalPreviewUrl);
			setLocalPreviewUrl(newLocalPreviewUrl);
			setImageUrl(newLocalPreviewUrl);
			console.log('🖼️ Set imageUrl to:', newLocalPreviewUrl);

			// Convert file to base64 for persistent local storage
			const reader = new FileReader();
			reader.onload = e => {
				const base64 = e.target?.result as string;
				setFileBase64(base64);
				console.log('📁 Converted file to base64, length:', base64.length);
			};
			reader.readAsDataURL(file);

			setUploadingImage(true);

			try {
				console.log('📸 Uploading image immediately...');
				const imageResponse = (await TransitPlanApi.uploadImage(file)) as {
					data?: {
						imgLocation?: string[];
					};
				};
				console.log('📸 Full image upload response:', imageResponse);
				console.log('📸 Response keys:', Object.keys(imageResponse));

				// Debug the response structure
				if (imageResponse.data) {
					console.log('📸 imageResponse.data exists:', imageResponse.data);
					console.log('📸 imageResponse.data.imgLocation:', imageResponse.data.imgLocation);
				} else {
					console.log('📸 imageResponse.data is undefined');
					console.log('📸 imageResponse structure:', JSON.stringify(imageResponse, null, 2));
				}

				// Try to extract the image URL safely
				let uploadedImageUrl = '';
				if (
					imageResponse.data &&
					imageResponse.data.imgLocation &&
					imageResponse.data.imgLocation[0]
				) {
					uploadedImageUrl = imageResponse.data.imgLocation[0];
				} else {
					throw new Error('Could not find imgLocation in response');
				}

				console.log('📸 Image URL extracted:', uploadedImageUrl);

				// Store uploaded image URL but keep showing local preview
				setUploadedImageUrl(uploadedImageUrl);
			} catch (error) {
				console.error('❌ Image upload error:', error);
				// Even if upload fails, we still have local preview
				setUploadedImageUrl(''); // Explicitly set to empty
				throw error;
			} finally {
				setUploadingImage(false);
			}
		} else {
			console.log('📁 No file selected');
		}
	}, []);

	const resetFileUpload = useCallback(() => {
		setPhotograph(null);
		setImageUrl('');
		setLocalPreviewUrl('');
		setFileBase64('');
		setUploadedImageUrl('');
		setUploadingImage(false);
	}, []);

	const restoreFromLocalStorage = useCallback(
		(savedData: { fileBase64?: string; uploadedImageUrl?: string; photographName?: string }) => {
			console.log('🔄 Restoring image data from localStorage:', savedData);

			if (savedData.photographName) {
				// Create a mock file object for display purposes
				const mockFile = new File([''], savedData.photographName, {
					type: savedData.photographName.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg',
				});
				setPhotograph(mockFile);
				console.log('📸 Restored photograph file:', savedData.photographName);
			}

			// Restore image preview - prioritize base64 for true local preview
			if (savedData.fileBase64) {
				setImageUrl(savedData.fileBase64);
				setFileBase64(savedData.fileBase64);
				setUploadedImageUrl(savedData.uploadedImageUrl || '');
				console.log('🖼️ Restored local image preview from base64');
			} else if (savedData.uploadedImageUrl) {
				setImageUrl(savedData.uploadedImageUrl);
				setUploadedImageUrl(savedData.uploadedImageUrl);
				console.log('🖼️ Fallback to uploaded image URL:', savedData.uploadedImageUrl);
			}
		},
		[]
	);

	return {
		photograph,
		imageUrl,
		localPreviewUrl,
		fileBase64,
		uploadedImageUrl,
		uploadingImage,
		handleFileUpload,
		resetFileUpload,
		restoreFromLocalStorage,
	};
};
