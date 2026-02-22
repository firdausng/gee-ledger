import * as v from 'valibot';

const ChannelTypeSchema = v.picklist([
	'walk_in',
	'shopee',
	'lazada',
	'tokopedia',
	'tiktok',
	'facebook',
	'instagram',
	'whatsapp',
	'youtube',
	'custom'
]);

export const CreateChannelSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
	type: ChannelTypeSchema
});

export const UpdateChannelSchema = v.object({
	name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
	type: v.optional(ChannelTypeSchema),
	isActive: v.optional(v.boolean())
});

export type CreateChannelInput = v.InferOutput<typeof CreateChannelSchema>;
export type UpdateChannelInput = v.InferOutput<typeof UpdateChannelSchema>;
