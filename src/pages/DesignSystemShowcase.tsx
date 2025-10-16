/**
 * Design System Showcase
 * Comprehensive example page showcasing all design system components
 */

import React, { useState } from 'react';
import {
	Alert,
	Button,
	ButtonGroup,
	IconButton,
	FAB,
	Input,
	SearchInput,
	Textarea,
	Card,
	CardHeader,
	CardContent,
	CardFooter,
	CardTitle,
	CardDescription,
	StatsCard,
	Checkbox,
	Radio,
	Switch,
	Dropdown,
	Breadcrumb,
	Tabs,
	Pagination,
	Table,
	List,
	Accordion,
	Badge,
	Tooltip,
	SnackbarProvider,
	useSnackbar,
	Container,
	Grid,
	Flex,
	Stack,
	ResponsiveVisibility,
} from '../components/ui';
import {
	Home,
	User,
	Settings,
	Bell,
	Plus,
	Edit,
	Trash2,
	Download,
	Star,
	MoreHorizontal,
} from 'lucide-react';

// Sample data for components
const sampleTableData = [
	{
		id: 1,
		name: 'John Doe',
		email: 'john@example.com',
		role: 'Admin',
		status: 'Active',
	},
	{
		id: 2,
		name: 'Jane Smith',
		email: 'jane@example.com',
		role: 'User',
		status: 'Active',
	},
	{
		id: 3,
		name: 'Bob Johnson',
		email: 'bob@example.com',
		role: 'User',
		status: 'Inactive',
	},
];

const sampleListData = [
	{
		id: '1',
		title: 'Dashboard Overview',
		description: 'View your key metrics and analytics',
		icon: <Home className='h-5 w-5' />,
		badge: 'New',
	},
	{
		id: '2',
		title: 'User Management',
		description: 'Manage users and permissions',
		icon: <User className='h-5 w-5' />,
		badge: '3',
	},
	{
		id: '3',
		title: 'Settings',
		description: 'Configure your application settings',
		icon: <Settings className='h-5 w-5' />,
	},
];

const sampleAccordionData = [
	{
		id: '1',
		title: 'Getting Started',
		content: 'Learn the basics of using our platform with this comprehensive guide.',
		icon: <Home className='h-5 w-5' />,
	},
	{
		id: '2',
		title: 'Advanced Features',
		content: 'Explore advanced features and customization options.',
		icon: <Settings className='h-5 w-5' />,
	},
	{
		id: '3',
		title: 'API Documentation',
		content: 'Complete API reference and integration examples.',
		icon: <Download className='h-5 w-5' />,
	},
];

const sampleDropdownOptions = [
	{ value: 'option1', label: 'Option 1', icon: <Home className='h-4 w-4' /> },
	{ value: 'option2', label: 'Option 2', icon: <User className='h-4 w-4' /> },
	{
		value: 'option3',
		label: 'Option 3',
		icon: <Settings className='h-4 w-4' />,
	},
];

const sampleBreadcrumbItems = [
	{ label: 'Dashboard', href: '/dashboard' },
	{ label: 'Users', href: '/users' },
	{ label: 'Profile' },
];

const sampleTabItems = [
	{
		id: 'overview',
		label: 'Overview',
		content: <div className='p-4'>Overview content goes here</div>,
		icon: <Home className='h-4 w-4' />,
	},
	{
		id: 'settings',
		label: 'Settings',
		content: <div className='p-4'>Settings content goes here</div>,
		icon: <Settings className='h-4 w-4' />,
	},
	{
		id: 'analytics',
		label: 'Analytics',
		content: <div className='p-4'>Analytics content goes here</div>,
		icon: <Download className='h-4 w-4' />,
		badge: '5',
	},
];

const DesignSystemShowcase: React.FC = () => {
	const [checkboxChecked, setCheckboxChecked] = useState(false);
	const [radioValue, setRadioValue] = useState('option1');
	const [switchChecked, setSwitchChecked] = useState(false);
	const [dropdownValue, setDropdownValue] = useState('');
	const [activeTab, setActiveTab] = useState('overview');
	const [currentPage, setCurrentPage] = useState(1);
	const [sortBy, setSortBy] = useState('');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
	const { addSnackbar } = useSnackbar();

	const tableColumns = [
		{ key: 'name', title: 'Name', sortable: true },
		{ key: 'email', title: 'Email', sortable: true },
		{ key: 'role', title: 'Role' },
		{ key: 'status', title: 'Status' },
	];

	const handleSort = (key: string, order: 'asc' | 'desc') => {
		setSortBy(key);
		setSortOrder(order);
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const showSnackbar = () => {
		addSnackbar({
			message: 'This is a success message!',
			variant: 'success',
			duration: 3000,
		});
	};

	return (
		<SnackbarProvider>
			<div className='min-h-screen bg-background'>
				<Container className='py-8'>
					<div className='space-y-12'>
						{/* Header */}
						<div className='text-center'>
							<h1 className='text-h2 text-foreground mb-4'>Design System Showcase</h1>
							<p className='text-body1 text-foreground-secondary max-w-2xl mx-auto'>
								A comprehensive collection of reusable UI components built with React, TypeScript,
								and TailwindCSS. All components are fully customizable and follow industry
								standards.
							</p>
						</div>

						{/* Breadcrumb */}
						<div>
							<h2 className='text-h4 text-foreground mb-4'>Navigation</h2>
							<Card>
								<CardContent className='p-6'>
									<Breadcrumb items={sampleBreadcrumbItems} />
								</CardContent>
							</Card>
						</div>

						{/* Alerts */}
						<div>
							<h2 className='text-h4 text-foreground mb-4'>Alerts</h2>
							<Grid cols={2} gap='md'>
								<Alert
									variant='success'
									title='Success!'
									description='Your changes have been saved successfully.'
								/>
								<Alert
									variant='warning'
									title='Warning'
									description='Please review your input before proceeding.'
								/>
								<Alert
									variant='error'
									title='Error'
									description='Something went wrong. Please try again.'
								/>
								<Alert
									variant='info'
									title='Information'
									description="Here's some helpful information for you."
								/>
							</Grid>
						</div>

						{/* Buttons */}
						<div>
							<h2 className='text-h4 text-foreground mb-4'>Buttons</h2>
							<Card>
								<CardContent className='p-6'>
									<Stack spacing='lg'>
										<div>
											<h3 className='text-h6 text-foreground mb-3'>Variants</h3>
											<Flex gap='md' wrap='wrap'>
												<Button variant='primary'>Primary</Button>
												<Button variant='secondary'>Secondary</Button>
												<Button variant='outline'>Outline</Button>
												<Button variant='ghost'>Ghost</Button>
												<Button variant='link'>Link</Button>
												<Button variant='destructive'>Destructive</Button>
											</Flex>
										</div>

										<div>
											<h3 className='text-h6 text-foreground mb-3'>Sizes</h3>
											<Flex gap='md' align='center'>
												<Button size='sm'>Small</Button>
												<Button size='md'>Medium</Button>
												<Button size='lg'>Large</Button>
												<Button size='xl'>Extra Large</Button>
											</Flex>
										</div>

										<div>
											<h3 className='text-h6 text-foreground mb-3'>With Icons</h3>
											<Flex gap='md'>
												<Button leftIcon={<Plus className='h-4 w-4' />}>Add Item</Button>
												<Button rightIcon={<Download className='h-4 w-4' />}>Download</Button>
												<Button loading>Loading...</Button>
											</Flex>
										</div>

										<div>
											<h3 className='text-h6 text-foreground mb-3'>Button Group</h3>
											<ButtonGroup>
												<Button variant='outline'>Previous</Button>
												<Button variant='outline'>Next</Button>
											</ButtonGroup>
										</div>

										<div>
											<h3 className='text-h6 text-foreground mb-3'>Icon Buttons</h3>
											<Flex gap='md'>
												<IconButton icon={<Edit className='h-4 w-4' />} aria-label='Edit' />
												<IconButton
													icon={<Trash2 className='h-4 w-4' />}
													variant='destructive'
													aria-label='Delete'
												/>
												<IconButton
													icon={<MoreHorizontal className='h-4 w-4' />}
													variant='ghost'
													aria-label='More'
												/>
											</Flex>
										</div>
									</Stack>
								</CardContent>
							</Card>
						</div>

						{/* Form Components */}
						<div>
							<h2 className='text-h4 text-foreground mb-4'>Form Components</h2>
							<Grid cols={2} gap='lg'>
								<Card>
									<CardHeader>
										<CardTitle>Input Fields</CardTitle>
										<CardDescription>Various input field configurations</CardDescription>
									</CardHeader>
									<CardContent>
										<Stack spacing='md'>
											<Input
												label='Email Address'
												placeholder='Enter your email'
												helperText="We'll never share your email"
											/>
											<SearchInput placeholder='Search...' />
											<Input label='Password' type='password' placeholder='Enter your password' />
											<Textarea label='Message' placeholder='Enter your message' rows={4} />
										</Stack>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Form Controls</CardTitle>
										<CardDescription>Checkboxes, radios, and switches</CardDescription>
									</CardHeader>
									<CardContent>
										<Stack spacing='md'>
											<Checkbox
												label='I agree to the terms and conditions'
												checked={checkboxChecked}
												onChange={e => setCheckboxChecked(e.target.checked)}
											/>
											<div>
												<p className='text-sm font-medium text-foreground mb-2'>
													Choose an option:
												</p>
												<Stack spacing='sm'>
													<Radio
														label='Option 1'
														name='radio-group'
														value='option1'
														checked={radioValue === 'option1'}
														onChange={e => setRadioValue(e.target.value)}
													/>
													<Radio
														label='Option 2'
														name='radio-group'
														value='option2'
														checked={radioValue === 'option2'}
														onChange={e => setRadioValue(e.target.value)}
													/>
												</Stack>
											</div>
											<Switch
												label='Enable notifications'
												checked={switchChecked}
												onChange={e => setSwitchChecked(e.target.checked)}
											/>
											<Dropdown
												label='Select an option'
												options={sampleDropdownOptions}
												value={dropdownValue}
												onChange={setDropdownValue}
												placeholder='Choose...'
											/>
										</Stack>
									</CardContent>
								</Card>
							</Grid>
						</div>

						{/* Cards */}
						<div>
							<h2 className='text-h4 text-foreground mb-4'>Cards</h2>
							<Grid cols={3} gap='md'>
								<Card>
									<CardHeader>
										<CardTitle>Simple Card</CardTitle>
										<CardDescription>This is a simple card with basic content</CardDescription>
									</CardHeader>
									<CardContent>
										<p className='text-body2 text-foreground-secondary'>
											Card content goes here. You can add any content you want.
										</p>
									</CardContent>
									<CardFooter>
										<Button size='sm'>Action</Button>
									</CardFooter>
								</Card>

								<StatsCard
									title='Total Users'
									value='1,234'
									change={{ value: '+12%', type: 'positive' }}
									icon={<User className='h-6 w-6' />}
									trend='up'
								/>

								<Card variant='elevated'>
									<CardContent className='p-6'>
										<div className='text-center'>
											<div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
												<Star className='h-6 w-6 text-primary' />
											</div>
											<h3 className='text-h6 text-foreground mb-2'>Premium Feature</h3>
											<p className='text-body2 text-foreground-secondary mb-4'>
												Unlock advanced features with our premium plan
											</p>
											<Button variant='primary' size='sm'>
												Upgrade
											</Button>
										</div>
									</CardContent>
								</Card>
							</Grid>
						</div>

						{/* Navigation */}
						<div>
							<h2 className='text-h4 text-foreground mb-4'>Navigation</h2>
							<Card>
								<CardContent className='p-6'>
									<Tabs
										items={sampleTabItems}
										activeTab={activeTab}
										onTabChange={setActiveTab}
										variant='pills'
									/>
								</CardContent>
							</Card>
						</div>

						{/* Data Display */}
						<div>
							<h2 className='text-h4 text-foreground mb-4'>Data Display</h2>
							<Grid cols={2} gap='lg'>
								<Card>
									<CardHeader>
										<CardTitle>Data Table</CardTitle>
										<CardDescription>Sortable table with sample data</CardDescription>
									</CardHeader>
									<CardContent>
										<Table
											columns={tableColumns}
											data={sampleTableData}
											sortBy={sortBy}
											sortOrder={sortOrder}
											onSort={handleSort}
											hoverable
											striped
										/>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>List</CardTitle>
										<CardDescription>Interactive list with icons and badges</CardDescription>
									</CardHeader>
									<CardContent>
										<List items={sampleListData} hoverable />
									</CardContent>
								</Card>
							</Grid>
						</div>

						{/* Accordion */}
						<div>
							<h2 className='text-h4 text-foreground mb-4'>Accordion</h2>
							<Card>
								<CardContent className='p-6'>
									<Accordion items={sampleAccordionData} allowMultiple />
								</CardContent>
							</Card>
						</div>

						{/* Feedback Components */}
						<div>
							<h2 className='text-h4 text-foreground mb-4'>Feedback Components</h2>
							<Grid cols={2} gap='lg'>
								<Card>
									<CardHeader>
										<CardTitle>Badges</CardTitle>
										<CardDescription>Status indicators and labels</CardDescription>
									</CardHeader>
									<CardContent>
										<Flex gap='md' wrap='wrap'>
											<Badge variant='default'>Default</Badge>
											<Badge variant='primary'>Primary</Badge>
											<Badge variant='success'>Success</Badge>
											<Badge variant='warning'>Warning</Badge>
											<Badge variant='error'>Error</Badge>
											<Badge variant='info'>Info</Badge>
										</Flex>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Tooltips</CardTitle>
										<CardDescription>Hover for more information</CardDescription>
									</CardHeader>
									<CardContent>
										<Flex gap='md'>
											<Tooltip content='This is a helpful tooltip'>
												<Button variant='outline'>Hover me</Button>
											</Tooltip>
											<Tooltip content='Click to show tooltip' trigger='click'>
												<Button variant='outline'>Click me</Button>
											</Tooltip>
										</Flex>
									</CardContent>
								</Card>
							</Grid>
						</div>

						{/* Layout Components */}
						<div>
							<h2 className='text-h4 text-foreground mb-4'>Layout Components</h2>
							<Card>
								<CardContent className='p-6'>
									<Stack spacing='lg'>
										<div>
											<h3 className='text-h6 text-foreground mb-3'>Grid System</h3>
											<Grid cols={4} gap='md'>
												{[1, 2, 3, 4].map(i => (
													<div
														key={i}
														className='p-4 bg-background-secondary rounded-lg text-center'
													>
														Column {i}
													</div>
												))}
											</Grid>
										</div>

										<div>
											<h3 className='text-h6 text-foreground mb-3'>Flex Layout</h3>
											<Flex
												justify='between'
												align='center'
												className='p-4 bg-background-secondary rounded-lg'
											>
												<span>Left content</span>
												<span>Center content</span>
												<span>Right content</span>
											</Flex>
										</div>

										<div>
											<h3 className='text-h6 text-foreground mb-3'>Responsive Visibility</h3>
											<Flex gap='md'>
												<ResponsiveVisibility show={{ sm: true, md: false }}>
													<Badge variant='primary'>Mobile Only</Badge>
												</ResponsiveVisibility>
												<ResponsiveVisibility show={{ sm: false, md: true }}>
													<Badge variant='secondary'>Desktop Only</Badge>
												</ResponsiveVisibility>
											</Flex>
										</div>
									</Stack>
								</CardContent>
							</Card>
						</div>

						{/* Pagination */}
						<div>
							<h2 className='text-h4 text-foreground mb-4'>Pagination</h2>
							<Card>
								<CardContent className='p-6'>
									<div className='flex justify-center'>
										<Pagination
											currentPage={currentPage}
											totalPages={10}
											onPageChange={handlePageChange}
											showFirstLast
											showPrevNext
										/>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Interactive Demo */}
						<div>
							<h2 className='text-h4 text-foreground mb-4'>Interactive Demo</h2>
							<Card>
								<CardContent className='p-6'>
									<Stack spacing='md'>
										<p className='text-body1 text-foreground-secondary'>
											Try these interactive components:
										</p>
										<Flex gap='md' wrap='wrap'>
											<Button onClick={showSnackbar} leftIcon={<Bell className='h-4 w-4' />}>
												Show Snackbar
											</Button>
											<Button
												variant='outline'
												onClick={() => setCheckboxChecked(!checkboxChecked)}
											>
												Toggle Checkbox
											</Button>
											<Button variant='outline' onClick={() => setSwitchChecked(!switchChecked)}>
												Toggle Switch
											</Button>
										</Flex>
									</Stack>
								</CardContent>
							</Card>
						</div>

						{/* Floating Action Button */}
						<FAB
							onClick={() => addSnackbar({ message: 'FAB clicked!', variant: 'info' })}
							aria-label='Add new item'
						>
							<Plus className='h-6 w-6' />
						</FAB>
					</div>
				</Container>
			</div>
		</SnackbarProvider>
	);
};

export default DesignSystemShowcase;
