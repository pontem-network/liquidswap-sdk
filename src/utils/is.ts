import { AxiosError } from 'axios';

export function isAxiosError(e: any): e is AxiosError {
  if (e.isAxiosError) {
    return e;
  }

  return e;
}
