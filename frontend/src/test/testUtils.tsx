import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { Provider } from "react-redux";
import { setupStore, type AppStore, type RootState } from "@/store/store";

type Extra = { preloadedState?: Partial<RootState>; store?: AppStore };

export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, store = setupStore(preloadedState), ...options }: Extra & Omit<RenderOptions, "wrapper"> = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...options }) };
}
