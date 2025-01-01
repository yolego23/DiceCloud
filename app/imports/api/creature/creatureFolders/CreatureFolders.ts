import { z } from 'zod';
import { zId } from '/imports/api/utility/zId'
import STORAGE_LIMITS from '../../../constants/STORAGE_LIMITS';

export const CreatureFolder = z.object({
  name: z.string().max(STORAGE_LIMITS.name).optional(),
  creatures: z.array(zId()).default([]),
  owner: zId(),
  archived: z.boolean().optional(),
  order: z.number().default(0),
});

export type CreatureFolder = z.infer<typeof CreatureFolder>

const CreatureFolders = new Mongo.Collection<CreatureFolder>('creatureFolders');

CreatureFolders.createIndex({ owner: 1 });

export default CreatureFolders;
