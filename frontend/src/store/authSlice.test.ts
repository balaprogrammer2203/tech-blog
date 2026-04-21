import authReducer, { clearAuth, setAccessToken, setCredentials, setUser } from "./authSlice";

describe("authSlice", () => {
  it("returns initial state for unknown actions", () => {
    expect(authReducer(undefined, { type: "@@unknown" })).toEqual({
      accessToken: null,
      user: null,
    });
  });

  it("setCredentials stores token and user", () => {
    const user = { id: "1", email: "a@b.com", name: "Ada", role: "user" as const };
    const next = authReducer(undefined, setCredentials({ accessToken: "tok", user }));
    expect(next.accessToken).toBe("tok");
    expect(next.user).toEqual(user);
  });

  it("setAccessToken updates only the token", () => {
    const user = { id: "1", email: "a@b.com", name: "Ada", role: "user" as const };
    const seeded = authReducer(undefined, setCredentials({ accessToken: "old", user }));
    const next = authReducer(seeded, setAccessToken("new"));
    expect(next.accessToken).toBe("new");
    expect(next.user).toEqual(user);
  });

  it("setUser updates only the user", () => {
    const u1 = { id: "1", email: "a@b.com", name: "Ada", role: "user" as const };
    const seeded = authReducer(undefined, setCredentials({ accessToken: "tok", user: u1 }));
    const next = authReducer(seeded, setUser({ ...u1, name: "Bob" }));
    expect(next.accessToken).toBe("tok");
    expect(next.user?.name).toBe("Bob");
  });

  it("clearAuth resets state", () => {
    const user = { id: "1", email: "a@b.com", name: "Ada", role: "user" as const };
    const seeded = authReducer(undefined, setCredentials({ accessToken: "tok", user }));
    expect(authReducer(seeded, clearAuth())).toEqual({ accessToken: null, user: null });
  });
});
