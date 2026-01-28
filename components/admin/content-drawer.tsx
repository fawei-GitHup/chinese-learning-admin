"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ContentType } from "@/lib/content-types";
import { contentTypeSchema } from "@/lib/content-types";
import { toast } from "sonner";

interface ContentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  isNew?: boolean;
  disabled?: boolean;
  contentType?: ContentType;
}

export function ContentDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSave,
  onCancel,
  saveLabel,
  isNew = false,
  disabled = false,
  contentType,
}: ContentDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-2xl glass-card border-l border-border/50 p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-semibold text-foreground">{title}</SheetTitle>
              {description && (
                <SheetDescription className="text-muted-foreground mt-1">
                  {description}
                </SheetDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={onCancel}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1 px-6">
          <div className="py-6 space-y-6">
            {children}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-border/50 flex items-center justify-end gap-3 shrink-0 bg-background/50">
          <Button
            variant="outline"
            onClick={onCancel}
            className="rounded-xl bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={() => { if (contentType) { const result = contentTypeSchema.safeParse(contentType); if (!result.success) { toast.error("Invalid content type"); return; } } onSave(); }}
            className="rounded-xl bg-primary hover:bg-primary/90"
            disabled={disabled}
          >
            {saveLabel || (isNew ? "Create" : "Save Changes")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
