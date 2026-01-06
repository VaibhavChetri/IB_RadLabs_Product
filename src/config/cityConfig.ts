// City Addresses and IDs Configuration
export const CITY_CONFIG = {
	addresses: {
		bangalore: '962/N, AECS Layout, 60 feet road Behind Nandhini Hotel, Bangalore Karnataka 560068',
		mumbai: 'Gala No 2 AK Containe, Patkar Compound, Tulshet Pada, Bhandup (West), Mumbai - 400078',
		gurgaon:
			'Sihi Sikanderpur Road, Opposite Cafe Gathering, Kherki Daula, Sector 84, Gurgaon, 122004',
		hyderabad:
			'Survey no 17/AA Vattinagulapally village Gandipet Mandal Ranga Reddy 500075',
	},
	cityIds: {
		mumbai: 3,
		bangalore: 2,
		gurgaon: 4,
		hyderabad: 5,
	},
} as const;

// Helper functions to get address and city ID
export const getCityAddress = (cityId: number): string => {
	switch (cityId) {
		case 2:
			return CITY_CONFIG.addresses.bangalore;
		case 3:
			return CITY_CONFIG.addresses.mumbai;
		case 4:
			return CITY_CONFIG.addresses.gurgaon;
		case 5:
			return CITY_CONFIG.addresses.hyderabad;
		default:
			return 'Address not available';
	}
};

export const getCityName = (cityId: number): string => {
	switch (cityId) {
		case 2:
			return 'Bangalore';
		case 3:
			return 'Mumbai';
		case 4:
			return 'Gurgaon';
		case 5:
			return 'Hyderabad';
		default:
			return 'Unknown City';
	}
};

export default CITY_CONFIG;
