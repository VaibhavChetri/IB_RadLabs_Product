/**
 * Which user types are allowed to slice the finance pages (P&L, Revenue,
 * Monthly Estimates) by a city of their choice rather than being scoped to
 * their own assigned `city_id`.
 *
 * - 4: corporate/finance role with cross-city visibility.
 * - 31: CEO (Shashwat Gangwal) — needs all-city visibility for leadership reviews.
 *
 * Add new IDs here when more roles need the same capability.
 */
export const CITY_FILTER_USER_TYPES: ReadonlyArray<number> = [4, 31];

export function canFilterByCity(userTypeId: number | null | undefined): boolean {
	return userTypeId != null && CITY_FILTER_USER_TYPES.includes(userTypeId);
}
