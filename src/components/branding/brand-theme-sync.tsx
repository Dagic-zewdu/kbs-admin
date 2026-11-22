"use client";

import { useEffect } from "react";
import { applyBrandColor, rememberCompany } from "@/lib/brand-theme";
import { useAppSelector } from "@/store/hooks";

/** Inside the signed-in area: theme the site with the admin's company colour and remember it for the login page. */
export function BrandThemeSync() {
  const company = useAppSelector((state) => state.auth.user?.company);

  useEffect(() => {
    applyBrandColor(company?.brandColor);
    if (company) rememberCompany(company);
  }, [company]);

  return null;
}
