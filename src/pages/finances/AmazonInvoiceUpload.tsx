/**
 * Amazon Invoice Upload – Finances > Amazon Invoice > Upload
 * Supports uploading up to 10 PDF files via multipart POST.
 */

import React, { useCallback, useRef, useState } from 'react';
import { PageHeader } from '../../components/ui';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { isMockApiEnabled } from '../../mocks/mockAdapter';

const UPLOAD_URL =
	import.meta.env.VITE_AMAZON_INVOICE_UPLOAD_URL || 'http://127.0.0.1:8000/invoices/upload';
const MAX_FILES = 10;

interface FileEntry {
	id: string;
	file: File;
}

interface UploadResult {
	success: boolean;
	message: string;
}

const AmazonInvoiceUpload: React.FC = () => {
	const [files, setFiles] = useState<FileEntry[]>([]);
	const [dragging, setDragging] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [result, setResult] = useState<UploadResult | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const addFiles = (incoming: File[]) => {
		const pdfs = incoming.filter(f => f.type === 'application/pdf');
		setFiles(prev => {
			const combined = [
				...prev,
				...pdfs.map(f => ({ id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`, file: f })),
			];
			return combined.slice(0, MAX_FILES);
		});
		setResult(null);
	};

	const removeFile = (id: string) => {
		setFiles(prev => prev.filter(e => e.id !== id));
		setResult(null);
	};

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragging(false);
		addFiles(Array.from(e.dataTransfer.files));
	}, []);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setDragging(true);
	};

	const handleDragLeave = () => setDragging(false);

	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			addFiles(Array.from(e.target.files));
			e.target.value = '';
		}
	};

	const handleUpload = async () => {
		if (files.length === 0) return;
		setUploading(true);
		setResult(null);
		try {
			// LOCAL DEMO: the upload endpoint lives on a separate host and can't be
			// intercepted by the axios mock adapter, so simulate a successful upload.
			if (isMockApiEnabled()) {
				await new Promise(r => setTimeout(r, 700));
				setResult({
					success: true,
					message: `${files.length} file${files.length === 1 ? '' : 's'} uploaded and queued for parsing.`,
				});
				setFiles([]);
				setUploading(false);
				return;
			}

			const formData = new FormData();
			files.forEach(entry => formData.append('files', entry.file));

			const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
			const json = await res.json().catch(() => null);

			if (res.ok) {
				setResult({ success: true, message: json?.message || 'Files uploaded successfully.' });
				setFiles([]);
			} else {
				setResult({
					success: false,
					message: json?.message || json?.error || `Upload failed (HTTP ${res.status}).`,
				});
			}
		} catch (err: any) {
			setResult({ success: false, message: err?.message || 'Upload failed. Check that the server is running.' });
		} finally {
			setUploading(false);
		}
	};

	const slotsLeft = MAX_FILES - files.length;

	return (
		<div className="space-y-6">
			<PageHeader title="Amazon Invoice Upload" locationName="Finances / Amazon Invoice" totalItems={0} itemType="files" />

			<div className="max-w-2xl space-y-5">
				{/* Drop zone */}
				<div
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onClick={() => slotsLeft > 0 && inputRef.current?.click()}
					className={cn(
						'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 transition-colors select-none',
						slotsLeft > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
						dragging
							? 'border-blue-400 bg-blue-50'
							: 'border-gray-300 bg-white hover:border-blue-300 hover:bg-gray-50'
					)}
				>
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
						<Upload className="h-6 w-6 text-blue-500" />
					</div>
					<div className="text-center">
						<p className="text-sm font-medium text-gray-700">
							{slotsLeft > 0 ? 'Drop PDF files here or click to browse' : `Maximum ${MAX_FILES} files reached`}
						</p>
						<p className="mt-1 text-xs text-gray-400">
							PDF only · Up to {MAX_FILES} files · {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} remaining
						</p>
					</div>
					<input
						ref={inputRef}
						type="file"
						accept="application/pdf"
						multiple
						className="hidden"
						onChange={handleFileInput}
					/>
				</div>

				{/* File list */}
				{files.length > 0 && (
					<div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
						<div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between">
							<span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
								{files.length} file{files.length !== 1 ? 's' : ''} selected
							</span>
							<button
								onClick={() => { setFiles([]); setResult(null); }}
								className="text-xs text-gray-400 hover:text-red-500 transition-colors"
							>
								Clear all
							</button>
						</div>
						{files.map(entry => (
							<div key={entry.id} className="flex items-center gap-3 px-4 py-3">
								<FileText className="h-5 w-5 text-blue-400 shrink-0" />
								<div className="flex-1 min-w-0">
									<p className="text-sm text-gray-800 truncate">{entry.file.name}</p>
									<p className="text-xs text-gray-400">
										{(entry.file.size / 1024).toFixed(1)} KB
									</p>
								</div>
								<button
									onClick={() => removeFile(entry.id)}
									disabled={uploading}
									className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
						))}
					</div>
				)}

				{/* Result banner */}
				{result && (
					<div
						className={cn(
							'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
							result.success
								? 'border-green-200 bg-green-50 text-green-800'
								: 'border-red-200 bg-red-50 text-red-800'
						)}
					>
						{result.success ? (
							<CheckCircle2 className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
						) : (
							<AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
						)}
						<p>{result.message}</p>
					</div>
				)}

				{/* Upload button */}
				<button
					onClick={handleUpload}
					disabled={files.length === 0 || uploading}
					className={cn(
						'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors',
						files.length > 0 && !uploading
							? 'bg-blue-600 text-white hover:bg-blue-700'
							: 'bg-gray-100 text-gray-400 cursor-not-allowed'
					)}
				>
					{uploading ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Uploading…
						</>
					) : (
						<>
							<Upload className="h-4 w-4" />
							Upload {files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''}` : 'Files'}
						</>
					)}
				</button>
			</div>
		</div>
	);
};

export default AmazonInvoiceUpload;
