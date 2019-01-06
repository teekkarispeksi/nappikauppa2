'use strict';

export async function to<T>(p: Promise<T>) {
  return p
    .then(data => [data, null])
    .catch(err => [null, err]);
}
