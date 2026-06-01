/**
 * Mock API Adapter (LOCAL DEMO ONLY)
 * --------------------------------------------------------------------------
 * A custom axios adapter that intercepts EVERY request on the shared API
 * client and returns realistic mock data instead of hitting the network.
 * This makes the whole dashboard fully browsable with no backend.
 *
 * Enabled by `VITE_USE_MOCK_API=true` (see .env). Wired up in src/services/api.ts.
 *
 * Matching: requests are matched against the route registry (src/mocks/registry.ts)
 * by method + path pattern. Unmatched requests fall through to a generic
 * fallback (src/mocks/fallback.ts) so nothing ever errors.
 */

import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { MockRequest } from './mockTypes';
import { ALL_ROUTES } from './registry';
import { genericFallback } from './fallback';

export const isMockApiEnabled = (): boolean =>
	import.meta.env.VITE_USE_MOCK_API === 'true';

/** Parse `?a=1&b=2` into an object. */
function parseQuery(qs: string): Record<string, string> {
	const out: Record<string, string> = {};
	if (!qs) return out;
	for (const pair of qs.replace(/^\?/, '').split('&')) {
		if (!pair) continue;
		const [k, v = ''] = pair.split('=');
		out[decodeURIComponent(k)] = decodeURIComponent(v);
	}
	return out;
}

/** Best-effort parse of the request body into an object. */
function parseBody(data: unknown): any {
	if (data == null) return undefined;
	if (typeof data !== 'string') return data; // FormData / object — pass through
	try {
		return JSON.parse(data);
	} catch {
		// url-encoded form body
		if (data.includes('=')) return parseQuery(data);
		return data;
	}
}

function buildResponse(config: InternalAxiosRequestConfig, body: unknown): AxiosResponse {
	return {
		data: body,
		status: 200,
		statusText: 'OK',
		headers: {},
		// axios types want a config back; the original is fine for our purposes
		config,
		request: {},
	};
}

export const mockAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
	const method = (config.method || 'get').toUpperCase();
	const baseURL = config.baseURL || '';
	let url = config.url || '';
	if (baseURL && url.startsWith(baseURL)) url = url.slice(baseURL.length);
	const [rawPath, qs = ''] = url.split('?');
	const path = rawPath || '/';

	const req: MockRequest = {
		method,
		path,
		url,
		query: { ...parseQuery(qs), ...((config.params as Record<string, string>) || {}) },
		body: parseBody(config.data),
		params: {},
	};

	for (const route of ALL_ROUTES) {
		if (route.method !== 'ANY' && route.method !== method) continue;
		const match = route.pattern.exec(path);
		if (match) {
			req.params = (match.groups as Record<string, string>) || {};
			try {
				const body = route.handler(req);
				return buildResponse(config, body);
			} catch (err) {
				// A buggy handler must never break the demo — fall back gracefully.
				// eslint-disable-next-line no-console
				console.warn(`[mockAdapter] handler error for ${method} ${path}:`, err);
				return buildResponse(config, genericFallback(req));
			}
		}
	}

	// eslint-disable-next-line no-console
	console.debug(`[mockAdapter] no route for ${method} ${path} — using generic fallback`);
	return buildResponse(config, genericFallback(req));
};
