import { z } from 'zod';

export const zColor = () => z.string().regex(/^#([a-f0-9]{3}){1,2}\b$/i);
