import VARIABLE_NAME_REGEX from '/imports/constants/VARIABLE_NAME_REGEX';
import ErrorSchema from '/imports/api/properties/subSchemas/ErrorSchema';
import {
  parse,
  prettifyParseError,
} from '/imports/parser/parser';
import STORAGE_LIMITS from '/imports/constants/STORAGE_LIMITS';
import createPropertySchema from '/imports/api/properties/subSchemas/createPropertySchema';
import resolve from '/imports/parser/resolve';
import Context from '/imports/parser/types/Context';
import traverse from '/imports/parser/traverse';
import type ResolveLevel from '/imports/parser/types/ResolveLevel';
import type { Expand, InferType } from '/imports/api/utility/TypedSimpleSchema';

/*
 * Constants are primitive values that can be used elsewhere in computations
 */
const ConstantSchema = createPropertySchema({
  name: {
    type: String,
    optional: true,
    max: STORAGE_LIMITS.name,
  },
  // The technical, lowercase, single-word name used in formulae
  variableName: {
    type: String,
    regEx: VARIABLE_NAME_REGEX,
    min: 2,
    defaultValue: 'newConstant',
    max: STORAGE_LIMITS.variableName,
  },
  // The input value to be parsed, must return a constant node or an array
  // of constant nodes to be valid
  calculation: {
    type: String,
    optional: true,
    max: STORAGE_LIMITS.calculation,
  },
  errors: {
    type: Array,
    maxCount: STORAGE_LIMITS.errorCount,
    async autoValue() {
      const calc = this.field('calculation');
      if (!calc.isSet && this.isModifier) {
        this.unset()
        return;
      }
      const string = calc.value;
      if (!string) return [];
      // Evaluate the calculation with no scope
      const { result, context } = await parseString(string);
      // Any existing errors will result in an early failure
      if (context && context.errors.length) return context.errors;
      // Ban variables in constants if necessary
      result && traverse(result, node => {
        if (node.parseType === 'symbol' || node.parseType === 'accessor') {
          context.error('Variables can\'t be used to define a constant');
        }
      });
      return context && context.errors || [];
    }
  },
  'errors.$': {
    type: ErrorSchema,
  },
});

async function parseString(string, fn: ResolveLevel = 'compile') {
  const context = new Context();
  if (!string) {
    return { result: string, context };
  }

  // Parse the string using mathjs
  let node;
  try {
    node = parse(string);
  } catch (e) {
    const message = prettifyParseError(e as Error);
    context.error(message);
    return { context };
  }
  if (!node) return { context };
  const { result } = await resolve(fn, node, {/*empty scope*/ }, context);
  return { result, context }
}

const ComputedOnlyConstantSchema = createPropertySchema({});

export type Constant = InferType<typeof ConstantSchema>;
export type ComputedOnlyConstant = InferType<typeof ComputedOnlyConstantSchema>;
export type ComputedConstant = Expand<InferType<typeof ConstantSchema> & InferType<typeof ComputedOnlyConstantSchema>>;

export { ConstantSchema, ComputedOnlyConstantSchema };
