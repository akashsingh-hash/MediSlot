import { z } from 'zod';

export const UserRoleSchema = z.enum(['PATIENT', 'DOCTOR', 'ADMIN']);

// Add DTOs, interfaces, and prompts here later.
