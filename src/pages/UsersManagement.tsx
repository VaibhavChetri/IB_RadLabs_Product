import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
	Search,
	Filter,
	Plus,
	MoreHorizontal,
	Edit,
	Mail,
	UserCheck,
	UserX,
	Crown,
	Shield,
} from 'lucide-react';

export const UsersManagement: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedRole, setSelectedRole] = useState('all');
	const [selectedStatus, setSelectedStatus] = useState('all');

	const users = [
		{
			id: 1,
			name: 'John Doe',
			email: 'john@example.com',
			role: 'Administrator',
			status: 'active',
			lastLogin: '2 hours ago',
			joinDate: 'Jan 15, 2024',
			avatar: 'JD',
			phone: '+1 (555) 123-4567',
			location: 'New York, NY',
			permissions: ['read', 'write', 'admin'],
		},
		{
			id: 2,
			name: 'Jane Smith',
			email: 'jane@example.com',
			role: 'Manager',
			status: 'active',
			lastLogin: '1 day ago',
			joinDate: 'Feb 3, 2024',
			avatar: 'JS',
			phone: '+1 (555) 234-5678',
			location: 'Los Angeles, CA',
			permissions: ['read', 'write'],
		},
		{
			id: 3,
			name: 'Mike Johnson',
			email: 'mike@example.com',
			role: 'Editor',
			status: 'inactive',
			lastLogin: '1 week ago',
			joinDate: 'Mar 10, 2024',
			avatar: 'MJ',
			phone: '+1 (555) 345-6789',
			location: 'Chicago, IL',
			permissions: ['read', 'write'],
		},
		{
			id: 4,
			name: 'Sarah Wilson',
			email: 'sarah@example.com',
			role: 'Viewer',
			status: 'active',
			lastLogin: '3 hours ago',
			joinDate: 'Apr 5, 2024',
			avatar: 'SW',
			phone: '+1 (555) 456-7890',
			location: 'Miami, FL',
			permissions: ['read'],
		},
		{
			id: 5,
			name: 'David Brown',
			email: 'david@example.com',
			role: 'Manager',
			status: 'active',
			lastLogin: '30 minutes ago',
			joinDate: 'May 12, 2024',
			avatar: 'DB',
			phone: '+1 (555) 567-8901',
			location: 'Seattle, WA',
			permissions: ['read', 'write'],
		},
		{
			id: 6,
			name: 'Lisa Davis',
			email: 'lisa@example.com',
			role: 'Administrator',
			status: 'active',
			lastLogin: '1 hour ago',
			joinDate: 'Jun 8, 2024',
			avatar: 'LD',
			phone: '+1 (555) 678-9012',
			location: 'Boston, MA',
			permissions: ['read', 'write', 'admin'],
		},
	];

	const filteredUsers = users.filter(user => {
		const matchesSearch =
			user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesRole = selectedRole === 'all' || user.role === selectedRole;
		const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;

		return matchesSearch && matchesRole && matchesStatus;
	});

	const getRoleIcon = (role: string) => {
		switch (role) {
			case 'Administrator':
				return <Crown className='w-4 h-4 text-error' />;
			case 'Manager':
				return <Shield className='w-4 h-4 text-warning' />;
			case 'Editor':
				return <Edit className='w-4 h-4 text-info' />;
			case 'Viewer':
				return <UserCheck className='w-4 h-4 text-success' />;
			default:
				return <UserCheck className='w-4 h-4 text-foreground-muted' />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'active':
				return 'text-success bg-success/10';
			case 'inactive':
				return 'text-error bg-error/10';
			case 'pending':
				return 'text-warning bg-warning/10';
			default:
				return 'text-foreground-muted bg-background-secondary';
		}
	};

	const stats = [
		{ label: 'Total Users', value: '2,847', change: '+12%', trend: 'up' },
		{ label: 'Active Users', value: '2,234', change: '+8%', trend: 'up' },
		{ label: 'New This Month', value: '156', change: '+23%', trend: 'up' },
		{ label: 'Administrators', value: '12', change: '0%', trend: 'stable' },
	];

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h1 className='text-h3 text-foreground'>User Management</h1>
					<p className='mt-2 text-body2 text-foreground-secondary'>
						Manage user accounts, roles, and permissions
					</p>
				</div>
				<div className='mt-4 sm:mt-0 flex space-x-3'>
					<Button variant='outline' className='flex items-center'>
						<Filter className='w-4 h-4 mr-2' />
						Bulk Actions
					</Button>
					<Button className='flex items-center'>
						<Plus className='w-4 h-4 mr-2' />
						Add User
					</Button>
				</div>
			</div>

			{/* Stats */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
				{stats.map((stat, index) => (
					<Card key={index} className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-foreground-secondary'>{stat.label}</p>
								<p className='text-2xl font-bold text-foreground mt-1'>{stat.value}</p>
								<p className='text-sm text-success mt-1'>{stat.change}</p>
							</div>
							<div className='p-3 bg-primary/10 rounded-lg'>
								<UserCheck className='w-6 h-6 text-primary' />
							</div>
						</div>
					</Card>
				))}
			</div>

			{/* Filters */}
			<Card className='p-6'>
				<div className='flex flex-col sm:flex-row gap-4'>
					<div className='flex-1'>
						<Input
							placeholder='Search users...'
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
							className='pl-10'
						/>
						<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted' />
					</div>
					<div className='flex space-x-3'>
						<select
							value={selectedRole}
							onChange={e => setSelectedRole(e.target.value)}
							className='px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent'
						>
							<option value='all'>All Roles</option>
							<option value='Administrator'>Administrator</option>
							<option value='Manager'>Manager</option>
							<option value='Editor'>Editor</option>
							<option value='Viewer'>Viewer</option>
						</select>
						<select
							value={selectedStatus}
							onChange={e => setSelectedStatus(e.target.value)}
							className='px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent'
						>
							<option value='all'>All Status</option>
							<option value='active'>Active</option>
							<option value='inactive'>Inactive</option>
							<option value='pending'>Pending</option>
						</select>
					</div>
				</div>
			</Card>

			{/* Users Table */}
			<Card className='p-6'>
				<div className='overflow-x-auto'>
					<table className='w-full'>
						<thead>
							<tr className='border-b border-border'>
								<th className='text-left py-3 px-4 text-sm font-medium text-foreground-secondary'>
									User
								</th>
								<th className='text-left py-3 px-4 text-sm font-medium text-foreground-secondary'>
									Role
								</th>
								<th className='text-left py-3 px-4 text-sm font-medium text-foreground-secondary'>
									Status
								</th>
								<th className='text-left py-3 px-4 text-sm font-medium text-foreground-secondary'>
									Last Login
								</th>
								<th className='text-left py-3 px-4 text-sm font-medium text-foreground-secondary'>
									Join Date
								</th>
								<th className='text-right py-3 px-4 text-sm font-medium text-foreground-secondary'>
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{filteredUsers.map(user => (
								<tr key={user.id} className='border-b border-border hover:bg-background-secondary'>
									<td className='py-4 px-4'>
										<div className='flex items-center space-x-3'>
											<div className='w-10 h-10 bg-primary rounded-full flex items-center justify-center'>
												<span className='text-primary-foreground text-sm font-medium'>
													{user.avatar}
												</span>
											</div>
											<div>
												<p className='text-sm font-medium text-foreground'>{user.name}</p>
												<p className='text-sm text-foreground-secondary'>{user.email}</p>
											</div>
										</div>
									</td>
									<td className='py-4 px-4'>
										<div className='flex items-center space-x-2'>
											{getRoleIcon(user.role)}
											<span className='text-sm text-foreground'>{user.role}</span>
										</div>
									</td>
									<td className='py-4 px-4'>
										<span
											className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(
												user.status
											)}`}
										>
											{user.status}
										</span>
									</td>
									<td className='py-4 px-4'>
										<span className='text-sm text-foreground-secondary'>{user.lastLogin}</span>
									</td>
									<td className='py-4 px-4'>
										<span className='text-sm text-foreground-secondary'>{user.joinDate}</span>
									</td>
									<td className='py-4 px-4'>
										<div className='flex items-center justify-end space-x-2'>
											<Button variant='outline' size='sm'>
												<Edit className='w-3 h-3' />
											</Button>
											<Button variant='outline' size='sm'>
												<Mail className='w-3 h-3' />
											</Button>
											<Button variant='outline' size='sm'>
												<MoreHorizontal className='w-3 h-3' />
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Card>

			{/* User Details Modal Placeholder */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<Card className='p-6'>
					<h3 className='text-h5 text-foreground mb-4'>Recent Activity</h3>
					<div className='space-y-3'>
						{[
							{ action: 'User logged in', user: 'John Doe', time: '2 min ago' },
							{
								action: 'Profile updated',
								user: 'Jane Smith',
								time: '15 min ago',
							},
							{
								action: 'Password changed',
								user: 'Mike Johnson',
								time: '1 hour ago',
							},
							{
								action: 'Role updated',
								user: 'Sarah Wilson',
								time: '2 hours ago',
							},
						].map((activity, index) => (
							<div
								key={index}
								className='flex items-center space-x-3 p-2 rounded-lg hover:bg-background-secondary'
							>
								<div className='w-2 h-2 bg-primary rounded-full' />
								<div className='flex-1'>
									<p className='text-sm text-foreground'>{activity.action}</p>
									<p className='text-xs text-foreground-muted'>{activity.user}</p>
								</div>
								<span className='text-xs text-foreground-muted'>{activity.time}</span>
							</div>
						))}
					</div>
				</Card>

				<Card className='p-6'>
					<h3 className='text-h5 text-foreground mb-4'>Quick Actions</h3>
					<div className='space-y-3'>
						<Button variant='outline' className='w-full justify-start'>
							<Plus className='w-4 h-4 mr-2' />
							Invite New User
						</Button>
						<Button variant='outline' className='w-full justify-start'>
							<Mail className='w-4 h-4 mr-2' />
							Send Bulk Email
						</Button>
						<Button variant='outline' className='w-full justify-start'>
							<UserCheck className='w-4 h-4 mr-2' />
							Bulk Activate
						</Button>
						<Button variant='outline' className='w-full justify-start'>
							<UserX className='w-4 h-4 mr-2' />
							Bulk Deactivate
						</Button>
					</div>
				</Card>
			</div>
		</div>
	);
};
