import { Context } from 'hono';
import { ApiResponse } from '../types';

export function jsonSuccess<T>(
  c: Context,
  data: T,
  meta?: ApiResponse['meta'],
  status: 200 | 201 = 200
) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {})
  };
  return c.json(response, status);
}

export function jsonError(
  c: Context,
  error: string,
  status: 400 | 401 | 403 | 404 | 409 | 422 | 500 = 400
) {
  const response: ApiResponse = {
    success: false,
    error
  };
  return c.json(response, status);
}
