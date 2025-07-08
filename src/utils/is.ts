import { AxiosError } from 'axios';

export function isAxiosError(e: unknown): e is AxiosError {
  return (e as AxiosError).isAxiosError === true;
}
