import { z } from 'zod';

export default function zodSchemaMixin(methodOptions) {
  // If the user is opting in to this mixin, they must provide a schema

  if (!methodOptions.schema) {
    throw new Meteor.Error('zodSchemaMixin.options',
      '"schema" is required if you are using this mixin');
  }

  // We are going to do validation in the "run" step so that the result of parsing the
  // arguments is available to the rest of the "run" function. So skip validation
  methodOptions.validate = null;
  const schema = methodOptions.schema;

  if (!(schema instanceof z.Schema)) {
    throw new Meteor.Error('zodSchemaMixin.options',
      '"schema" must be an instance of zod.Schema');
  }

  // Wrap the run function with zod parsing, and run it with the parsed arguments
  methodOptions.run = function (...args) {
    const parsedArgs = schema.parse(args);
    return methodOptions.run.apply(this, parsedArgs);
  };

  return methodOptions;
}
