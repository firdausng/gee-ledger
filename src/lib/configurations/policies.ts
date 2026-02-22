export type Permission =
	| 'transaction:create'
	| 'transaction:edit'
	| 'transaction:delete'
	| 'transaction:view'
	| 'account:manage'
	| 'category:manage'
	| 'business:manage'
	| 'user:invite';

export type PolicyKey = 'owner' | 'manager' | 'cashier' | 'viewer';

export const POLICIES: Record<PolicyKey, Permission[]> = {
	owner: [
		'transaction:create',
		'transaction:edit',
		'transaction:delete',
		'transaction:view',
		'account:manage',
		'category:manage',
		'business:manage',
		'user:invite'
	],
	manager: [
		'transaction:create',
		'transaction:edit',
		'transaction:delete',
		'transaction:view',
		'account:manage',
		'category:manage',
		'user:invite'
	],
	cashier: ['transaction:create', 'transaction:view'],
	viewer: ['transaction:view']
};
