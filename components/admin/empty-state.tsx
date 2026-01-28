"use client";

import { Plus, Search, FileQuestion, Inbox, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: "search" | "inbox" | "file" | "sparkles";
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled = false,
}: EmptyStateProps) {
  const IconComponent = {
    search: Search,
    inbox: Inbox,
    file: FileQuestion,
    sparkles: Sparkles,
  }[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Decorative background circles */}
      <div className="relative mb-8">
        <div className="absolute inset-0 -m-8 rounded-full bg-primary/5 blur-2xl" />
        <div className="absolute inset-0 -m-4 rounded-full bg-accent/5 blur-xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border border-primary/20">
          <IconComponent className="h-10 w-10 text-primary/70" />
        </div>
      </div>

      {/* Text content */}
      <h3 className="text-xl font-semibold text-foreground mb-2 text-center">{title}</h3>
      <p className="text-muted-foreground text-center max-w-sm mb-6">{description}</p>

      {/* Action button */}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          disabled={actionDisabled}
          className="rounded-xl bg-primary hover:bg-primary/90 gap-2"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}

      {/* Decorative dots pattern */}
      <div className="mt-12 flex gap-1.5 opacity-30">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary"
            style={{
              opacity: 1 - i * 0.15,
              transform: `scale(${1 - i * 0.1})`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// No search results variant
export function EmptySearchState({ query }: { query: string }) {
  return (
    <EmptyState
      icon="search"
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search term.`}
    />
  );
}

// No data variant
export function EmptyDataState({
  contentType,
  onAction,
  actionDisabled,
}: {
  contentType: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}) {
  return (
    <EmptyState
      icon="inbox"
      title={`No ${contentType} yet`}
      description={`Get started by creating your first ${contentType.toLowerCase()}. It only takes a few minutes.`}
      actionLabel={`Create ${contentType}`}
      onAction={onAction}
      actionDisabled={actionDisabled}
    />
  );
}

// Filtered empty state
export function EmptyFilterState({ onClear }: { onClear?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 -m-8 rounded-full bg-primary/5 blur-2xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary/50 via-secondary/30 to-muted/30 border border-border/30">
          <Search className="h-10 w-10 text-muted-foreground/50" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
        No matching items
      </h3>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        Your current filters don&apos;t match any items. Try adjusting your filters or search query.
      </p>
      {onClear && (
        <Button
          onClick={onClear}
          variant="outline"
          className="rounded-xl bg-transparent"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}
