import SimpleSchema from 'simpl-schema';
import STORAGE_LIMITS from '/imports/constants/STORAGE_LIMITS';
import createPropertySchema from '/imports/api/properties/subSchemas/createPropertySchema';
import type { Expand, InferType } from '/imports/api/utility/TypedSimpleSchema';

const NoteSchema = createPropertySchema({
  name: {
    type: String,
    optional: true,
    max: STORAGE_LIMITS.name,
  },
  summary: {
    type: 'inlineCalculationFieldToCompute' as const,
    optional: true,
  },
  description: {
    type: 'inlineCalculationFieldToCompute' as const,
    optional: true,
  },
  // Prevent the property from showing up in the log
  silent: {
    type: Boolean,
    optional: true,
  },
});

const ComputedOnlyNoteSchema = createPropertySchema({
  summary: {
    type: 'computedOnlyInlineCalculationField' as const,
    optional: true,
  },
  description: {
    type: 'computedOnlyInlineCalculationField' as const,
    optional: true,
  },
});

const ComputedNoteSchema = new SimpleSchema({})
  .extend(NoteSchema)
  .extend(ComputedOnlyNoteSchema);

export type Note = InferType<typeof NoteSchema>;
export type ComputedOnlyNote = InferType<typeof ComputedOnlyNoteSchema>;
export type ComputedNote = Expand<InferType<typeof NoteSchema> & InferType<typeof ComputedOnlyNoteSchema>>;

export { NoteSchema, ComputedNoteSchema, ComputedOnlyNoteSchema, };
