import "@testing-library/jest-dom/jest-globals";

const warn = console.warn;
jest.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
  const first = String(args[0] ?? "");
  if (first.includes("fetch") && first.includes("not available")) return;
  warn.apply(console, args as Parameters<typeof console.warn>);
});
