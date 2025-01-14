import STORAGE_LIMITS from '/imports/constants/STORAGE_LIMITS';
import createPropertySchema from '/imports/api/properties/subSchemas/createPropertySchema';
import { TypedSimpleSchema } from '/imports/api/utility/TypedSimpleSchema';

const ContainerSchema = createPropertySchema({
  name: {
    type: String,
    optional: true,
    trim: false,
    max: STORAGE_LIMITS.name,
  },
  carried: {
    type: Boolean,
    defaultValue: true,
    optional: true,
  },
  contentsWeightless: {
    type: Boolean,
    optional: true,
  },
  weight: {
    type: Number,
    min: 0,
    optional: true,
  },
  value: {
    type: Number,
    min: 0,
    optional: true,
  },
  description: {
    type: 'inlineCalculationFieldToCompute' as const,
    optional: true,
  },
});

const ComputedOnlyContainerSchema = createPropertySchema({
  description: {
    type: 'computedOnlyInlineCalculationField' as const,
    optional: true,
  },
  // Weight of all the contents.
  contentsWeight: {
    type: Number,
    optional: true,
    removeBeforeCompute: true,
  },
  // Weight of all the carried contents (some sub-containers might not be carried)
  // zero if `contentsWeightless` is true
  carriedWeight: {
    type: Number,
    optional: true,
    removeBeforeCompute: true,
  },
  contentsValue: {
    type: Number,
    optional: true,
    removeBeforeCompute: true,
  },
  carriedValue: {
    type: Number,
    optional: true,
    removeBeforeCompute: true,
  },
});

const ComputedContainerSchema = TypedSimpleSchema.from({})
  .extend(ComputedOnlyContainerSchema)
  .extend(ContainerSchema);

export { ContainerSchema, ComputedOnlyContainerSchema, ComputedContainerSchema };
