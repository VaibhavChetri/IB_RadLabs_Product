/**
 * Component Tests for DashboardChart
 * Tests chart rendering, loading states, and error handling
 */

/**
 * Component Tests for DashboardChart
 * Tests chart rendering, loading states, and error handling
 */

import { vi } from 'jest';
import { render, screen } from '@testing-library/react';
import { DashboardChart } from '../DashboardChart';
import { DashboardKAMResponse } from '../../../../services/inventoryApi';

// Mock Recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
	ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
		<div data-testid='responsive-container'>{children}</div>
	),
	LineChart: ({ children }: { children: React.ReactNode }) => (
		<div data-testid='line-chart'>{children}</div>
	),
	Line: () => <div data-testid='line' />,
	XAxis: () => <div data-testid='x-axis' />,
	YAxis: () => <div data-testid='y-axis' />,
	CartesianGrid: () => <div data-testid='grid' />,
	Tooltip: () => <div data-testid='tooltip' />,
}));

// Mock useBreakpoint hook
vi.mock('../../../../hooks/useBreakpoint', () => ({
	useBreakpoint: () => ({
		isMobile: false,
		isTablet: false,
		isDesktop: true,
		breakpoint: 'lg' as const,
		width: 1024,
	}),
}));

const mockData: DashboardKAMResponse = {
	status_code: 200,
	segResult: {
		byDate: {
			'2025-10-01': { totalCount: 100, day: '01' },
			'2025-10-02': { totalCount: 200, day: '02' },
		},
		byWeek: [
			{
				weekNumber: 1,
				days: [
					{ date: '2025-10-01', totalCount: 100 },
					{ date: '2025-10-02', totalCount: 200 },
				],
			},
		],
	},
};

describe('DashboardChart', () => {
	it('should render loading state', () => {
		render(<DashboardChart data={null} loading={true} />);
		expect(screen.getByText(/loading chart data/i)).toBeInTheDocument();
	});

	it('should render no data message when data is null', () => {
		render(<DashboardChart data={null} loading={false} />);
		expect(screen.getByText(/no data available/i)).toBeInTheDocument();
	});

	it('should render chart with data', () => {
		render(<DashboardChart data={mockData} loading={false} />);
		expect(screen.getByText('SKU Count Trend')).toBeInTheDocument();
		expect(screen.getByTestId('line-chart')).toBeInTheDocument();
	});

	it('should have proper ARIA labels', () => {
		render(<DashboardChart data={mockData} loading={false} />);
		const chartRegion = screen.getByRole('region', { name: /SKU Count Trend Chart/i });
		expect(chartRegion).toBeInTheDocument();
	});

	it('should render chart description for screen readers', () => {
		render(<DashboardChart data={mockData} loading={false} />);
		const description = screen.getByText(/Chart showing SKU count trend/i);
		expect(description).toBeInTheDocument();
		expect(description.className).toContain('sr-only');
	});
});
