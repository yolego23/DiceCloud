import { z } from 'zod';
import VARIABLE_NAME_REGEX from '/imports/constants/VARIABLE_NAME_REGEX';
import STORAGE_LIMITS from '/imports/constants/STORAGE_LIMITS';

export const zVariableName = () => z.string().min(2).max(STORAGE_LIMITS.variableName).regex(VARIABLE_NAME_REGEX);
