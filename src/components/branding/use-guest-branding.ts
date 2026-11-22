"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { applyBrandColor, parseRememberedCompany, readRememberedCompanyRaw, type RememberedCompany } from "@/lib/brand-theme";
import { useGetCompanyBrandingQuery } from "@/store/api/auth.api";

export interface GuestBranding extends RememberedCompany {
  logoUrl: string | null;
}

/**
 * Branding for the login / sign-up / password pages, before anyone is signed in:
 * 1. ?company=<slug> in the URL (the link the platform gives each company), else
 * 2. the last company that signed in on this device.
 * Applies the colour and returns the name/logo to show. Needs a <Suspense> boundary (reads the URL).
 */
const noopSubscribe = () => () => undefined;

export function useGuestBranding(): GuestBranding | null {
  const slugFromUrl = useSearchParams().get("company")?.trim().toLowerCase() || "";
  // Read from localStorage after hydration (the server snapshot is "nothing remembered")
  const rememberedRaw = useSyncExternalStore(noopSubscribe, readRememberedCompanyRaw, () => null);
  const remembered: RememberedCompany | null = useMemo(() => parseRememberedCompany(rememberedRaw), [rememberedRaw]);
  const { data, isError } = useGetCompanyBrandingQuery(slugFromUrl, { skip: !slugFromUrl });

  const branding: GuestBranding | null =
    slugFromUrl && data?.data
      ? data.data
      : (!slugFromUrl || isError) && remembered
        ? { ...remembered, logoUrl: null }
        : null;

  useEffect(() => {
    applyBrandColor(branding?.brandColor);
  }, [branding?.brandColor]);

  return branding;
}
