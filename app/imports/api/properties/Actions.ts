import SimpleSchema from 'simpl-schema';
import createPropertySchema from '/imports/api/properties/subSchemas/createPropertySchema';
import { storedIconsSchema } from '/imports/api/icons/Icons';
import STORAGE_LIMITS from '/imports/constants/STORAGE_LIMITS';
import VARIABLE_NAME_REGEX from '/imports/constants/VARIABLE_NAME_REGEX';
import { z } from 'zod';
import { zCalculatedInlineCalculation, zCalculatedOnlyInlineCalculation, zInlineCalculation } from './subSchemas/inlineCalculationField';
import { zVariableName } from './subSchemas/zVariableName';
import { zComputedField, zComputedOnlyField, zFieldToCompute } from './subSchemas/computedField';
import { zId } from '/imports/api/utility/zId';
import { zColor } from './subSchemas/zColor';

export const ActionProperty = z.object({
  type: z.literal('action'),
  name: z.string().max(STORAGE_LIMITS.name).optional(),
  summary: zInlineCalculation(),
  description: zInlineCalculation(),
  actionType: z.enum([
    'action', 'bonus', 'attack', 'reaction', 'free', 'long', 'event'
  ]).default('action'),
  variableName: zVariableName().optional(),
  target: z.enum([
    'self', 'singleTarget', 'multipleTargets',
  ]).default('singleTarget'),
  attackRoll: zFieldToCompute(),
  uses: zFieldToCompute(),
  usesUsed: z.number().optional(),
  reset: zVariableName().optional(),
  resources: z.object({
    itemsConsumed: z.object({
      _id: zId().default(() => Random.id()),
      tag: z.string().max(STORAGE_LIMITS.tagLength).optional(),
      quantity: zFieldToCompute(),
      itemId: zId().optional(),
    }).array().max(32),
    attributesConsumed: z.object({
      _id: zId().default(() => Random.id()),
      variableName: zVariableName().optional(),
      quantity: zFieldToCompute(),
    }).array().max(32),
    conditions: z.object({
      _id: zId().default(() => Random.id()),
      condition: zFieldToCompute(),
      conditionNote: z.string().max(STORAGE_LIMITS.calculation).optional(),
    }).array().max(32),
  }),
  silent: z.boolean().optional(),
});
export type ActionProperty = z.infer<typeof ActionProperty>;

export const ComputedOnlyActionProperty = z.object({
  type: z.literal('action'),
  summary: zCalculatedOnlyInlineCalculation(),
  description: zCalculatedOnlyInlineCalculation(),
  insufficientResources: z.boolean().optional(),
  attackRoll: zComputedOnlyField(),
  uses: zComputedOnlyField(),
  usesLeft: z.number().optional().describe('removeBeforeCompute'),
  overridden: z.boolean().optional().describe('removeBeforeCompute'),
  resources: z.object({
    itemsConsumed: z.object({
      available: z.number().optional().describe('removeBeforeCompute'),
      quantity: zComputedOnlyField(),
      itemName: z.string().max(STORAGE_LIMITS.name).optional().describe('removeBeforeCompute'),
      itemIcon: zColor().optional().describe('removeBeforeCompute'),
    }).array().max(32),
    attributesConsumed: z.object({
      quantity: zComputedOnlyField(),
      available: z.number().optional().describe('removeBeforeCompute'),
      statName: z.string().max(STORAGE_LIMITS.name).optional().describe('removeBeforeCompute'),
    }).array().max(32),
    conditions: z.object({
      condition: zComputedOnlyField(),
    }).array().max(32),
  }),
});
export type ComputedOnlyActionProperty = z.infer<typeof ComputedOnlyActionProperty>;

export const ComputedActionProperty = ActionProperty.merge(ComputedOnlyActionProperty).extend({
  summary: zCalculatedInlineCalculation(),
  description: zCalculatedInlineCalculation(),
  attackRoll: zComputedField(),
  uses: zComputedField(),
  resources: z.object({
    itemsConsumed: ActionProperty.shape.resources.shape.itemsConsumed.element.merge(
      ComputedOnlyActionProperty.shape.resources.shape.itemsConsumed.element
    ).extend({
      quantity: zComputedField(),
    }).array().max(32),
    attributesConsumed: ActionProperty.shape.resources.shape.attributesConsumed.element.merge(
      ComputedOnlyActionProperty.shape.resources.shape.attributesConsumed.element
    ).extend({
      quantity: zComputedField(),
    }).array().max(32),
    conditions: ActionProperty.shape.resources.shape.conditions.element.merge(
      ComputedOnlyActionProperty.shape.resources.shape.conditions.element
    ).extend({
      condition: zComputedField(),
    }).array().max(32),
  }),
});
export type ComputedActionProperty = z.infer<typeof ComputedActionProperty>;

/*
 * Actions are things a character can do
 */
const ActionSchema = createPropertySchema({
  name: {
    type: String,
    optional: true,
    max: STORAGE_LIMITS.name,
  },
  summary: {
    type: 'inlineCalculationFieldToCompute',
    optional: true,
  },
  description: {
    type: 'inlineCalculationFieldToCompute',
    optional: true,
  },
  // What time-resource is used to take the action in combat
  // long actions take longer than 1 round to cast
  actionType: {
    type: String,
    allowedValues: ['action', 'bonus', 'attack', 'reaction', 'free', 'long', 'event'],
    defaultValue: 'action',
  },
  // If the action type is an event, what is the variable name of that event?
  variableName: {
    type: String,
    optional: true,
    regEx: VARIABLE_NAME_REGEX,
    min: 2,
    max: STORAGE_LIMITS.variableName,
  },
  // Who is the action directed at
  target: {
    type: String,
    defaultValue: 'singleTarget',
    allowedValues: [
      'self',
      'singleTarget',
      'multipleTargets',
    ],
  },
  // Some actions have an attack roll
  attackRoll: {
    type: 'fieldToCompute',
    optional: true,
  },
  // Calculation of how many times this action can be used
  uses: {
    type: 'fieldToCompute',
    optional: true,
  },
  // Integer of how many times it has already been used
  usesUsed: {
    type: SimpleSchema.Integer,
    optional: true,
  },
  // How this action's uses are reset automatically
  reset: {
    type: String,
    optional: true,
    regEx: VARIABLE_NAME_REGEX,
    min: 2,
    max: STORAGE_LIMITS.variableName,
  },
  // Resources
  resources: {
    type: Object,
    defaultValue: {},
  },
  'resources.itemsConsumed': {
    type: Array,
    defaultValue: [],
    max: 32,
  },
  'resources.itemsConsumed.$': {
    type: Object,
  },
  'resources.itemsConsumed.$._id': {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    autoValue() {
      // @ts-expect-error this.isSet not defined in types
      if (!this.isSet) return Random.id();
    }
  },
  'resources.itemsConsumed.$.tag': {
    type: String,
    optional: true,
  },
  'resources.itemsConsumed.$.quantity': {
    type: 'fieldToCompute',
    optional: true,
  },
  'resources.itemsConsumed.$.itemId': {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    optional: true,
  },
  'resources.attributesConsumed': {
    type: Array,
    defaultValue: [],
    max: 32,
  },
  'resources.attributesConsumed.$': {
    type: Object,
  },
  'resources.attributesConsumed.$._id': {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    autoValue() {
      // @ts-expect-error this.isSet not defined in types
      if (!this.isSet) return Random.id();
    }
  },
  'resources.attributesConsumed.$.variableName': {
    type: String,
    optional: true,
    max: STORAGE_LIMITS.variableName,
  },
  'resources.attributesConsumed.$.quantity': {
    type: 'fieldToCompute',
    optional: true,
  },
  'resources.conditions': {
    type: Array,
    defaultValue: [],
    max: 32,
  },
  'resources.conditions.$': {
    type: Object,
  },
  'resources.conditions.$._id': {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    autoValue() {
      // @ts-expect-error this.isSet not defined in types
      if (!this.isSet) return Random.id();
    }
  },
  'resources.conditions.$.condition': {
    type: 'fieldToCompute',
    optional: true,
  },
  'resources.conditions.$.conditionNote': {
    type: String,
    optional: true,
    max: STORAGE_LIMITS.calculation,
  },
  // Prevent the property from showing up in the log
  silent: {
    type: Boolean,
    optional: true,
  },
});

const ComputedOnlyActionSchema = createPropertySchema({
  summary: {
    type: 'computedOnlyInlineCalculationField',
    optional: true,
  },
  description: {
    type: 'computedOnlyInlineCalculationField',
    optional: true,
  },
  // True if the uses left is zero, or any item or attribute consumed is
  // insufficient
  insufficientResources: {
    type: Boolean,
    optional: true,
    removeBeforeCompute: true,
  },
  attackRoll: {
    type: 'computedOnlyField',
    optional: true,
  },
  uses: {
    parseLevel: 'reduce',
    type: 'computedOnlyField',
    optional: true,
  },
  // Uses - usesUsed
  usesLeft: {
    type: Number,
    optional: true,
    removeBeforeCompute: true,
  },
  // Denormalised tag if event is overridden by one with the same variable name
  overridden: {
    type: Boolean,
    optional: true,
    removeBeforeCompute: true,
  },
  // Resources
  resources: {
    type: Object,
    defaultValue: {},
  },
  'resources.itemsConsumed': {
    type: Array,
    defaultValue: [],
  },
  'resources.itemsConsumed.$': {
    type: Object,
  },
  'resources.itemsConsumed.$.available': {
    type: Number,
    optional: true,
    removeBeforeCompute: true,
  },
  'resources.itemsConsumed.$.quantity': {
    type: 'computedOnlyField',
    optional: true,
  },
  'resources.itemsConsumed.$.itemName': {
    type: String,
    max: STORAGE_LIMITS.name,
    optional: true,
    removeBeforeCompute: true,
  },
  'resources.itemsConsumed.$.itemIcon': {
    type: storedIconsSchema,
    optional: true,
    max: STORAGE_LIMITS.icon,
    removeBeforeCompute: true,
  },
  'resources.itemsConsumed.$.itemColor': {
    type: String,
    optional: true,
    regEx: /^#([a-f0-9]{3}){1,2}\b$/i,
    removeBeforeCompute: true,
  },
  'resources.attributesConsumed': {
    type: Array,
    defaultValue: [],
  },
  'resources.attributesConsumed.$': {
    type: Object,
  },
  'resources.attributesConsumed.$.quantity': {
    type: 'computedOnlyField',
    optional: true,
  },
  'resources.attributesConsumed.$.available': {
    type: Number,
    optional: true,
    removeBeforeCompute: true,
  },
  'resources.attributesConsumed.$.statName': {
    type: String,
    optional: true,
    max: STORAGE_LIMITS.name,
    removeBeforeCompute: true,
  },
});

const ComputedActionSchema = new SimpleSchema({})
  .extend(ActionSchema)
  .extend(ComputedOnlyActionSchema);

export { ActionSchema, ComputedOnlyActionSchema, ComputedActionSchema };
