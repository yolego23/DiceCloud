import SimpleSchema from 'simpl-schema';
import { TypedSimpleSchema } from '/imports/api/utility/TypedSimpleSchema';

let SoftRemovableSchema = new TypedSimpleSchema({
  'removed': {
    type: Boolean,
    optional: true,
    index: 1,
  },
  'removedAt': {
    type: Date,
    optional: true,
    index: 1,
  },
  'removedWith': {
    optional: true,
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    index: 1,
  },
});

export default SoftRemovableSchema;
