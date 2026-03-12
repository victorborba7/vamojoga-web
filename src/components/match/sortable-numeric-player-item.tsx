"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Minus, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

interface SortableNumericPlayerItemProps {
  id: string;
  username: string;
  position: number;
  score: number;
  onScoreChange: (newScore: number) => void;
}

function getPositionColor(position: number): string {
  if (position === 1) return "text-yellow-400";
  if (position === 2) return "text-neutral-300";
  if (position === 3) return "text-amber-600";
  return "text-neutral-500";
}

export function SortableNumericPlayerItem({
  id,
  username,
  position,
  score,
  onScoreChange,
}: SortableNumericPlayerItemProps) {
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => onScoreChange(Math.max(0, score - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              <Minus className="h-3 w-3" />
            </button>
            <input
              type="number"
              min={0}
              value={score}
              onChange={(e) => onScoreChange(Math.max(0, parseInt(e.target.value) || 0))}
              className="text-lg font-bold text-foreground w-12 text-center bg-transparent border-b-2 border-neutral-700 focus:border-primary-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => onScoreChange(score + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white hover:bg-primary-500 transition-colors cursor-pointer"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
