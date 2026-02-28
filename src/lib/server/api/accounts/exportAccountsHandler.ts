import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { accounts } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { buildCsv } from '$lib/server/utils/csv';

export async function exportAccountsHandler(
	user: App.User,
	businessId: string,
	env: Cloudflare.Env
): Promise<string> {
	await requireBusinessPermission(user, businessId, 'transaction:export', env);

	const db = drizzle(env.DB, { schema });

	const rows = await db
		.select()
		.from(accounts)
		.where(and(eq(accounts.businessId, businessId), isNull(accounts.deletedAt)));

	// Resolve parent names from same result set
	const nameMap = new Map<string, string>();
	for (const row of rows) nameMap.set(row.id, row.name);

	const headers = ['Name', 'Type', 'Code', 'Parent Account', 'Is System'];

	const csvRows = rows.map((a) => [
		a.name,
		a.type,
		a.code ?? '',
		a.parentId ? (nameMap.get(a.parentId) ?? '') : '',
		a.isSystem ? 'Yes' : 'No',
	]);

	return buildCsv(headers, csvRows);
}
