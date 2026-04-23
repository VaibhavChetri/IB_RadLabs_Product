/**
 * Fast hover labels for HR table action icons (replaces slow native `title` tooltips).
 */

import React from 'react';
import { Tooltip } from '../../../components/ui/Feedback';

interface HrIconTooltipProps {
	label: string;
	children: React.ReactNode;
}

export const HrIconTooltip: React.FC<HrIconTooltipProps> = ({ label, children }) => (
	<Tooltip content={label} delay={0} placement='top'>
		{children}
	</Tooltip>
);
