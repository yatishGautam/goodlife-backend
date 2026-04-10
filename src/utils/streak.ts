import prisma from '@/config/database';

export async function calculateStreak(userId: string): Promise<number> {
  const result = await prisma.$queryRaw<{ session_date: Date }[]>`
    SELECT DISTINCT DATE(started_at AT TIME ZONE
      (SELECT timezone FROM users WHERE id = ${userId}::uuid)
    ) AS session_date
    FROM workout_sessions
    WHERE user_id = ${userId}::uuid
      AND completed_at IS NOT NULL
      AND deleted_at IS NULL
    ORDER BY session_date DESC
  `;

  if (result.length === 0) return 0;

  let streak = 0;
  const expected = new Date();
  expected.setHours(0, 0, 0, 0);

  for (const row of result) {
    const sessionDate = new Date(row.session_date);
    sessionDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (expected.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays <= 1) {
      streak++;
      expected.setTime(sessionDate.getTime());
      expected.setDate(expected.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
