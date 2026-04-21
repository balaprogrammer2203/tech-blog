/** Example async test using `fetch` (mocked). */
async function responseOk(url: string): Promise<boolean> {
  const res = await fetch(url);
  return res.ok;
}

describe("responseOk (async + fetch mock)", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns true when fetch resolves with ok", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true } as Response);
    await expect(responseOk("http://example.test/ping")).resolves.toBe(true);
  });

  it("returns false when fetch resolves with not ok", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false } as Response);
    await expect(responseOk("http://example.test/missing")).resolves.toBe(false);
  });
});
