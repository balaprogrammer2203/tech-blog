import type { ReactNode } from "react";
import { HomeSidebar } from "@/components/HomeSidebar";

/** Main column + right rail (Popular, Categories, Newsletter), same grid as the home page. */
export function SplitPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-12">
      <div className="min-w-0">{children}</div>
      <div className="mt-12 min-w-0 lg:mt-0">
        <HomeSidebar />
      </div>
    </div>
  );
}
