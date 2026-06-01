/**
 * Mock API route types (LOCAL DEMO ONLY)
 */

export interface MockRequest {
	/** HTTP method, upper-case: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'. */
	method: string;
	/** Path after the API base URL, e.g. '/dashboard/ops/summary' (no query string). */
	path: string;
	/** Full original url including query string. */
	url: string;
	/** Parsed query params. */
	query: Record<string, string>;
	/** Parsed request body (JSON or url-encoded → object; FormData → raw). */
	body: any;
	/** Named capture groups from the route pattern. */
	params: Record<string, string>;
}

/** A handler returns the FULL response body (what `response.data` should be). */
export type MockHandler = (req: MockRequest) => any;

export interface MockRoute {
	/** 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'ANY'. */
	method: string;
	/** Tested against `req.path`. Use named groups (?<id>\d+) to capture params. */
	pattern: RegExp;
	/** Returns the full response envelope (use `ok(...)` from mockHelpers). */
	handler: MockHandler;
}
