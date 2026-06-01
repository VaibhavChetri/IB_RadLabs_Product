/**
 * Generic fallback (LOCAL DEMO ONLY)
 * --------------------------------------------------------------------------
 * Returned for any request that no specific mock route matched. The goal is to
 * never crash a page: list-style endpoints get an empty array (+ empty
 * pagination), everything else gets an empty object. Extra sibling fields
 * (pagination/total/items/results) are harmless and cover varied envelopes.
 */

import { MockRequest } from './mockTypes';
import { pageMeta } from './mockHelpers';

const LIST_HINTS = /(list|listing|all|search|history|records|entries|items|report|summary|table|feed)/i;

function looksLikeList(path: string): boolean {
	if (LIST_HINTS.test(path)) return true;
	// Trailing plural noun, e.g. /clients, /invoices, /vehicles
	const last = path.split('/').filter(Boolean).pop() || '';
	return /[a-z]s$/i.test(last) && !/status|address|progress/i.test(last);
}

export function genericFallback(req: MockRequest) {
	const isList = req.method === 'GET' && looksLikeList(req.path);
	const data = isList ? [] : {};
	return {
		status_code: 200,
		statusCode: 200,
		status: 'Success',
		message: null,
		data,
		// Harmless siblings so varied list envelopes still read cleanly:
		items: [],
		results: [],
		records: [],
		total: 0,
		pagination: pageMeta(0),
	};
}
