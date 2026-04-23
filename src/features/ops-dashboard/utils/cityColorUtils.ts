/**
 * City Color Mapping Utility
 * Maps city_id (1-20) to predefined noticeably different colors
 */

const CITY_COLORS = [
	'#22c55e', // green-500
	'#3b82f6', // blue-500
	'#06b6d4', // cyan-500
	'#f97316', // orange-500
	'#ef4444', // red-500
	'#8b5cf6', // violet-500
	'#eab308', // yellow-500
	'#ec4899', // pink-500
	'#14b8a6', // teal-500
	'#f59e0b', // amber-500
	'#10b981', // emerald-500
	'#6366f1', // indigo-500
	'#84cc16', // lime-500
	'#f43f5e', // rose-500
	'#0ea5e9', // sky-400
	'#64748b', // slate-500
	'#d946ef', // fuchsia-500
	'#22d3ee', // cyan-400
	'#a855f7', // purple-500
	'#0891b2', // cyan-600
];

/**
 * Get color for a city based on city_id
 * city_id 1-20 maps to colors 0-19 (city_id - 1)
 * For city_id > 20, cycles through colors using modulo
 */
export const getCityColorById = (cityId: number): string => {
	const index = (cityId - 1) % CITY_COLORS.length;
	return CITY_COLORS[index];
};

/**
 * Get consistent color for a city based on city name (fallback for legacy code)
 * @deprecated Use getCityColorById instead
 */
export const getCityColor = (cityName: string): string => {
	const normalizedName = cityName.toLowerCase().trim();
	let hash = 0;
	for (let i = 0; i < normalizedName.length; i++) {
		const char = normalizedName.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	const index = Math.abs(hash) % CITY_COLORS.length;
	return CITY_COLORS[index];
};

/**
 * Get all available colors
 */
export const getCityColors = (): string[] => {
	return [...CITY_COLORS];
};
