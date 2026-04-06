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

  // Exponential backoff for rate limiting (3 retries: 1s, 2s, 4s)
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url.toString(), {
      next: revalidate !== undefined ? { revalidate } : undefined,
    });

    if (response.status === 429) {
      lastError = new FMPError(429, 'Rate limited by FMP API', endpoint);
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
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
