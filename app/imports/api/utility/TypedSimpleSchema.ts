import SimpleSchema, { SimpleSchemaDefinition } from 'simpl-schema';
import type {
  FieldToCalculate, CalculatedOnlyField
} from '/imports/api/properties/subSchemas/computedField';
import type {
  InlineCalculationFieldToCompute, ComputedOnlyInlineCalculationField
} from '/imports/api/properties/subSchemas/inlineCalculationField';

// It DOES NOT support a constructor with multiple schemas.
export type Definition = Exclude<SimpleSchemaDefinition, any[]>;

// This is a no-op wrapper, effectively implementing a phantom type.
export class TypedSimpleSchema<T extends Definition> extends SimpleSchema {
  constructor(definition: T) {
    super(definition);
  }
  // Extending the schema with another schema &'s their definitions
  extend<U extends Definition>(otherSchema: TypedSimpleSchema<U>): TypedSimpleSchema<T & U> {
    return super.extend(otherSchema);
  }
}

// It cannot be a method due to https://github.com/microsoft/TypeScript/issues/36931.
export function validate<T extends Definition>(schema: TypedSimpleSchema<T>, value: unknown): asserts value is InferSchema<T> {
  schema.validate(value);
}

// If this type emerges anywhere in calculations, congratulations!
// You've just hit an unimplemented corner case :D
type NotImplementedMarker = { readonly NotImplementedMarker: unique symbol };

// Internal calculation markers.
type ArrayMarker = { readonly ArrayMarker: unique symbol };
type ObjectMarker = { readonly ObjectMarker: unique symbol };

export type InferType<T> = Expand<MakeUndefinedOptional<InferTypeInner<T>>>;

// Infer TypeScript type from SimpleSchema type.
type InferTypeInner<T> =
  T extends typeof Array ? ArrayMarker :
  T extends typeof Boolean ? boolean :
  // eslint-disable-next-line @typescript-eslint/ban-types
  T extends typeof Function ? Function :
  T extends typeof Number ? number :
  T extends typeof SimpleSchema.Integer ? number :
  T extends typeof Object ? ObjectMarker :
  T extends typeof String ? string :
  T extends typeof Date ? Date :
  T extends RegExp ? string :
  T extends TypedSimpleSchema<infer U> ? InferSchema<U> :
  NotImplementedMarker;

// Infer TypeScript type from a single field definition.
export type InferField<Def extends Definition, Key extends keyof Def> =
  Key extends string
  ? Def[Key] extends { type: infer Typ }
  ? ArrayMarker extends InferTypeInner<Typ>
  ? Array<InferField<Def, `${Key}.$`>>
  : ObjectMarker extends InferTypeInner<Typ>
  ? { [L in keyof Def as L extends `${Key}.${infer SubKey}` ? SubKey extends `${string}.${string}` ? never : SubKey : never]: InferField<Def, L> }
  : Def[Key] extends { allowedValues: infer Allowed extends string[] } ? InferOptional<Def, Key, InferEnum<Allowed>>
  : Def[Key] extends { type: 'fieldToCompute' } ? FieldToCalculate
  : Def[Key] extends { type: 'computedOnlyField' } ? CalculatedOnlyField
  : Def[Key] extends { type: 'inlineCalculationFieldToCompute' } ? InlineCalculationFieldToCompute
  : Def[Key] extends { type: 'computedOnlyInlineCalculationField' } ? ComputedOnlyInlineCalculationField
  : InferOptional<Def, Key, InferTypeInner<Typ>>
  : NotImplementedMarker
  : NotImplementedMarker

// Infer union from string array (allowedValues should me marked as const for this to work)
type InferEnum<T extends string[]> = T[number];

// Infer optional from optional field
type InferOptional<Def, Key extends keyof Def, U> = Def[Key] extends { optional: true } ? U | undefined : U;

type MakeUndefinedOptional<Type> = { [Property in keyof Type as undefined extends Type[Property] ? never : Property]: Type[Property]; }
  & { [Property in keyof Type as undefined extends Type[Property] ? Property : never]+?: Type[Property]; };

// Infer TypeScript type from a schema definition.
export type InferSchema<Def extends Definition> = InferField<
  { '': { type: typeof Object } }
  & { [Key in keyof Def as Key extends string ? `.${Key}` : never]: Def[Key] }, ''
>;

// expands object types recursively
export type ExpandRecursively<T> = T extends object
  ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
  : T;

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
