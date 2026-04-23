/**
 * Generic Stacked Bar Chart Component
 * Displays daily data as a 100% stacked bar chart using ApexCharts
 */

import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export interface CityData {
	id: number;
	name: string;
}

export interface CityMetadata {
	totalClients?: number;
	enteredClients?: number;
	percentage?: number | string;
}

export interface StackedChartDataPoint {
	date: string;
	day: number;
	month: string;
	dayOfWeek: string;
	[cityId: string]: string | number | CityMetadata | undefined; // Dynamic city IDs as keys (e.g., "1", "2") or metadata (e.g., "1_metadata")
}

export interface StackedBarChartProps {
	data: StackedChartDataPoint[];
	cities: Array<{ id: number; name: string; color: string }>;
	ariaLabel?: string;
	yAxisFormatter?: (val: number) => string;
	yAxisMax?: number;
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
	data,
	cities,
	ariaLabel = 'Stacked Bar Chart',
	yAxisFormatter = (val: number) => `${val}%`,
	yAxisMax = 100,
}) => {
	const { isMobile } = useBreakpoint();

	// Sort cities by city_id (ascending) for consistent stacking order
	const sortedCities = useMemo(() => {
		return [...cities].sort((a, b) => a.id - b.id);
	}, [cities]);

	// Prepare ApexCharts series data
	// Reverse order so first city (lowest ID) appears at bottom (ApexCharts stacks last-to-first)
	const series = useMemo(() => {
		return [...sortedCities].reverse().map(city => ({
			name: city.name,
			data: data.map(entry => entry[city.id.toString()] as number),
		}));
	}, [data, sortedCities]);

	// Calculate max value for Y-axis if not provided
	const maxValue = useMemo(() => {
		if (yAxisMax !== undefined) return yAxisMax;
		// Calculate max from data
		const maxes = data.map(entry => {
			return sortedCities.reduce((sum, city) => {
				const value = (entry[city.id.toString()] as number) || 0;
				return sum + value;
			}, 0);
		});
		return Math.max(...maxes, 0) * 1.1; // Add 10% padding
	}, [data, sortedCities, yAxisMax]);

	// ApexCharts configuration
	const chartOptions = useMemo(() => {
		return {
			chart: {
				type: 'bar' as const,
				stacked: true,
				stackType: yAxisMax === 100 ? ('100%' as const) : undefined,
				toolbar: { show: false },
				background: 'transparent',
				foreColor: '#6b7280',
			},
			plotOptions: {
				bar: {
					horizontal: false,
					borderRadius: 4,
					dataLabels: {
						position: 'center' as const,
						hideOverflowingLabels: false,
					},
				},
			},
			dataLabels: {
				enabled: true,
				formatter: function (_val: number, opts: { seriesIndex: number; dataPointIndex: number }) {
					try {
						// Since series is reversed, calculate the actual city index
						const actualCityIndex = sortedCities.length - 1 - opts.seriesIndex;

						if (
							actualCityIndex >= 0 &&
							actualCityIndex < sortedCities.length &&
							opts.dataPointIndex >= 0 &&
							opts.dataPointIndex < data.length
						) {
							const city = sortedCities[actualCityIndex];
							const entry = data[opts.dataPointIndex];

							if (city && entry) {
								// For 100% stacked charts (KAM/Sent Transit), show actual percentage from API
								// For value stacked charts (Transit Delay), show the actual value
								if (yAxisMax === 100) {
									const metadataKey = `${city.id}_metadata`;
									const metadata = entry[metadataKey] as CityMetadata | undefined;

									if (metadata?.percentage !== undefined) {
										if (
											typeof metadata.percentage === 'string' &&
											!metadata.percentage.includes('hrs')
										) {
											const percentage = parseFloat(metadata.percentage);
											if (!isNaN(percentage) && percentage > 0) {
												const formatted = percentage.toFixed(1);
												return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
											}
										}
									}
								}

								// For Transit Delay or fallback, show the actual value
								const value = entry[city.id.toString()] as number | undefined;
								if (value !== undefined && !isNaN(value) && value > 0) {
									const formatted = value.toFixed(1);
									return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
								}
							}
						}
					} catch {
						// Silently fail if there's an error
					}
					return '';
				},
				style: {
					fontSize: isMobile ? '8px' : '10px',
					fontWeight: 700,
					colors: ['#ffffff'],
					fontFamily:
						'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
					letterSpacing: '0.02em',
				},
				offsetY: 0,
				dropShadow: {
					enabled: true,
					top: 1,
					left: 1,
					blur: 1,
					color: '#000',
					opacity: 0.45,
				},
			},
			xaxis: {
				categories: data.map(entry => `${entry.day} ${entry.month}(${entry.dayOfWeek})`),
				labels: {
					style: {
						fontSize: isMobile ? '10px' : '12px',
						colors: '#6b7280',
						fontFamily: 'Public Sans, sans-serif',
					},
					rotate: -45,
					rotateAlways: true,
				},
			},
			yaxis: {
				max: maxValue,
				labels: {
					style: {
						fontSize: isMobile ? '10px' : '12px',
						colors: '#6b7280',
						fontFamily: 'Public Sans, sans-serif',
					},
					formatter: yAxisFormatter,
				},
			},
			legend: {
				position: 'top' as const,
				horizontalAlign: 'right' as const,
				offsetY: 0,
				itemMargin: {
					horizontal: 10,
					vertical: 5,
				},
				markers: {
					size: 8,
				},
				fontFamily: 'Public Sans, sans-serif',
			},
			tooltip: {
				theme: 'light',
				backgroundColor: '#ffffff',
				borderColor: '#e5e7eb',
				borderWidth: 1,
				style: {
					fontSize: isMobile ? '12px' : '14px',
					fontFamily: 'Public Sans, sans-serif',
				},
				custom: function ({
					seriesIndex,
					dataPointIndex,
				}: {
					seriesIndex: number;
					dataPointIndex: number;
				}) {
					try {
						const city = sortedCities[sortedCities.length - 1 - seriesIndex];
						const entry = data[dataPointIndex];

						if (!city || !entry) return '';

						const metadataKey = `${city.id}_metadata`;
						const metadata = entry[metadataKey] as CityMetadata | undefined;

						const value = entry[city.id.toString()] as number | undefined;

						// For KAM/Sent Transit charts (100% stacked), show actual percentage from API instead of segment percentage
						// For Transit Delay (value stacked), show the formatted value (avgDelay hours)
						let displayValue: string;
						if (yAxisMax === 100 && metadata?.percentage !== undefined) {
							// Show actual percentage from API for KAM/Sent Transit
							if (typeof metadata.percentage === 'string' && !metadata.percentage.includes('hrs')) {
								const percentage = parseFloat(metadata.percentage);
								if (!isNaN(percentage)) {
									const formattedPct = percentage.toFixed(1);
									displayValue = `${formattedPct.endsWith('.0') ? formattedPct.slice(0, -2) : formattedPct}%`;
								} else {
									displayValue = metadata.enteredClients?.toString() || '0';
								}
							} else {
								displayValue = metadata.enteredClients?.toString() || '0';
							}
						} else {
							// Show formatted value for Transit Delay (hours)
							displayValue = value !== undefined ? yAxisFormatter(value) : '0';
						}

						let tooltipHTML = `
							<div style="padding: ${isMobile ? '8px' : '12px'}; font-family: 'Public Sans, sans-serif';">
								<div style="font-weight: 600; margin-bottom: 6px; color: #111827;">
									${city.name}
								</div>
								<div style="color: #6b7280; font-size: ${isMobile ? '11px' : '13px'};">
									${displayValue}
								</div>
						`;

						if (metadata) {
							if (metadata.totalClients !== undefined) {
								tooltipHTML += `
									<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: ${isMobile ? '10px' : '12px'};">
								`;

								// Show entered/total for KAM/Sent Transit, or total clients for Transit Delay
								if (
									metadata.enteredClients !== undefined &&
									metadata.enteredClients !== metadata.totalClients
								) {
									tooltipHTML += `<div>Entered: ${metadata.enteredClients} / ${metadata.totalClients}</div>`;
								} else {
									tooltipHTML += `<div>Total Clients: ${metadata.totalClients}</div>`;
								}

								// Only show percentage for Transit Delay (since KAM/Sent Transit already shows it as main value)
								if (
									metadata.percentage !== undefined &&
									yAxisMax !== 100 &&
									typeof metadata.percentage === 'string' &&
									metadata.percentage.includes('hrs')
								) {
									// For transit delay - show avg delay
									tooltipHTML += `
										<div>${metadata.percentage}</div>
									`;
								}

								tooltipHTML += `</div>`;
							}
						}

						tooltipHTML += `</div>`;
						return tooltipHTML;
					} catch {
						return '';
					}
				},
			},
			grid: {
				borderColor: '#e5e7eb',
				strokeDashArray: 3,
				xaxis: {
					lines: {
						show: false,
					},
				},
				yaxis: {
					lines: {
						show: true,
					},
				},
			},
			colors: [...sortedCities].reverse().map(city => city.color),
			fill: {
				opacity: 1,
			},
		};
	}, [data, sortedCities, isMobile, yAxisFormatter, yAxisMax, maxValue]);

	if (data.length === 0 || cities.length === 0) {
		return <div className='text-center text-gray-500 py-8'>No daily data available</div>;
	}

	return (
		<div role='region' aria-label={ariaLabel} className='bg-white'>
			<Chart options={chartOptions} series={series} type='bar' height={isMobile ? 300 : 400} />
		</div>
	);
};
