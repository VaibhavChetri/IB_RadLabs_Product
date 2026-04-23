/** @type {import('jest').Config} */
export default {
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
	},
	transform: {
		'^.+\\.(ts|tsx)$': [
			'@swc/jest',
			{
				jsc: {
					parser: {
						syntax: 'typescript',
						tsx: true,
						decorators: false,
						dynamicImport: false,
					},
					transform: {
						react: {
							runtime: 'automatic',
						},
					},
				},
			},
		],
	},
	testMatch: [
		'<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
		'<rootDir>/src/**/*.{spec,test}.{ts,tsx}',
	],
	collectCoverageFrom: [
		'src/**/*.{ts,tsx}',
		'!src/**/*.d.ts',
		'!src/main.tsx',
		'!src/vite-env.d.ts',
		'!src/**/__tests__/**',
		'!src/**/*.test.{ts,tsx}',
		'!src/**/*.spec.{ts,tsx}',
	],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},
};
