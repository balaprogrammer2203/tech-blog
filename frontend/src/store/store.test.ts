import { setCredentials } from "./authSlice";
import { setupStore } from "./store";

describe("Redux store (integration)", () => {
  it("dispatched actions update auth slice", () => {
    const s = setupStore();
    const user = { id: "1", email: "a@b.com", name: "Ada", role: "user" as const };
    s.dispatch(setCredentials({ accessToken: "jwt", user }));
    expect(s.getState().auth).toEqual({ accessToken: "jwt", user });
  });
});
