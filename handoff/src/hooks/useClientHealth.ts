/**
 * useClientHealth — thin wrapper around ClientHealthApi.list with loading +
 * error state. v1 uses local component state; if you have a SWR/React-Query
 * setup in the repo, swap the body for that.
 *
 * Used by Pulse, ClientsLedger, and ClientDetail.
 *
 * Usage:
 *   const { data, isLoading, error, refresh } = useClientHealth({ priority: 'high' });
 */

import { useCallback, useEffect, useState } from 'react';
import { ClientHealthApi, type ClientHealthResponse, type ClientHealthParams } from '../services/clientHealthApi';

interface State {
	data: ClientHealthResponse | null;
	isLoading: boolean;
	error: string | null;
}

const EMPTY: ClientHealthResponse = {
	customers: [],
	meta: {
		total_customers: 0,
		total_threads: 0,
		total_outstanding: 0,
		total_overdue: 0,
		total_broken_commitments: 0,
		total_high_priority: 0,
	},
};

export function useClientHealth(params: ClientHealthParams = {}) {
	const [state, setState] = useState<State>({ data: null, isLoading: true, error: null });

	// Serialize params so the effect doesn't re-run on object identity.
	const key = JSON.stringify(params);

	const load = useCallback(() => {
		setState(s => ({ ...s, isLoading: true, error: null }));
		ClientHealthApi.list(params)
			.then(data => setState({ data, isLoading: false, error: null }))
			.catch(e => setState({ data: null, isLoading: false, error: e?.message ?? 'Failed to load' }));
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);

	useEffect(() => { load(); }, [load]);

	return {
		data: state.data ?? EMPTY,
		isLoading: state.isLoading,
		error: state.error,
		refresh: load,
	};
}
