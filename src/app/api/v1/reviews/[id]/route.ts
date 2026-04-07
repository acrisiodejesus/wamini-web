import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { checkRateLimit } from '@/lib/rate-limit';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { recordAuditLog } from '@/lib/audit';

const updateSchema = z.object({
  rating: z.number().min(1).max(5, "Rating must be 1-5"),
  comment: z.string().max(300, "Hard limit: Max 300 chars").optional()
});

export async function PUT(req: NextRequest, { params }: { params: any }) {
  try {
    const context = await params;
    const reviewIdStr = context?.id;
    if (!reviewIdStr) return apiError("Missing review ID in URL", 400);
    
    const targetReviewId = parseInt(reviewIdStr, 10);
    if (isNaN(targetReviewId)) return apiError("Invalid review ID format", 400);

    const rateLimitResponse = checkRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getAuthPayload(req);
    if (!user) return apiError("401 Unauthorized", 401);

    const db = getDb();
    const actorId = (user as any)._testLocalId || (user as any).userId;

    // COMPLIANCE: Fetch old state for audit and IDOR check
    const oldReview = db.prepare('SELECT * FROM reviews WHERE id = ? AND deleted_at IS NULL').get(targetReviewId) as any;
    
    if (!oldReview) return apiError("Review not found or deleted", 404);
    if (oldReview.reviewer_id !== actorId) return apiError("403 Forbidden: You do not own this review", 403);

    const rawBody = await req.json();
    const data = updateSchema.parse(rawBody);
    const safeComment = data.comment ? DOMPurify.sanitize(data.comment) : null;

    db.prepare(`
      UPDATE reviews
      SET rating = ?, comment = ?, updated_at = datetime('now')
      WHERE id = ? AND reviewer_id = ?
    `).run(data.rating, safeComment, targetReviewId, actorId);

    const newReview = db.prepare('SELECT * FROM reviews WHERE id = ?').get(targetReviewId);

    // COMPLIANCE: Audit log of change
    recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'UPDATE',
      entity_type: 'reviews',
      entity_id: targetReviewId,
      old_data: oldReview,
      new_data: newReview
    });

    return apiOk({ updated: true }, 200);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError("Validation Error: " + err.errors[0].message, 400);
    }
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: any }) {
  try {
    const context = await params;
    const reviewIdStr = context?.id;
    if (!reviewIdStr) return apiError("Missing review ID", 400);

    const targetReviewId = parseInt(reviewIdStr, 10);
    const db = getDb();
    const user = await getAuthPayload(req);
    if (!user) return apiError("401 Unauthorized", 401);

    const actorId = (user as any)._testLocalId || (user as any).userId;

    const oldReview = db.prepare('SELECT * FROM reviews WHERE id = ? AND deleted_at IS NULL').get(targetReviewId) as any;
    if (!oldReview) return apiError("Review not found", 404);
    if (oldReview.reviewer_id !== actorId) return apiError("403 Forbidden: Ownership required", 403);

    // SOFT DELETE
    db.prepare("UPDATE reviews SET deleted_at = datetime('now') WHERE id = ?").run(targetReviewId);

    // COMPLIANCE: Audit SOFT_DELETE
    recordAuditLog(db, req, {
      actor_id: actorId,
      action: 'SOFT_DELETE',
      entity_type: 'reviews',
      entity_id: targetReviewId,
      old_data: { rating: oldReview.rating, comment: oldReview.comment }
    });

    return apiOk({ message: 'Review removed successfully (Soft-Delete)' });
  } catch (err: any) {
    console.error('Review DELETE Error:', err);
    return apiError("Internal server error", 500);
  }
}

