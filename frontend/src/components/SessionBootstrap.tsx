import { useEffect, useState, type ReactNode } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setAccessToken, setUser } from "@/store/authSlice";
import { baseApi } from "@/store/baseApi";

export function SessionBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const apiUrl = import.meta.env.VITE_API_URL;

    void (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/auth/refresh`, { method: "POST", credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as { accessToken?: string };
          if (data.accessToken) dispatch(setAccessToken(data.accessToken));
        }
      } catch {
        /* network / cold start */
      }
      try {
        const me = await dispatch(baseApi.endpoints.getMe.initiate()).unwrap();
        dispatch(setUser(me.user));
      } catch {
        dispatch(setUser(null));
      }
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-muted">
        Connecting to API…
      </div>
    );
  }

  return <>{children}</>;
}
