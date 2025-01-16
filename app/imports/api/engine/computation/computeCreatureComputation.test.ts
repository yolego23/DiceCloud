import computeCreatureComputation from './computeCreatureComputation';
import { buildComputationFromProps } from './buildCreatureComputation';
import { assert } from 'chai';
import CreatureProperties, { CreatureProperty } from '/imports/api/creature/creatureProperties/CreatureProperties';
import computeTests from './computeComputation/tests/index';
import Creatures, { Creature } from 'imports/api/creature/creatures/Creatures';

describe('Compute computation', function () {
  it('Computes something at all', function () {
    const creature: Creature = Creatures.schema.clean({});
    const computation = buildComputationFromProps(testProperties, creature, {});
    computeCreatureComputation(computation);
    assert.exists(computation);
  });
  computeTests.forEach(test => it(test.text, test.fn));
});

const testProperties = [
  clean({
    _id: 'attributeId123',
    type: 'attribute',
    variableName: 'strength',
    attributeType: 'ability',
    baseValue: {
      calculation: '1 + 2 + 3',
    },
    description: {
      text: 'strength is {strength}'
    }
  }),
];

function clean(prop: Partial<CreatureProperty>): CreatureProperty {
  // @ts-expect-error don't have types for .simpleSchema
  const schema = CreatureProperties.simpleSchema(prop);
  return schema.clean(prop);
}
