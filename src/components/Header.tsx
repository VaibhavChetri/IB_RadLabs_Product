import React from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { Button } from './ui/Button';
import TokenManager from '../utils/tokenManager';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface HeaderProps {
	onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
	const { user } = useSelector((state: RootState) => state.auth);
	
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
				</div>

				{/* Right side */}
				<div className='flex items-center space-x-2 sm:space-x-4'>
					<Button variant='ghost' size='sm'>
						<Bell className='w-5 h-5' />
					</Button>

					<div className='flex items-center space-x-2 sm:space-x-3'>
						<div className='text-right hidden sm:block'>
							<p className='text-sm font-medium text-foreground'>
								{user?.name || 'User'}
							</p>
							<p className='text-xs text-foreground-muted'>
								{user?.userTypeName || user?.role || 'User'}
							</p>
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
