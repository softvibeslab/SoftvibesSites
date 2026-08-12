"use client";

interface SuccessEnvelope<T> {
  readonly ok: true;
  readonly data: T;
}

interface ErrorEnvelope {
  readonly ok: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
}

type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

export class ApiClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  csrfToken?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (csrfToken !== undefined) {
    headers.set("x-csrf-token", csrfToken);
  }

  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    headers,
  });
  if (response.status === 204) {
    return undefined as T;
  }

  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiClientError(
      "INVALID_RESPONSE",
      "El servidor devolvió una respuesta inesperada.",
      response.status,
    );
  }

  if (!response.ok || !envelope.ok) {
    const error = envelope.ok
      ? { code: "REQUEST_FAILED", message: "La operación no pudo completarse." }
      : envelope.error;
    throw new ApiClientError(error.code, error.message, response.status);
  }
  return envelope.data;
}
