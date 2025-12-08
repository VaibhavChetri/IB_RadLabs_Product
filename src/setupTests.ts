/**
 * Jest Setup File
 * Configures testing environment and global test utilities
 */

import '@testing-library/jest-dom';

// Mock window.matchMedia for useBreakpoint hook
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => {},
	}),
});

// Suppress console errors in tests
const originalError = console.error;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).beforeAll = () => {
	console.error = (...args: unknown[]) => {
		if (
			typeof args[0] === 'string' &&
			(args[0].includes('Warning: ReactDOM.render') ||
				args[0].includes('Warning: validateDOMNesting'))
		) {
			return;
		}
		originalError.call(console, ...args);
	};
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).afterAll = () => {
	console.error = originalError;
};
