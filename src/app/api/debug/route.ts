import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const supabaseCookies = allCookies.filter((c) => c.name.includes('supabase') || c.name.includes('sb-'));

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  return NextResponse.json({
    hasCookies: supabaseCookies.length > 0,
    cookieNames: supabaseCookies.map((c) => c.name),
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message ?? null,
  });
}
