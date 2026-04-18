import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterMutation } from "@/store/baseApi";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [register, { isLoading, error }] = useRegisterMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await register({ name, email, password }).unwrap();
    dispatch(setCredentials({ accessToken: res.accessToken, user: res.user }));
    navigate("/");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Create account</h1>
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <div>
          <label className="block text-sm text-ink-muted" htmlFor="name">
            Display name
          </label>
          <input
            id="name"
            required
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
            Password (min 8)
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">Could not register (email may be taken).</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-ink py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-gray-100 dark:text-black"
        >
          {isLoading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="text-sm text-ink-muted">
        Already have an account?{" "}
        <Link className="underline" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
