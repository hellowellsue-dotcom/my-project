export type AppMode = "dark" | "light";

export function getMode(): AppMode {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("app_mode") as AppMode) ?? "dark";
}

export function setMode(mode: AppMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("app_mode", mode);
}
