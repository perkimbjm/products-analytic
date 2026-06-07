export interface Envelope<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    count?: number;
    offset?: number;
  };
}

export function successEnvelope<T>(data: T, meta?: Envelope<T>['meta']): Envelope<T> {
  return {
    success: true,
    data,
    meta,
  };
}

export function errorEnvelope(error: string): Envelope {
  return {
    success: false,
    error,
  };
}
