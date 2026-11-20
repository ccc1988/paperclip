import type { ReactNode } from "react";
import { Link } from "@/lib/router";
import { useStreamlinedUiEnabled } from "@/hooks/useStreamlinedUiEnabled";
import { SKILLS_NAVIGATION_HREFS, type SkillsNavigationView } from "@/pages/skills/skills-navigation";
import { useTranslation } from "@/i18n";

const views = [
  { value: "installed", key: "installed" },
  { value: "discover", key: "discover" },
  { value: "authored", key: "authored" },
] as const;

/** Route navigation with the canonical tab appearance. Sources stays in the actions menu. */
export function SkillsNavigationTabs({ activeView }: { activeView: SkillsNavigationView }) {
  const { t } = useTranslation();
  return <nav aria-label={t("settingsPages.skills.views")} data-canonical-tabs="standard" className="canonical-tab-list">
    {views.map(view => <Link key={view.value} to={SKILLS_NAVIGATION_HREFS[view.value]}
      className="canonical-tab" data-state={activeView === view.value ? "active" : "inactive"}
      aria-current={activeView === view.value ? "page" : undefined}>{t(`settingsPages.skills.${view.key}`)}</Link>)}
  </nav>;
}

/** Standalone Skills pages share navigation beneath their own header controls. */
export function SkillsPageNavigation({ activeView, fallback = null }: { activeView: SkillsNavigationView; fallback?: ReactNode }) {
  const { enabled } = useStreamlinedUiEnabled();
  return enabled ? <div className="shrink-0 border-b border-border px-3 py-2"><SkillsNavigationTabs activeView={activeView} /></div> : fallback;
}
