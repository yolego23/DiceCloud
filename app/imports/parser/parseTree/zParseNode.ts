import { z } from 'zod';
import ParseNode from './ParseNode';

export const zParseNode = () => z.custom<ParseNode>((val) => {
  return !!val;
});
