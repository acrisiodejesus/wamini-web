import { NextRequest } from 'next/server';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { checkRateLimit } from '@/lib/rate-limit';
import { getAuthPayload, apiError, apiOk } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { recordAuditLog } from '@/lib/audit';

const reviewSchema = z.object({
  target_id: z.number().int().positive("Invalid Target"),
  rating: z.number().min(1).max(5, "Rating must be 1-5"),
  comment: z.string().max(300, "Hard limit: Max 300 chars").optional()
});

export async function GET(req: NextRequest) {
  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const payload = await getAuthPayload(req);
  const { searchParams } = new URL(req.url);
  const targetId = parseInt(searchParams.get('target_id') ?? '', 10);

  if (isNaN(targetId) || targetId <= 0) {
    return apiError('target_id query param is required and must be a positive integer', 400);
  }

  const db = getDb();
  const actorId = (payload as any)?._testLocalId || (payload as any)?.userId || null;

  const reviews = db.prepare(`
    SELECT
      r.id,
      r.reviewer_id,
      u.name AS reviewer_name,
      r.target_id,
      r.negotiation_id,
      r.rating,
      r.comment,
      r.created_at
    FROM reviews r
    JOIN users u ON u.id = r.reviewer_id
    WHERE r.target_id = ? AND r.deleted_at IS NULL
    ORDER BY r.created_at DESC
    LIMIT 50
  `).all(targetId);

  const agg = db.prepare(`
    SELECT
      ROUND(AVG(rating), 1) AS average_rating,
      COUNT(*) AS total_count
    FROM reviews
    WHERE target_id = ? AND deleted_at IS NULL
  `).get(targetId) as { average_rating: number | null; total_count: number };

  // COMPLIANCE: Audit read access to user reputation
  recordAuditLog(db, req, {
    actor_id: actorId,
    action: 'ACCESS',
    entity_type: 'reviews',
    entity_id: targetId,
    old_data: { context: 'User reputation and reviews view' },
    new_data: { count: reviews.length, rating: agg.average_rating }
  });

  return apiOk({
    reviews,
    average_rating: agg.average_rating ?? 0,
    total_count: agg.total_count,
  });
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const user = await getAuthPayload(req);
  if (!user) return apiError("401 Unauthorized", 401);

  try {
    const db = getDb();
    const actorId = (user as any)._testLocalId || (user as any).userId;

    // Map Auth0 Sub to internal reviewer_id if needed
    let reviewerId = actorId;
    if (!reviewerId && user.sub) {
      const dbUser = db.prepare('SELECT id FROM users WHERE auth0_sub = ? AND deleted_at IS NULL').get(user.sub) as { id: number };
      if (!dbUser) return apiError("401 Unauthorized - Unknown User", 401);
      reviewerId = dbUser.id;
    }

    const rawBody = await req.json();
    const data = reviewSchema.parse(rawBody);
    const safeComment = data.comment ? DOMPurify.sanitize(data.comment) : null;

    if (reviewerId === data.target_id) {
      return apiError("403 Forbidden: Cannot review yourself", 403);
    }

    // Context Violation Check: Negotiation must be completed and NOT deleted
    const completedNeg = db.prepare(`
      SELECT id FROM negotiations 
      WHERE status = 'completed' AND deleted_at IS NULL AND 
        ((buyer_id = ? AND seller_id = ?) OR (buyer_id = ? AND seller_id = ?))
      LIMIT 1
    `).get(reviewerId, data.target_id, data.target_id, reviewerId) as { id: number } | undefined;

    if (!completedNeg) {
      return apiError("403 Forbidden: No completed negotiation found between these users", 403);
    }

    const result = db.prepare(`
      INSERT INTO reviews (reviewer_id, target_id, negotiation_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(reviewerId, data.target_id, completedNeg.id, data.rating, safeComment);

    const reviewId = result.lastInsertRowid;

    // COMPLIANCE: Audit creation
    recordAuditLog(db, req, {
      actor_id: reviewerId,
      action: 'CREATE',
      entity_type: 'reviews',
      entity_id: Number(reviewId),
      new_data: { target_id: data.target_id, rating: data.rating }
    });

    return apiOk({ id: reviewId, comment: safeComment }, 201);

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return apiError("Validation Error: " + err.errors[0].message, 400);
    }
    if (err.message && err.message.includes('CHECK constraint failed')) {
      return apiError("400 Bad Request: Business constraint violated at storage layer", 400);
    }
    return apiError("Internal server error", 500);
  }
}



