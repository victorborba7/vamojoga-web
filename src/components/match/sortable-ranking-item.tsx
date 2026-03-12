"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

interface SortableRankingItemProps {
  id: string;
  username: string;
  position: number;
}

function getPositionColor(position: number): string {
  if (position === 1) return "text-yellow-400";
  if (position === 2) return "text-neutral-300";
  if (position === 3) return "text-amber-600";
  return "text-neutral-500";
}

export function SortableRankingItem({ id, username, position }: SortableRankingItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? ("relative" as const) : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-3!">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="touch-none cursor-grab active:cursor-grabbing text-neutral-500 hover:text-foreground p-0.5 shrink-0"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <span className={`text-sm font-bold w-6 text-center shrink-0 ${getPositionColor(position)}`}>
            {position}º
          </span>
          <Avatar name={username} size="sm" />
          <span className="text-sm text-foreground font-medium flex-1 truncate">
            {username}
          </span>
          {position === 1 && <Trophy className="h-4 w-4 text-yellow-400 shrink-0" />}
        </div>
      </Card>
    </div>
  );
}
