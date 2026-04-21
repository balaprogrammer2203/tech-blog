import { delayed, sleep } from "./delayed";

describe("delayed (async)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("sleep resolves after the given delay", async () => {
    const p = sleep(1000);
    jest.advanceTimersByTime(1000);
    await expect(p).resolves.toBeUndefined();
  });

  it("delayed returns the value after waiting", async () => {
    const p = delayed({ ok: true }, 500);
    jest.advanceTimersByTime(500);
    await expect(p).resolves.toEqual({ ok: true });
  });
});
