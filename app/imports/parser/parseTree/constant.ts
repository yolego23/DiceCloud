import ParseNode from '/imports/parser/parseTree/ParseNode';
import ResolveLevelFunction from '/imports/parser/types/ResolveLevelFunction';

export type ConstantValueType = number | string | boolean | undefined

export type ConstantNode = {
  parseType: 'constant';
  value: ConstantValueType;
  // TODO replace all `constantNode.valueType` with `typeof constantNode.value`
  valueType: 'number' | 'string' | 'boolean' | 'undefined';
}

export type FiniteNumberConstantNode = {
  parseType: 'constant';
  value: number;
  // TODO replace all `constantNode.valueType` with `typeof constantNode.value`
  valueType: 'number';
}

type ConstantFactory = {
  create({ value }: { value: ConstantValueType }): ConstantNode;
  compile: ResolveLevelFunction<ConstantNode>;
  toString(node: ConstantNode): string;
}

const constant: ConstantFactory = {
  create({ value }): ConstantNode {
    return {
      parseType: 'constant',
      valueType: typeof value as 'number' | 'string' | 'boolean' | 'undefined',
      value,
    }
  },
  async compile(node, scope, context) {
    return { result: node, context };
  },
  toString(node) {
    return `${node.value}`;
  },
}

export function isFiniteNode(node: ParseNode): node is FiniteNumberConstantNode {
  return node.parseType === 'constant'
    && node.valueType === 'number'
    && typeof node.value === 'number'
    && isFinite(node.value);
}

export default constant;
