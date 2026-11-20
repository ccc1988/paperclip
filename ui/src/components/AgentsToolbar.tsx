import type { ReactNode, Ref } from "react";
import { List, Network, Plus } from "lucide-react";
import { ToolbarSearch } from "./ToolbarSearch";
import { Button } from "./ui/button";
import { OrgChartControls, type OrgChartActions } from "./OrgChartControls";
import { getLocale } from "@/i18n";

export interface AgentsToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  view: "list" | "org";
  onViewChange: (value: "list" | "org") => void;
  hideViewToggle?: boolean;
  onNewAgent: () => void;
  filters?: ReactNode;
  orgControlsRef?: Ref<HTMLDivElement>;
  orgActions?: OrgChartActions;
}

/** Shared roster search, view controls and actions for the page and stories. */
export function AgentsToolbar({ query, onQueryChange, view, onViewChange, hideViewToggle, onNewAgent, filters, orgControlsRef, orgActions }: AgentsToolbarProps) {
  const zh = getLocale() === "zh-CN";
  return <div data-canonical-toolbar="agents" role="toolbar" aria-label={zh ? "Agent 操作" : "Agents controls"} className="flex flex-wrap items-center gap-3">
    <div className="design-toolbar-controls flex w-full flex-wrap items-center gap-4">
      <ToolbarSearch query={query} onQueryChange={onQueryChange} label={zh ? "搜索 Agent" : "Search agents"} placeholder={zh ? "搜索 Agent…" : "Search agents…"} />
      {!hideViewToggle && <div className="design-view-toggle" role="group" aria-label={zh ? "Agent 视图" : "Agent view"}>
          <Button type="button" size="icon-sm" variant={view === "list" ? "secondary" : "ghost"} className="design-toolbar-icon" onClick={() => onViewChange("list")} title={zh ? "列表视图" : "List view"} aria-label={zh ? "列表视图" : "List view"} aria-pressed={view === "list"}><List aria-hidden /></Button>
          <Button type="button" size="icon-sm" variant={view === "org" ? "secondary" : "ghost"} className="design-toolbar-icon" onClick={() => onViewChange("org")} title={zh ? "组织架构视图" : "Org chart view"} aria-label={zh ? "组织架构视图" : "Org chart view"} aria-pressed={view === "org"}><Network aria-hidden /></Button>
      </div>}
      {filters}
      <div className="design-toolbar-actions">
        {orgActions && (
          <div ref={orgControlsRef} data-org-toolbar-controls className="agents-org-controls-reveal"
            data-visible={view === "org"} aria-hidden={view !== "org"} inert={view !== "org"}>
            <div className="min-w-0 overflow-hidden"><OrgChartControls {...orgActions} /></div>
          </div>
        )}
        <Button size="sm" variant="outline" data-toolbar-primary onClick={onNewAgent}><Plus aria-hidden />{zh ? "新建 Agent" : "New Agent"}</Button>
      </div>
    </div>
  </div>;
}
