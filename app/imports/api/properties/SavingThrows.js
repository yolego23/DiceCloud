import SimpleSchema from 'simpl-schema';
import ErrorSchema from '/imports/api/properties/subSchemas/ErrorSchema.js';

// These are the rolls made when saves are called for
// For the saving throw bonus or proficiency, see ./Skills.js
let SavingThrowSchema = new SimpleSchema ({
  name: {
    type: String,
    optional: true,
  },
  // The computed DC
  dc: {
    type: String,
    optional: true,
  },
  // Who this saving throw applies to
	target: {
		type: String,
    defaultValue: 'every',
		allowedValues: [
      'self',   // the character who took the action
      'each',   // rolled once for `each` target
      'every',  // rolled once and applied to `every` target
    ],
	},
  // The variable name of save to roll
  stat: {
    type: String,
    optional: true,
  },
});

const ComputedOnlySavingThrowSchema = new SimpleSchema({
  dcResult: {
    type: Number,
    optional: true,
  },
  dcErrors: {
    type: Array,
    optional: true,
  },
  'dcErrors.$':{
    type: ErrorSchema,
  },
});

const ComputedSavingThrowSchema = new SimpleSchema()
  .extend(SavingThrowSchema)
  .extend(ComputedOnlySavingThrowSchema);

export { SavingThrowSchema, ComputedOnlySavingThrowSchema, ComputedSavingThrowSchema };
