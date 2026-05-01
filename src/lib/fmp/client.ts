import 'server-only';

class FMPError extends Error {
  constructor(
    public status: number,
    message: string,
    public endpoint: string
  ) {
    super(message);
    this.name = 'FMPError';
  }
}

async function fmpFetch<T>(
  endpoint: string,
  params?: Record<string, string>,
  revalidate?: number
): Promise<T> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    throw new FMPError(500, 'FMP_API_KEY environment variable is not set', endpoint);
  }

  const url = new URL(`https://financialmodelingprep.com/api/v3${endpoint}`);
  url.searchParams.set('apikey', apiKey);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  // Bounded retry budget for 429s. The previous 3-retry exponential
  // (1s/2s/4s = up to 7s) could starve Vercel's 10s function timeout when
  // FMP rate-limited, leaving no headroom for the actual request. One retry
  // at 500ms is enough to ride out a transient burst without timing out.
  let lastError: Error | null = null;
  const MAX_ATTEMPTS = 2;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const response = await fetch(url.toString(), {
      next: revalidate !== undefined ? { revalidate } : undefined,
    });

    if (response.status === 429) {
      lastError = new FMPError(429, 'Rate limited by FMP API', endpoint);
      // Last attempt: don't sleep — just throw immediately.
      if (attempt === MAX_ATTEMPTS - 1) break;
      await new Promise(r => setTimeout(r, 500));
      continue;
    }

    if (!response.ok) {
      throw new FMPError(response.status, `FMP API error: ${response.statusText}`, endpoint);
    }

    return response.json() as Promise<T>;
  }

  throw lastError!;
}

export { fmpFetch, FMPError };
