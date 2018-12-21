'use strict';

export async function to<T>(p: Promise<T>) {
  return p
    .then(data => [data, null])
    .catch(err => [null, err]);
}

export function reject(error: any) {
  return Promise.reject(error);
}

export function resolve(data: any) {
  return Promise.resolve(data);
}