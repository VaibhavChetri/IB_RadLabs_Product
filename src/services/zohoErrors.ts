/**
 * Shared error mapping for Zoho import/list endpoints.
 *
 * Backend contract: HTTP status is source of truth; body always carries
 * { code, message } with code == HTTP status. Never expect 200 + error body.
 * Read status from err.response.status and message from err.response.data.message.
 */

export type ZohoErrorKind =
	| 'rate_limit'
	| 'in_progress'
	| 'upstream_reject'
	| 'auth'
	| 'upstream_down'
	| 'validation'
	| 'unknown';

export interface MappedZohoError {
	kind: ZohoErrorKind;
	message: string;
	retryAfterSec?: number;
	needsReauth?: boolean;
}

const ZOHO_PREFIX = 'Zoho rejected request: ';

function stripBackendPrefix(msg: string): string {
	return msg.startsWith(ZOHO_PREFIX) ? msg.slice(ZOHO_PREFIX.length) : msg;
}

export function mapZohoError(status: number, message: string): MappedZohoError {
	const raw = message || 'Unknown error';
	switch (status) {
		case 429:
			return { kind: 'rate_limit', message: raw, retryAfterSec: 60 };
		case 409:
			return { kind: 'in_progress', message: 'A refresh is already in progress. Please wait for it to finish.' };
		case 400:
			return { kind: stripBackendPrefix(raw) === raw ? 'validation' : 'upstream_reject', message: stripBackendPrefix(raw) };
		case 401:
			return { kind: 'auth', message: 'Zoho connection expired, contact admin.', needsReauth: true };
		case 502:
			return { kind: 'upstream_down', message: raw };
		default:
			return { kind: 'unknown', message: 'Something went wrong. Try again.' };
	}
}

export function mapAxiosZohoError(err: any): MappedZohoError {
	const status = err?.response?.status ?? 0;
	const message = err?.response?.data?.message ?? err?.message ?? '';
	return mapZohoError(status, message);
}
