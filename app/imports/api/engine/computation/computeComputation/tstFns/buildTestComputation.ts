import Creatures from '/imports/api/creature/creatures/Creatures';
import { TestCreature } from '/imports/api/engine/action/functions/actionEngineTest.testFn';
import { buildComputationFromProps } from '/imports/api/engine/computation/buildCreatureComputation';
import propsFromForest from '/imports/api/engine/computation/utility/propsFromForest.testFn';
import { cleanAndValidate } from '/imports/api/utility/TypedSimpleSchema';

export default function buildTestComputation(testCreature: TestCreature) {
  const creature = cleanAndValidate(Creatures.simpleSchema(), {
    _id: testCreature._id,
    name: testCreature.name || 'Test Creature',
    dirty: true,
    owner: Random.id(),
    readers: [],
    writers: [],
  });
  const props = propsFromForest(testCreature.props, creature._id);
  return buildComputationFromProps(props, creature, {});
}
