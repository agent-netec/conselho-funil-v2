export type ParsedJson<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function parseJsonBody<T>(request: Request): Promise<ParsedJson<T>> {
  try {
    const data = (await request.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'JSON inválido ou corpo ausente' };
  }
}
