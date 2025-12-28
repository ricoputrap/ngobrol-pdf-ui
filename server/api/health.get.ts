/**
 * GET /api/health
 *
 * Health check endpoint for monitoring and readiness checks.
 *
 * Response:
 *   200 OK
 *   {
 *     "status": "ok",
 *     "timestamp": "2025-12-27T12:00:00.000Z"
 *   }
 *
 * Notes:
 * - Simple health check endpoint
 * - Returns current server timestamp
 * - Can be used by load balancers, monitoring tools, or deployment systems
 * - Always returns 200 OK if the server is running
 */

export default defineEventHandler(async () => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
});
