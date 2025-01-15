import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import ColorSchema from '/imports/api/properties/subSchemas/ColorSchema';
import ChildSchema from '/imports/api/parenting/ChildSchema';
import SoftRemovableSchema from '/imports/api/parenting/SoftRemovableSchema';
import propertySchemasIndex from '/imports/api/properties/computedPropertySchemasIndex';
import { storedIconsSchema } from '/imports/api/icons/Icons';
import STORAGE_LIMITS from '/imports/constants/STORAGE_LIMITS';
import { ConvertToUnion, InferType, TypedSimpleSchema } from '/imports/api/utility/TypedSimpleSchema';
import { Simplify } from 'type-fest';
import type { PropertyType } from '/imports/api/properties/PropertyType.type';

const PreComputeCreaturePropertySchema = TypedSimpleSchema.from({
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

const DenormalisedOnlyCreaturePropertySchema = TypedSimpleSchema.from({
  // Denormalised flag if this property is inactive on the sheet for any reason
  // Including being disabled, or a descendant of a disabled property
  inactive: {
    type: Boolean,
    optional: true,
    removeBeforeCompute: true,
  },
  // Denormalised flag if this property was made inactive by an inactive
  // ancestor. True if this property has an inactive ancestor even if this
  // property is itself inactive
  deactivatedByAncestor: {
    type: Boolean,
    optional: true,
    removeBeforeCompute: true,
  },
  // Denormalised flag if this property was made inactive because of its own
  // state
  deactivatedBySelf: {
    type: Boolean,
    optional: true,
    removeBeforeCompute: true,
  },
  // Denormalised flag if this property was made inactive because of a toggle
  // calculation. Either an ancestor toggle calculation or its own.
  deactivatedByToggle: {
    type: Boolean,
    optional: true,
    removeBeforeCompute: true,
  },
  deactivatingToggleId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    optional: true,
    removeBeforeCompute: true,
  },
  // Triggers that fire when this property is applied
  'triggerIds': {
    type: Object,
    optional: true,
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

const CreaturePropertySchema = PreComputeCreaturePropertySchema.extend(DenormalisedOnlyCreaturePropertySchema);

export type CreaturePropertyTypes = {
  [T in PropertyType]: Simplify<
    { type: T }
    & InferType<typeof propertySchemasIndex[T]>
  > & Simplify<
    Exclude<InferType<typeof CreaturePropertySchema>, 'type'>
    & InferType<typeof ColorSchema>
    & InferType<typeof ChildSchema>
    & InferType<typeof SoftRemovableSchema>
  >
}

export type CreatureProperty = ConvertToUnion<CreaturePropertyTypes>;

const CreatureProperties = new Mongo.Collection<CreatureProperty>('creatureProperties');

let key: keyof typeof propertySchemasIndex;
for (key in propertySchemasIndex) {
  const schema = new SimpleSchema({});
  schema.extend(propertySchemasIndex[key]);
  schema.extend(CreaturePropertySchema);
  schema.extend(ColorSchema);
  schema.extend(ChildSchema);
  schema.extend(SoftRemovableSchema);
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
