import SimpleSchema from 'simpl-schema';
import ErrorSchema from '/imports/api/properties/subSchemas/ErrorSchema';
import STORAGE_LIMITS from '/imports/constants/STORAGE_LIMITS';
import { z } from 'zod';
import { zParseNode } from '/imports/parser/parseTree/zParseNode';
import { zId } from '/imports/api/utility/zId';
import { zError } from './zError';

const calcResult = () => z.union([z.string(), z.number()]);

const zFieldToCompute = () => z.object({
  calculation: z.string().max(STORAGE_LIMITS.calculation).optional(),
}).optional().describe('fieldToCompute');

const zComputedOnlyField = () => z.object({
  unaffected: calcResult().optional(),
  value: calcResult().optional(),
  valueNode: zParseNode().optional(),
  effectIds: zId().array().optional().describe('removeBeforeCompute'),
  proficiencyIds: zId().array().optional().describe('removeBeforeCompute'),
  parseNode: zParseNode().optional(),
  parseError: zError().optional(),
  hash: z.number().optional(),
  errors: zError().array().optional().describe('removeBeforeCompute'),
  // Effect aggregations
  advantage: z.number().optional().describe('removeBeforeCompute'),
  disadvantage: z.number().optional().describe('removeBeforeCompute'),
  fail: z.number().optional().describe('removeBeforeCompute'),
  conditional: z.string().array().optional().describe('removeBeforeCompute'),
}).optional();

const zComputedField = () => zFieldToCompute().unwrap().merge(
  zComputedOnlyField().unwrap()
).optional();

// Get schemas that apply fields directly so they can be gracefully extended
// because {type: Schema} fields can't be extended
function fieldToCompute(field) {
  const schemaObj = {
    [`${field}.calculation`]: {
      type: String,
      max: STORAGE_LIMITS.calculation,
      optional: true,
    },
  }
  // If the field is an array, we need to include those fields as well
  includeParentFields(field, schemaObj);
  return new SimpleSchema(schemaObj);
}

function computedOnlyField(field) {
  const schemaObj = {
    // The value (or calculation string) before any effects/proficiencies are applied or rolls made
    [`${field}.unaffected`]: {
      type: SimpleSchema.oneOf(String, Number),
      optional: true,
      blackbox: true,
    },
    // The value (or calculation string) after applying all effects
    [`${field}.value`]: {
      type: SimpleSchema.oneOf(String, Number),
      optional: true,
      blackbox: true,
    },
    // The value as a parse node, after applying all effects
    [`${field}.valueNode`]: {
      type: SimpleSchema.oneOf(String, Number),
      optional: true,
      blackbox: true,
    },
    // A list of effect Ids targeting this calculation
    [`${field}.effectIds`]: {
      type: Array,
      optional: true,
      removeBeforeCompute: true,
    },
    [`${field}.effectIds.$`]: {
      type: String,
    },
    [`${field}.proficiencyIds`]: {
      type: Array,
      optional: true,
      removeBeforeCompute: true,
    },
    [`${field}.proficiencyIds.$`]: {
      type: String,
    },
    // A cache of the parse result of the calculation
    [`${field}.parseNode`]: {
      type: Object,
      optional: true,
      blackbox: true,
    },
    // Set if there was an error parsing the calculation
    [`${field}.parseError`]: {
      type: ErrorSchema,
      optional: true,
    },
    // a hash of the calculation to see if the cached values need to be updated
    [`${field}.hash`]: {
      type: Number,
      optional: true,
    },
    [`${field}.errors`]: {
      type: Array,
      optional: true,
      maxCount: STORAGE_LIMITS.errorCount,
      removeBeforeCompute: true,
    },
    [`${field}.errors.$`]: {
      type: ErrorSchema,
    },
    // Effect aggregations
    [`${field}.advantage`]: {
      type: Number,
      optional: true,
      removeBeforeCompute: true,
    },
    [`${field}.disadvantage`]: {
      type: Number,
      optional: true,
      removeBeforeCompute: true,
    },
    [`${field}.fail`]: {
      type: Number,
      optional: true,
      removeBeforeCompute: true,
    },
    [`${field}.conditional`]: {
      type: Array,
      optional: true,
      removeBeforeCompute: true,
    },
    [`${field}.conditional.$`]: {
      type: String,
    },
  }
  includeParentFields(field, schemaObj);
  return new SimpleSchema(schemaObj);
}

// We must include parent array and object fields for the schema to be valid
function includeParentFields(field, schemaObj) {
  const splitField = field.split('.');
  if (splitField.length === 1) {
    schemaObj[field] = {
      type: Object,
      optional: true,
      computedField: true,
    };
    return;
  }
  let key = '';
  splitField.push('');
  splitField.forEach((value, index) => {
    if (key) {
      if (value === '$') {
        schemaObj[key] = {
          type: Array,
          optional: true
        };
      } else {
        schemaObj[key] = {
          type: Object,
          optional: true,
        };
        // the last object is the computed field
        if (index === splitField.length - 1) {
          schemaObj[key].computedField = true;
        }
      }
      key += '.';
    }
    key += value;
  });
}

// This should rarely be used, since the other two will merge correctly when
// uncomputed and computedOnly schemas are merged
function computedField(field) {
  return computedField(field).extend(computedOnlyField(field));
}

export {
  fieldToCompute,
  computedOnlyField,
  computedField,
  zFieldToCompute,
  zComputedOnlyField,
  zComputedField,
};
