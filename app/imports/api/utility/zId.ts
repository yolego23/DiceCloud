import { z } from 'zod';

export const zId = () => z.string().trim().length(17);
