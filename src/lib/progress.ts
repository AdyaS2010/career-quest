import { supabase } from './supabase';

// Persist a completed challenge and roll the totals up to career + profile.
// Extracted from CareerWorld so the city's building interiors save scores the
// exact same way (single source of truth for progression).
export async function saveChallengeProgress(params: {
  userId: string;
  careerId: string;
  challengeId: string;
  score: number;
  challengeIds: string[]; // all challenge ids for this career
}): Promise<void> {
  const { userId, careerId, challengeId, score, challengeIds } = params;

  // 1. Existing challenge progress row?
  const { data: existing } = await (supabase
    .from('user_challenge_progress') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .maybeSingle();

  if (existing) {
    await (supabase.from('user_challenge_progress') as any)
      .update({
        status: 'completed',
        score,
        best_score: Math.max(existing.best_score, score),
        attempts: existing.attempts + 1,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await (supabase.from('user_challenge_progress') as any)
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        status: 'completed',
        score,
        best_score: score,
        attempts: 1,
        completed_at: new Date().toISOString(),
      });
  }

  // 2. Re-fetch this career's progress for accurate totals.
  const { data: careerProgress } = await (supabase
    .from('user_challenge_progress') as any)
    .select('best_score, challenge_id')
    .eq('user_id', userId)
    .in('challenge_id', challengeIds);

  const rows = (careerProgress || []) as { best_score: number; challenge_id: string }[];
  const careerTotal = rows.reduce((s, r) => s + r.best_score, 0);
  const completedIds = new Set(rows.map(r => r.challenge_id));
  const allDone = challengeIds.every(id => completedIds.has(id));

  // 3. Upsert career progress.
  const { data: existingCareer } = await supabase
    .from('user_career_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('career_id', careerId)
    .maybeSingle();
  const ec = existingCareer as { id: string } | null;

  if (ec) {
    await (supabase.from('user_career_progress') as any)
      .update({
        score: careerTotal,
        status: allDone ? 'completed' : 'in_progress',
        completed_at: allDone ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ec.id);
  } else {
    await (supabase.from('user_career_progress') as any)
      .insert({
        user_id: userId,
        career_id: careerId,
        score: careerTotal,
        status: allDone ? 'completed' : 'in_progress',
        started_at: new Date().toISOString(),
        completed_at: allDone ? new Date().toISOString() : null,
      });
  }

  // 4. Roll up profile totals across ALL careers.
  const { data: allProgress } = await (supabase
    .from('user_challenge_progress') as any)
    .select('best_score')
    .eq('user_id', userId);
  const total = ((allProgress || []) as { best_score: number }[]).reduce((s, r) => s + r.best_score, 0);

  await (supabase.from('profiles') as any)
    .update({
      total_score: total,
      experience: total,
      level: Math.floor(total / 100) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}
