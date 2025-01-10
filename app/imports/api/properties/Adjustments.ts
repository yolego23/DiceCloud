import STORAGE_LIMITS from '/imports/constants/STORAGE_LIMITS';
import createPropertySchema from '/imports/api/properties/subSchemas/createPropertySchema';
import { Expand, InferType, TypedSimpleSchema } from '/imports/api/utility/TypedSimpleSchema';

const AdjustmentSchema = createPropertySchema({
  // The roll that determines how much to change the attribute
  // This can be simplified, but should only compute when activated
  amount: {
    type: 'fieldToCompute' as const,
    parseLevel: 'compile',
    optional: true,
    defaultValue: 1,
  },
  // Who this adjustment applies to
  target: {
    type: String,
    defaultValue: 'target',
    allowedValues: [
      'self',
      'target',
    ],
  },
  // The stat this rolls applies to
  stat: {
    type: String,
    optional: true,
    max: STORAGE_LIMITS.variableName,
  },
  operation: {
    type: String,
    allowedValues: ['set', 'increment'],
    defaultValue: 'increment',
  },
  // Prevent the property from showing up in the log
  silent: {
    type: Boolean,
    optional: true,
  },
});

const ComputedOnlyAdjustmentSchema = createPropertySchema({
  amount: {
    type: 'computedOnlyField' as const,
    parseLevel: 'compile',
    optional: true,
  },
});

const ComputedAdjustmentSchema = new TypedSimpleSchema({})
  .extend(AdjustmentSchema)
  .extend(ComputedOnlyAdjustmentSchema);

export type Adjustment = InferType<typeof AdjustmentSchema>;
export type ComputedOnlyAdjustment = InferType<typeof ComputedOnlyAdjustmentSchema>;
export type ComputedAdjustment = Expand<InferType<typeof AdjustmentSchema> & InferType<typeof ComputedOnlyAdjustmentSchema>>;

export { AdjustmentSchema, ComputedAdjustmentSchema, ComputedOnlyAdjustmentSchema };
