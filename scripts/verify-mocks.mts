/**
 * Mock coverage verifier (dev tool).
 * Sweeps the ENTIRE src tree for API calls (axios via apiService/apiClient/api,
 * plus postUrlEncoded/postFormData/uploadWithProgress), runs each endpoint
 * through the mock route registry, and reports matched-vs-fallback + handler
 * errors. Also flags raw fetch() calls (which bypass the axios mock adapter).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_ROUTES } from '../src/mocks/registry.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');

function walk(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		if (name === 'node_modules' || name === '__tests__' || name === 'mocks') continue;
		const p = join(dir, name);
		const s = statSync(p);
		if (s.isDirectory()) out.push(...walk(p));
		else if (/\.tsx?$/.test(name) && !/\.test\.|\.spec\./.test(name)) out.push(p);
	}
	return out;
}

// .get('/x') / .post<T>('/x') / .put(`/x/${id}`) / .delete(...) / postUrlEncoded / postFormData / uploadWithProgress
const CALL_RE =
	/\.(get|post|put|patch|delete|postUrlEncoded|postFormData|uploadWithProgress)\s*(?:<[^>]*>)?\s*\(\s*[`'"]([^`'"]+)[`'"]/g;
const FETCH_RE = /(?<![.\w])fetch\s*\(\s*[`'"]([^`'"]+)[`'"]/g;

const methodMap: Record<string, string> = {
	get: 'GET', post: 'POST', put: 'PUT', patch: 'PATCH', delete: 'DELETE',
	posturlencoded: 'POST', postformdata: 'POST', uploadwithprogress: 'POST',
};

type EP = { method: string; path: string; file: string };
const eps: EP[] = [];
const fetchCalls: { url: string; file: string }[] = [];

for (const file of walk(SRC)) {
	const src = readFileSync(file, 'utf8');
	const rel = file.replace(ROOT + '/', '');
	let m: RegExpExecArray | null;
	CALL_RE.lastIndex = 0;
	while ((m = CALL_RE.exec(src))) {
		let path = m[2];
		if (!path.startsWith('/')) continue;
		path = path.replace(/\$\{[^}]+\}/g, '1').split('?')[0];
		eps.push({ method: methodMap[m[1].toLowerCase()], path, file: rel });
	}
	FETCH_RE.lastIndex = 0;
	while ((m = FETCH_RE.exec(src))) {
		if (/^https?:|^\//.test(m[1])) fetchCalls.push({ url: m[1], file: rel });
	}
}

const seen = new Set<string>();
const unique = eps.filter(e => {
	const k = `${e.method} ${e.path}`;
	if (seen.has(k)) return false;
	seen.add(k);
	return true;
});

function findRoute(method: string, path: string) {
	for (const r of ALL_ROUTES) {
		if (r.method !== 'ANY' && r.method !== method) continue;
		const mm = r.pattern.exec(path);
		if (mm) return { route: r, params: (mm.groups as Record<string, string>) || {} };
	}
	return null;
}

let matched = 0;
const fallbacks: EP[] = [];
const errors: string[] = [];
const empties: string[] = [];

for (const e of unique) {
	const hit = findRoute(e.method, e.path);
	if (!hit) { fallbacks.push(e); continue; }
	matched++;
	try {
		const body = hit.route.handler({
			method: e.method, path: e.path, url: e.path,
			query: { page: '1', limit: '20' }, body: {}, params: hit.params,
		});
		const data = (body && (body as any).data) ?? body;
		const len = Array.isArray(data) ? data.length
			: data && typeof data === 'object' ? Object.keys(data).length
			: data == null ? 0 : 1;
		if (!len) empties.push(`${e.method} ${e.path}`);
	} catch (err) {
		errors.push(`${e.method} ${e.path} -> ${(err as Error).message}`);
	}
}

// Group fallbacks by source-dir kind so genuine page/component gaps stand out.
const byArea = (e: EP) =>
	/^src\/(services|features)\//.test(e.file) ? 'service/feature layer' : 'PAGE/COMPONENT/HOOK (direct call)';
const grouped: Record<string, EP[]> = {};
for (const e of fallbacks) (grouped[byArea(e)] ??= []).push(e);

console.log(`\n=== MOCK COVERAGE (whole src tree) ===`);
console.log(`Endpoints found:                  ${unique.length}`);
console.log(`Matched a specific mock route:    ${matched}`);
console.log(`Fell through to generic fallback: ${fallbacks.length}`);
console.log(`Handler errors:                   ${errors.length}`);
console.log(`Matched but EMPTY data:           ${empties.length}`);
console.log(`Raw fetch() calls (bypass mock):  ${fetchCalls.length}`);

if (errors.length) { console.log(`\n--- HANDLER ERRORS ---`); errors.forEach(e => console.log('  ✗ ' + e)); }
if (empties.length) { console.log(`\n--- MATCHED BUT EMPTY (often intentional: mutations) ---`); empties.forEach(e => console.log('  • ' + e)); }
for (const [area, list] of Object.entries(grouped)) {
	console.log(`\n--- GENERIC FALLBACK · ${area} (${list.length}) ---`);
	list.forEach(e => console.log(`  - ${e.method} ${e.path}   [${e.file}]`));
}
if (fetchCalls.length) {
	console.log(`\n--- RAW fetch() (cannot be intercepted by axios mock) ---`);
	fetchCalls.forEach(f => console.log(`  ! ${f.url}   [${f.file}]`));
}
console.log('');
