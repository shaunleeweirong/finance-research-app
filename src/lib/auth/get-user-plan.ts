import { createClient } from '@/lib/supabase/server';
import type { Plan } from '@/lib/auth/plans';

export async function getUserPlan(userId: string): Promise<Plan> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  return (profile?.plan as Plan) || 'free';
}
