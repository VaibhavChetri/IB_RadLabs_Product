/**
 * The 5 tabs in the variance analyzer, one per billing mode (Mode 4 split
 * by sub_type). These are the units of analysis — each tab fetches its own
 * /summary call with the right (billing_type_id, billing_sub_type_id) pair.
 */

export interface VarianceTabDef {
	id: string;
	label: string;
	billingTypeId: number;
	billingSubTypeId: number | null;
	tooltip: string;
}

export const VARIANCE_TABS: ReadonlyArray<VarianceTabDef> = [
	{
		id: 'mode-1',
		label: 'On Return',
		billingTypeId: 1,
		billingSubTypeId: null,
		tooltip: 'Revenue = returned plates × rate card price (per SKU)',
	},
	{
		id: 'mode-2',
		label: 'On Dispatch',
		billingTypeId: 2,
		billingSubTypeId: null,
		tooltip: 'Revenue = dispatched plates × rate card price (per SKU)',
	},
	{
		id: 'mode-3',
		label: 'Fixed',
		billingTypeId: 3,
		billingSubTypeId: null,
		tooltip: 'Flat monthly fee. Variance comes from extras billed in Zoho.',
	},
	{
		id: 'mode-4-sub1',
		label: 'Max of Received',
		billingTypeId: 4,
		billingSubTypeId: 1,
		tooltip: 'Per day, the highest-returned SKU wins the full revenue.',
	},
	{
		id: 'mode-4-sub2',
		label: 'Selected SKU',
		billingTypeId: 4,
		billingSubTypeId: 2,
		tooltip: 'Per day, the highest-returned SKU in the combine group is billed; others = ₹0.',
	},
];

export const tabById = (id: string): VarianceTabDef | undefined =>
	VARIANCE_TABS.find((t) => t.id === id);
