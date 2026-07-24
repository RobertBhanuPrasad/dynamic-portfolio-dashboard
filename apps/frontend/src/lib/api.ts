const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export class ApiClient {
  static async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Note: we can configure cache logic here later for the 15-second refresh requirement
      // For now, Next.js will default to its fetch caching behavior (force-cache or no-store)
      cache: 'no-store', 
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }
}
