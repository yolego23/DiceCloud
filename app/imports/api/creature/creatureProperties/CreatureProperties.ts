import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import ColorSchema from '/imports/api/properties/subSchemas/ColorSchema';
import ChildSchema, { TreeDoc } from '/imports/api/parenting/ChildSchema';
import SoftRemovableSchema from '/imports/api/parenting/SoftRemovableSchema';
import propertySchemasIndex from '/imports/api/properties/computedPropertySchemasIndex';
import { storedIconsSchema } from '/imports/api/icons/Icons';
import STORAGE_LIMITS from '/imports/constants/STORAGE_LIMITS';
import { ComputedProperties } from '../../properties/Properties';
import { z } from 'zod';
import { zId } from '../../utility/zId';

const CreaturePropertyBeforeCompute = z.object({
  _id: zId(),
  _migrationError: z.string().optional(),
  tags: z.string().max(STORAGE_LIMITS.tagLength).array().max(STORAGE_LIMITS.tagCount),
  disabled: z.boolean().optional(),
  icon: z.object({
    name: z.string().max(STORAGE_LIMITS.name),
    shape: z.string().max(STORAGE_LIMITS.icon),
  }).optional(),
  libraryNodeId: zId().optional(),
  slotQuantityFilled: z.number().optional(), // undefined implies 1
});

const DenormalisedOnlyCreatureProperty = z.object({
  dirty: z.boolean().optional().default(true).describe('removeBeforeCompute'),
  // Denormalised flag if this property is inactive on the sheet for any reason
  // Including being disabled, or a descendant of a disabled property
  inactive: z.boolean().optional().describe('removeBeforeCompute'),
  // Denormalised flag if this property was made inactive by an inactive
  // ancestor. True if this property has an inactive ancestor even if this
  // property is itself inactive
  deactivatedByAncestor: z.boolean().optional().describe('removeBeforeCompute'),
  // Denormalised flag if this property was made inactive because of its own
  // state
  deactivatedBySelf: z.boolean().optional().describe('removeBeforeCompute'),
  // Denormalised flag if this property was made inactive because of a toggle
  // calculation. Either an ancestor toggle calculation or its own.
  deactivatedByToggle: z.boolean().optional().describe('removeBeforeCompute'),
  deactivatingToggleId: zId().optional().describe('removeBeforeCompute'),
  // Triggers
  triggerIds: z.object({
    before: zId().array().optional(),
    after: zId().array().optional(),
    afterChildren: zId().array().optional(),
  }).optional().describe('removeBeforeCompute'),
});

const UntypedCreatureProperty = CreaturePropertyBeforeCompute.merge(DenormalisedOnlyCreatureProperty);

const buildCreatureProperty = function <T extends z.ZodObject<any>>(schema: T) {
  return UntypedCreatureProperty
    // .merge(Color)
    // .merge(Child)
    // .merge(SoftRemovable)
    .merge(schema);
}

const CreatureProperty = z.discriminatedUnion('type', [
  buildCreatureProperty(ComputedProperties.action),
]);

export type CreatureProperty = z.infer<typeof CreatureProperty>;

const CreatureProperties: Mongo.Collection<CreatureProperty> = new Mongo.Collection('creatureProperties');

const CreaturePropertySchema = new SimpleSchema({
  _id: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
  },
  _migrationError: {
    type: String,
    optional: true,
  },
  type: {
    type: String,
    allowedValues: Object.keys(propertySchemasIndex),
  },
  tags: {
    type: Array,
    defaultValue: [],
    maxCount: STORAGE_LIMITS.tagCount,
  },
  'tags.$': {
    type: String,
    max: STORAGE_LIMITS.tagLength,
  },
  disabled: {
    type: Boolean,
    optional: true,
  },
  icon: {
    type: storedIconsSchema,
    optional: true,
    max: STORAGE_LIMITS.icon,
  },
  // Reference to the library node that this property was copied from
  libraryNodeId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    optional: true,
  },
  // Fill more than one quantity in a slot, like feats and ability score
  // improvements, filtered out of UI if there isn't space in quantityExpected
  slotQuantityFilled: {
    type: SimpleSchema.Integer,
    optional: true, // Undefined implies 1
  },
});

const DenormalisedOnlyCreaturePropertySchema = new SimpleSchema({
  // Denormalised flag if this property is inactive on the sheet for any reason
  // Including being disabled, or a descendant of a disabled property
  inactive: {
    type: Boolean,
    optional: true,
    // @ts-expect-error index not defined in simpl-schema
    index: 1,
    removeBeforeCompute: true,
  },
  // Denormalised flag if this property was made inactive by an inactive
  // ancestor. True if this property has an inactive ancestor even if this
  // property is itself inactive
  deactivatedByAncestor: {
    type: Boolean,
    optional: true,
    // @ts-expect-error index not defined in simpl-schema
    index: 1,
    removeBeforeCompute: true,
  },
  // Denormalised flag if this property was made inactive because of its own
  // state
  deactivatedBySelf: {
    type: Boolean,
    optional: true,
    // @ts-expect-error index not defined in simpl-schema
    index: 1,
    removeBeforeCompute: true,
  },
  // Denormalised flag if this property was made inactive because of a toggle
  // calculation. Either an ancestor toggle calculation or its own.
  deactivatedByToggle: {
    type: Boolean,
    optional: true,
    // @ts-expect-error index not defined in simpl-schema
    index: 1,
    removeBeforeCompute: true,
  },
  deactivatingToggleId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    optional: true,
    // @ts-expect-error simple schema extensions not defined
    removeBeforeCompute: true,
  },
  // Triggers that fire when this property is applied
  'triggerIds': {
    type: Object,
    optional: true,
    // @ts-expect-error simple schema extensions not defined
    removeBeforeCompute: true,
  },
  'triggerIds.before': {
    type: Array,
    optional: true,
  },
  'triggerIds.before.$': {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
  },
  'triggerIds.after': {
    type: Array,
    optional: true,
  },
  'triggerIds.after.$': {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
  },
  'triggerIds.afterChildren': {
    type: Array,
    optional: true,
  },
  'triggerIds.afterChildren.$': {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
  },
  // When this is true on any property, the creature needs to be recomputed
  dirty: {
    type: Boolean,
    // Default to true because new properties cause a recomputation
    defaultValue: true,
    optional: true,
  },
});

CreaturePropertySchema.extend(DenormalisedOnlyCreaturePropertySchema);

for (const key in propertySchemasIndex) {
  const schema = new SimpleSchema({});
  schema.extend(propertySchemasIndex[key]);
  schema.extend(CreaturePropertySchema);
  schema.extend(ColorSchema);
  schema.extend(ChildSchema);
  schema.extend(SoftRemovableSchema);
  // Use the any schema as a default schema for the collection
  if (key === 'any') {
    // @ts-expect-error don't have types for .attachSchema
    CreatureProperties.attachSchema(schema);
  }
  // TODO make this an else branch and remove all {selector: {type: any}} options
  // @ts-expect-error don't have types for .attachSchema
  CreatureProperties.attachSchema(schema, {
    selector: { type: key }
  });
}

export default CreatureProperties;
export {
  DenormalisedOnlyCreaturePropertySchema,
  CreaturePropertySchema,
};
