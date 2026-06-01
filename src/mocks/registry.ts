/**
 * Mock route registry (LOCAL DEMO ONLY)
 * --------------------------------------------------------------------------
 * Aggregates per-module route definitions into a single ordered list that the
 * mock adapter matches against. Earlier routes win, so keep specific patterns
 * before broad ones within each module file.
 */

import { MockRoute } from './mockTypes';
import { routes as dashboards } from './data/dashboards';
import { routes as pnl } from './data/pnl';
import { routes as finances } from './data/finances';
import { routes as billing } from './data/billing';
import { routes as transit } from './data/transit';
import { routes as operations } from './data/operations';
import { routes as sales } from './data/sales';
import { routes as admin } from './data/admin';
import { routes as locationVariance } from './data/locationVariance';
import { routes as extras } from './data/extras';

export const ALL_ROUTES: MockRoute[] = [
	...dashboards,
	...pnl,
	...locationVariance,
	...finances,
	...billing,
	...transit,
	...operations,
	...sales,
	...admin,
	...extras,
];
