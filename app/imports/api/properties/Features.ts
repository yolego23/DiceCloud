import SimpleSchema from 'simpl-schema';
import STORAGE_LIMITS from '/imports/constants/STORAGE_LIMITS';
import createPropertySchema from '/imports/api/properties/subSchemas/createPropertySchema';
import type { Expand, InferType } from '/imports/api/utility/TypedSimpleSchema';

const FeatureSchema = createPropertySchema({
  name: {
    type: String,
    max: STORAGE_LIMITS.name,
    optional: true,
  },
  summary: {
    type: 'inlineCalculationFieldToCompute' as const,
    optional: true,
  },
  description: {
    type: 'inlineCalculationFieldToCompute' as const,
    optional: true,
  },
});

const ComputedOnlyFeatureSchema = createPropertySchema({
  summary: {
    type: 'computedOnlyInlineCalculationField' as const,
    optional: true,
  },
  description: {
    type: 'computedOnlyInlineCalculationField' as const,
    optional: true,
  },
});

const ComputedFeatureSchema = new SimpleSchema({})
  .extend(FeatureSchema)
  .extend(ComputedOnlyFeatureSchema);

export type Feature = InferType<typeof FeatureSchema>;
export type ComputedOnlyFeature = InferType<typeof ComputedOnlyFeatureSchema>;
export type ComputedFeature = Expand<InferType<typeof FeatureSchema> & InferType<typeof ComputedOnlyFeatureSchema>>;

export { FeatureSchema, ComputedFeatureSchema, ComputedOnlyFeatureSchema }
