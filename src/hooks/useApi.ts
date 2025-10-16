/**
 * Custom Hooks for API Management
 * Provides convenient hooks for API calls with loading states and error handling
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { clearError, selectApiState } from '../store/slices/apiSlice';
import { ApiResponse } from '../services';

// Generic API hook
export function useApi<TArgs = any, TReturn = any>(
	apiKey: string,
	apiCall: (args: TArgs) => Promise<ApiResponse<TReturn>>
) {
	const dispatch = useDispatch<AppDispatch>();
	const apiState = useSelector((state: RootState) => selectApiState(state, apiKey));

	const execute = useCallback(
		async (args: TArgs) => {
			try {
				const result = await apiCall(args);
				return result;
			} catch (error) {
				throw error;
			}
		},
		[apiCall]
	);

	const clearApiError = useCallback(() => {
		dispatch(clearError(apiKey));
	}, [dispatch, apiKey]);

	return {
		...apiState,
		execute,
		clearError: clearApiError,
	};
}

// Hook for API calls with automatic execution
export function useApiCall<TArgs = any, TReturn = any>(
	apiKey: string,
	apiCall: (args: TArgs) => Promise<ApiResponse<TReturn>>,
	autoExecute: boolean = false,
	args?: TArgs
) {
	const apiHook = useApi(apiKey, apiCall);
	const hasExecuted = useRef(false);

	useEffect(() => {
		if (autoExecute && args && !hasExecuted.current) {
			hasExecuted.current = true;
			apiHook.execute(args);
		}
	}, [autoExecute, args, apiHook]);

	return apiHook;
}

// Hook for paginated data
export function usePaginatedApi<TArgs = any, TReturn = any>(
	apiKey: string,
	apiCall: (args: TArgs) => Promise<
		ApiResponse<{
			data: TReturn[];
			pagination: {
				page: number;
				limit: number;
				total: number;
				totalPages: number;
				hasNext: boolean;
				hasPrev: boolean;
			};
		}>
	>
) {
	const apiHook = useApi(apiKey, apiCall);
	const [data, setData] = useState<TReturn[]>([]);
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 0,
		hasNext: false,
		hasPrev: false,
	});

	const loadPage = useCallback(
		async (page: number, args?: TArgs) => {
			try {
				const result = await apiHook.execute({ ...args, page } as TArgs);
				setData(result.data.data);
				setPagination(result.data.pagination);
			} catch (error) {
				console.error('Failed to load page:', error);
			}
		},
		[apiHook]
	);

	const nextPage = useCallback(() => {
		if (pagination.hasNext) {
			loadPage(pagination.page + 1);
		}
	}, [pagination.hasNext, pagination.page, loadPage]);

	const prevPage = useCallback(() => {
		if (pagination.hasPrev) {
			loadPage(pagination.page - 1);
		}
	}, [pagination.hasPrev, pagination.page, loadPage]);

	return {
		...apiHook,
		data,
		pagination,
		loadPage,
		nextPage,
		prevPage,
	};
}

// Hook for real-time data
export function useRealtimeApi<T>(
	apiKey: string,
	apiCall: () => Promise<ApiResponse<T>>,
	interval: number = 30000
) {
	const apiHook = useApi(apiKey, apiCall);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	const startPolling = useCallback(() => {
		if (intervalRef.current) return;

		intervalRef.current = setInterval(async () => {
			try {
				await apiHook.execute({});
			} catch (error) {
				console.error('Real-time API call failed:', error);
			}
		}, interval);
	}, [apiHook, interval]);

	const stopPolling = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	useEffect(() => {
		return () => stopPolling();
	}, [stopPolling]);

	return {
		...apiHook,
		startPolling,
		stopPolling,
	};
}

// Hook for form submission
export function useFormApi<TArgs = any, TReturn = any>(
	apiKey: string,
	apiCall: (args: TArgs) => Promise<ApiResponse<TReturn>>
) {
	const apiHook = useApi(apiKey, apiCall);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const submit = useCallback(
		async (args: TArgs) => {
			setIsSubmitting(true);
			try {
				const result = await apiHook.execute(args);
				return result;
			} finally {
				setIsSubmitting(false);
			}
		},
		[apiHook]
	);

	return {
		...apiHook,
		isSubmitting,
		submit,
	};
}

// Hook for file upload
export function useFileUpload(
	apiKey: string,
	uploadCall: (file: File, onProgress?: (progress: number) => void) => Promise<ApiResponse<any>>
) {
	const apiHook = useApi(apiKey, uploadCall);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);

	const upload = useCallback(
		async (file: File) => {
			setIsUploading(true);
			setUploadProgress(0);

			try {
				const result = await uploadCall(file, progress => {
					setUploadProgress(progress);
				});
				return result;
			} finally {
				setIsUploading(false);
				setUploadProgress(0);
			}
		},
		[uploadCall]
	);

	return {
		...apiHook,
		upload,
		uploadProgress,
		isUploading,
	};
}
