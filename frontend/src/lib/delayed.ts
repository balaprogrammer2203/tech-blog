/** Resolves after `ms` milliseconds (sample async helper for unit tests). */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function delayed<T>(value: T, ms: number): Promise<T> {
  await sleep(ms);
  return value;
}
