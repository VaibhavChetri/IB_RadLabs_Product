import React from 'react';
import DOMPurify from 'dompurify';

interface ImagePreviewProps {
	imageUrl: string;
	fileBase64?: string;
	photograph?: File | null;
	uploadingImage?: boolean;
	onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
	onLoad?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
	imageUrl,
	fileBase64,
	photograph,
	uploadingImage = false,
	onError,
	onLoad,
}) => {
	const renderSVGPreview = () => {
		if (!fileBase64) return 'SVG content not available';

		const svgContent = atob(fileBase64.split(',')[1]);
		const styledSVG = svgContent.replace(
			'<svg',
			'<svg style="max-width: 100%; max-height: 100%; width: auto; height: auto;"'
		);

		return DOMPurify.sanitize(styledSVG);
	};

	const renderFileInfo = () => (
		<div className='text-xs text-gray-500 mb-2'>
			File: {photograph?.name} | Type: {photograph?.type}
			{photograph?.size && photograph.size > 0 && <> | Size: {photograph.size} bytes</>}
		</div>
	);

	const renderErrorFallback = () => (
		<div className='text-center text-gray-500'>
			<p>⚠️ Image preview not available</p>
			<p className='text-xs'>
				File: {photograph?.name} ({photograph?.type})
			</p>
			<p className='text-xs'>This could be due to:</p>
			<ul className='text-xs text-left mt-2'>
				<li>• CORS policy restrictions</li>
				<li>• Invalid image URL</li>
				<li>• Network connectivity issues</li>
				<li>• Unsupported file format</li>
				<li>• SVG files may not display in some browsers</li>
			</ul>
		</div>
	);

	return (
		<div className='mt-4'>
			<p className='text-sm font-medium text-gray-700 mb-2'>
				{uploadingImage ? '📸 Uploading...' : '✅ Preview:'}
			</p>
			<div className='border border-gray-200 rounded-lg p-4 bg-gray-50'>
				{renderFileInfo()}

				{photograph?.type === 'image/svg+xml' ? (
					<div
						className='max-w-full h-48 flex items-center justify-center'
						dangerouslySetInnerHTML={{
							__html: renderSVGPreview(),
						}}
					/>
				) : (
					<img
						src={imageUrl}
						alt='Container photo preview'
						className='max-w-full h-48 object-contain mx-auto'
						onError={onError}
						onLoad={onLoad}
					/>
				)}

				<div className='hidden text-center text-gray-500'>{renderErrorFallback()}</div>
			</div>
		</div>
	);
};

export default ImagePreview;
