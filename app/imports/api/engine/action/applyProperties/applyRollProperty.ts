import { EngineAction } from '/imports/api/engine/action/EngineActions';
import { applyDefaultAfterPropTasks } from '/imports/api/engine/action/functions/applyTaskGroups';
import { rollAndReduceCalculation } from '/imports/api/engine/action/functions/recalculateCalculation';
import { PropTask } from '/imports/api/engine/action/tasks/Task';
import TaskResult from '/imports/api/engine/action/tasks/TaskResult';
import { toString } from '/imports/parser/resolve';

export default async function roll(
  task: PropTask, action: EngineAction, result: TaskResult, userInput
): Promise<void> {
  const prop = task.prop;
  // If there isn't a calculation, just apply the children instead
  if (!prop.roll?.calculation) {
    return applyDefaultAfterPropTasks(action, prop, task.targetIds, userInput);
  }

  const logValue: string[] = [];

  // roll the dice only and store that string
  const {
    rolled, reduced, errors
  } = await rollAndReduceCalculation(prop.roll, action);

  if (rolled.parseType !== 'constant') {
    logValue.push(toString(rolled));
  }
  errors?.forEach(error => {
    result.appendLog({ name: 'Error', value: error.message }, task.targetIds);
  });

  // Store the result
  if (reduced.parseType === 'constant') {
    prop.roll.value = reduced.value;
  } else if (reduced.parseType === 'error') {
    prop.roll.value = null;
  } else {
    prop.roll.value = toString(reduced);
  }

  // If we didn't end up with a constant or a number of finite value, give up
  if (reduced?.parseType !== 'constant' || (reduced.valueType === 'number' && !isFinite(reduced.value))) {
    return applyDefaultAfterPropTasks(action, prop, task.targetIds, userInput);
  }
  const value = reduced.value;

  result.scope[prop.variableName] = { value };
  logValue.push(`**${value}**`);

  result.appendLog({
    name: prop.name,
    value: logValue.join('\n'),
    inline: true,
    silenced: prop.silent,
  }, task.targetIds);

  // Apply children
  return applyDefaultAfterPropTasks(action, prop, task.targetIds, userInput);
}