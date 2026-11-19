import { Inbox, ShieldCheck } from "lucide-react";
import { t } from "@/i18n";

export const APP_TABS = [
  { key: "permissions", labelKey: "connectionsPage.appTabs.permissions", icon: ShieldCheck },
  { key: "review", labelKey: "connectionsPage.appTabs.review", icon: Inbox },
] as const;

export type AppTabKey = (typeof APP_TABS)[number]["key"];

export function appTabHref(connectionId: string, tab: AppTabKey): string {
  return `/apps/${connectionId}/${tab}`;
}

export function appApplicationTabHref(applicationId: string, tab: AppTabKey): string {
  return `/apps/app/${applicationId}/${tab}`;
}

export function isAppTabKey(value: string | undefined): value is AppTabKey {
  return APP_TABS.some((tab) => tab.key === value);
}

export function appTabLabel(tabKey: AppTabKey): string {
  const tab = APP_TABS.find((candidate) => candidate.key === tabKey);
  return tab ? t(tab.labelKey) : t("connectionsPage.appTabs.permissions");
}
