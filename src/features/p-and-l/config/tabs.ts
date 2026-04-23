/**
 * P&L Tab Configuration
 * Centralized tab structure definition
 */

import React from 'react';
import { TabItem } from '../../../components/ui';
import {
	ExpenditureTab,
	UnitEconomicsTab,
	EBITDATab,
	ClientWisePLTab,
	EscalationsTab,
} from '../components/PLTabContents';

interface PLTabContentProps {
	cityId?: number;
	facilityId: string;
	month: string;
	year: string;
	enabled?: boolean;
	onError?: (message: string) => void;
}

/**
 * Get P&L tab items with content components
 */
export const getPLTabItems = (props: PLTabContentProps): TabItem[] => [
	{
		id: 'expenditure',
		label: 'Expenditure',
		content: React.createElement(ExpenditureTab, {
			facilityId: props.facilityId,
			month: props.month,
			year: props.year,
			enabled: props.enabled,
			onError: props.onError,
		}),
	},
	{
		id: 'unit-economics',
		label: 'Unit Economics',
		content: React.createElement(UnitEconomicsTab, {
			cityId: props.cityId,
			facilityId: props.facilityId,
			month: props.month,
			year: props.year,
			enabled: props.enabled,
			onError: props.onError,
		}),
	},
	{
		id: 'ebitda',
		label: 'EBITDA',
		content: React.createElement(EBITDATab, {
			cityId: props.cityId,
			facilityId: props.facilityId,
			month: props.month,
			year: props.year,
			enabled: props.enabled,
			onError: props.onError,
		}),
	},
	{
		id: 'client-wise-pl',
		label: 'Client Wise P&L',
		content: React.createElement(ClientWisePLTab, {
			cityId: props.cityId,
			facilityId: props.facilityId,
			month: props.month,
			year: props.year,
			enabled: props.enabled,
			onError: props.onError,
		}),
	},
	{
		id: 'escalations',
		label: 'Escalations',
		content: React.createElement(EscalationsTab, {
			cityId: props.cityId,
			facilityId: props.facilityId,
			month: props.month,
			year: props.year,
			enabled: props.enabled,
			onError: props.onError,
		}),
	},
];
