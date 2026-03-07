export type Permission =
	| 'transaction:create'
	| 'transaction:edit'
	| 'transaction:delete'
	| 'transaction:view'
	| 'transaction:email'
	| 'transaction:export'
	| 'quote:create'
	| 'quote:edit'
	| 'quote:delete'
	| 'quote:view'
	| 'quote:email'
	| 'project:create'
	| 'project:edit'
	| 'project:delete'
	| 'project:view'
	| 'attachment:upload'
	| 'attachment:view'
	| 'attachment:delete'
	| 'account:manage'
	| 'category:manage'
	| 'product:manage'
	| 'contact:manage'
	| 'business:manage'
	| 'user:invite';

export type PolicyKey = 'owner' | 'manager' | 'cashier' | 'viewer';

export const POLICIES: Record<PolicyKey, Permission[]> = {
	owner: [
		'transaction:create',
		'transaction:edit',
		'transaction:delete',
		'transaction:view',
		'transaction:email',
		'transaction:export',
		'quote:create',
		'quote:edit',
		'quote:delete',
		'quote:view',
		'quote:email',
		'project:create',
		'project:edit',
		'project:delete',
		'project:view',
		'attachment:upload',
		'attachment:view',
		'attachment:delete',
		'account:manage',
		'category:manage',
		'product:manage',
		'contact:manage',
		'business:manage',
		'user:invite',
	],
	manager: [
		'transaction:create',
		'transaction:edit',
		'transaction:delete',
		'transaction:view',
		'transaction:email',
		'transaction:export',
		'quote:create',
		'quote:edit',
		'quote:delete',
		'quote:view',
		'quote:email',
		'project:create',
		'project:edit',
		'project:delete',
		'project:view',
		'attachment:upload',
		'attachment:view',
		'attachment:delete',
		'account:manage',
		'category:manage',
		'product:manage',
		'contact:manage',
		'user:invite'
	],
	cashier: ['transaction:create', 'transaction:view', 'quote:create', 'quote:view', 'project:view', 'attachment:upload', 'attachment:view'],
	viewer: ['transaction:view', 'quote:view', 'project:view', 'attachment:view']
};
