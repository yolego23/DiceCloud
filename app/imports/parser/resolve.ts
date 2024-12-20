import '/imports/parser/parseTree/array';
import factories from '/imports/parser/parseTree';
import InputProvider from '/imports/api/engine/action/functions/userInput/InputProvider';
import ParseNode from '/imports/parser/parseTree/ParseNode';
import rollDice from '/imports/parser/rollDice';
import ResolveLevel from './types/ResolveLevel';
import ResolvedResult from './types/ResolvedResult';
import Context from './types/Context';
import ResolveLevelFunction from '/imports/parser/types/ResolveLevelFunction';

// Takes a parse node and computes it to a set detail level
// returns {result, context}
export default async function resolve(
  fn: ResolveLevel,
  node: ParseNode,
  scope: Record<string, any> = {},
  context = new Context(),
  inputProvider = computationInputProvider,
): Promise<ResolvedResult> {
  if (!node) throw new Error('Node must be supplied');
  const factory = factories[node.parseType];
  const handlerFunction: ResolveLevelFunction<ParseNode> = factory[fn];
  if (!factory) {
    throw new Meteor.Error(`Parse node type: ${node.parseType} not implemented`);
  }
  if ('resolve' in factory) {
    return factory.resolve(fn, node as any, scope, context, inputProvider, resolve);
  } else if (fn in factory) {
    return handlerFunction(node, scope, context, inputProvider, resolve);
  } else if (fn === 'reduce' && 'roll' in factory) {
    return factory.roll(node as any, scope, context, inputProvider, resolve)
  } else if (factory.compile) {
    return factory.compile(node as any, scope, context, inputProvider, resolve)
  } else {
    throw new Meteor.Error('Compile not implemented on ' + node.parseType);
  }
}

const computationInputProvider: InputProvider = {
  /**
   * By default, just roll the dice as usual
   */
  async rollDice(dice) {
    return dice.map(d => rollDice(d.number, d.diceSize));
  },
  /**
   * By default just choose the minimum number of options from the front of the list
   */
  async choose(choices, quantity = [1, 1]) {
    const chosen: string[] = [];
    const choiceQuantity = quantity[0] <= 0 ? 1 : quantity[0];
    for (let i = 0; i < choiceQuantity && i < choices.length; i += 1) {
      chosen.push(choices[i]._id);
    }
    return chosen;
  }
}
