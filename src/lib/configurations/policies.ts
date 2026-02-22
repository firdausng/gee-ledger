export type Permission =
	| 'transaction:create'
	| 'transaction:edit'
	| 'transaction:delete'
	| 'transaction:view'
	| 'attachment:upload'
	| 'attachment:view'
	| 'attachment:delete'
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
		'attachment:upload',
		'attachment:view',
		'attachment:delete',
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
		'attachment:upload',
		'attachment:view',
		'attachment:delete',
		'account:manage',
		'category:manage',
		'user:invite'
	],
	cashier: ['transaction:create', 'transaction:view', 'attachment:upload', 'attachment:view'],
	viewer: ['transaction:view', 'attachment:view']
};
