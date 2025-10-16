import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
	children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className='flex h-screen bg-background'>
			{/* Sidebar */}
			<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

			{/* Main Content */}
			<div className='flex-1 flex flex-col overflow-hidden'>
				{/* Header */}
				<Header onMenuClick={() => setSidebarOpen(true)} />

				{/* Page Content */}
				<main className='flex-1 overflow-x-hidden overflow-y-auto bg-background'>
					<div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8'>
						{children}
					</div>
				</main>
			</div>
		</div>
	);
};
