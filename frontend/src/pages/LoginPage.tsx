import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "@/store/baseApi";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading, error }] = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await login({ email, password }).unwrap();
    dispatch(setCredentials({ accessToken: res.accessToken, user: res.user }));
    navigate("/");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Sign in</h1>
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <div>
          <label className="block text-sm text-ink-muted" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-ink-muted" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">Invalid credentials.</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-ink py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-gray-100 dark:text-black"
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-sm text-ink-muted">
        No account?{" "}
        <Link className="underline" to="/register">
          Register
        </Link>
      </p>
    </div>
  );
}
