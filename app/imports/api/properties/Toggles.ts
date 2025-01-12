import SimpleSchema from 'simpl-schema';
import STORAGE_LIMITS from '/imports/constants/STORAGE_LIMITS';
import createPropertySchema from '/imports/api/properties/subSchemas/createPropertySchema';
import TagTargetingSchema from '/imports/api/properties/subSchemas/TagTargetingSchema';
import type { Expand, InferType } from '/imports/api/utility/TypedSimpleSchema';

const ToggleSchema = createPropertySchema({
  name: {
    type: String,
    optional: true,
    max: STORAGE_LIMITS.name,
  },
  variableName: {
    type: String,
    optional: true,
    max: STORAGE_LIMITS.variableName,
  },
  showUI: {
    type: Boolean,
    optional: true,
  },
  disabled: {
    type: Boolean,
    optional: true,
  },
  enabled: {
    type: Boolean,
    optional: true,
  },
  // if neither disabled or enabled, the condition will be run to determine
  // if the children of the toggle should be active
  condition: {
    type: 'fieldToCompute' as const,
    optional: true,
  },
  // Prevent the property from showing up in the log
  silent: {
    type: Boolean,
    optional: true,
  },
}).extend(TagTargetingSchema);

const ComputedOnlyToggleSchema = createPropertySchema({
  condition: {
    type: 'computedOnlyField' as const,
    optional: true,
  },
});

export type Toggle = InferType<typeof ToggleSchema>;
export type ComputedOnlyToggle = InferType<typeof ComputedOnlyToggleSchema>;
export type ComputedToggle = Expand<InferType<typeof ToggleSchema> & InferType<typeof ComputedOnlyToggleSchema>>;

const ComputedToggleSchema = new SimpleSchema({})
  .extend(ComputedOnlyToggleSchema)
  .extend(ToggleSchema);

export { ToggleSchema, ComputedOnlyToggleSchema, ComputedToggleSchema };
