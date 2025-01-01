import { Random } from 'meteor/random';
import { InferType, TypedSimpleSchema } from '/imports/api/utility/TypedSimpleSchema';

const AdjustmentSchema = new TypedSimpleSchema({
  _id: {
    type: String,
    max: 17,
    autoValue() {
      if (!this.isSet) return Random.id();
    }
  },
  // The roll that determines how much to change the attribute
  adjustment: {
    type: String,
    optional: true,
    defaultValue: '1',
  },
  // Who this adjustment applies to
  target: {
    type: String,
    defaultValue: 'every',
    allowedValues: [
      'self',   // the character who took the action
      'each',   // rolled once for `each` target
      'every',  // rolled once and applied to `every` target
    ] as const,
  },
  // The stat this rolls applies to, if damage type is set, this is ignored
  stat: {
    type: String,
    optional: true,
  },
});

export type Adjustment = InferType<typeof AdjustmentSchema>;

export default AdjustmentSchema;
