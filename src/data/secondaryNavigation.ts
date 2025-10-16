export interface SecondaryMenuItem {
	name: string;
	href: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export const secondaryNavigation: SecondaryMenuItem[] = [];
