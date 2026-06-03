import { prisma } from './prisma';

/**
 * Creates an audit log entry in the database.
 * @param userId The ID of the user performing the action
 * @param action The name of the action (e.g., 'PRODUCT_CREATE', 'ORDER_STATUS_UPDATE')
 * @param details Description or stringified JSON of action details
 */
export async function logActivity(userId: string, action: string, details: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
      },
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}
