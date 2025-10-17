import React from 'react';
import { Menu, Search, Bell, User, LogOut } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import TokenManager from '../utils/tokenManager';

interface HeaderProps {
	onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
	const handleLogout = async () => {
		await TokenManager.logout();
	};

	return (
		<header className='bg-background border-b border-border px-4 sm:px-6 py-4'>
			<div className='flex items-center justify-between'>
				{/* Left side */}
				<div className='flex items-center space-x-2 sm:space-x-4'>
					<Button variant='ghost' size='sm' onClick={onMenuClick} className='lg:hidden'>
						<Menu className='w-5 h-5' />
					</Button>

					<div className='hidden md:block'>
						<div className='relative'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted' />
							<Input placeholder='Search...' className='pl-10 w-48 sm:w-64' />
						</div>
					</div>
				</div>

				{/* Right side */}
				<div className='flex items-center space-x-2 sm:space-x-4'>
					<Button variant='ghost' size='sm'>
						<Bell className='w-5 h-5' />
					</Button>

					<div className='flex items-center space-x-2 sm:space-x-3'>
						<div className='text-right hidden sm:block'>
							<p className='text-sm font-medium text-foreground'>John Doe</p>
							<p className='text-xs text-foreground-muted'>Administrator</p>
						</div>
						<Button variant='ghost' size='sm'>
							<User className='w-5 h-5' />
						</Button>
						<Button variant='ghost' size='sm' onClick={handleLogout} title='Logout'>
							<LogOut className='w-5 h-5' />
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
};
