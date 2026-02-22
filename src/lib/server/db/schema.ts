import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	// Primary key - Firebase UID
	id: text('id').primaryKey(),

	// Firebase user data
	email: text('email').unique(),
	displayName: text('display_name'),
	photoURL: text('photo_url'),

	// Auth metadata
	provider: text('provider').notNull(), // 'google' | 'anonymous'
	isAnonymous: integer('is_anonymous', { mode: 'boolean' }).notNull().default(false),

	// Timestamps
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	lastLoginAt: integer('last_login_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),

	// Legacy field (can be removed or kept for app logic)
	age: integer('age')
});

// Session table for server-side session management
export const session = sqliteTable('session', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});
