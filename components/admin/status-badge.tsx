"use client";

import { Badge } from "@/components/ui/badge";
import type { ContentStatus } from "@/lib/mock/data";

interface StatusBadgeProps {
  status: ContentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "published":
      return (
        <Badge className="bg-success/20 text-success border-success/30 hover:bg-success/30">
          Published
        </Badge>
      );
    case "draft":
      return (
        <Badge className="bg-warning/20 text-warning border-warning/30 hover:bg-warning/30">
          Draft
        </Badge>
      );
    case "in_review":
      return (
        <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
          In Review
        </Badge>
      );
    case "archived":
      return (
        <Badge className="bg-muted text-muted-foreground border-muted hover:bg-muted/80">
          Archived
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
