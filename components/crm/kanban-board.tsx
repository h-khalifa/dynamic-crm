"use client";

import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { Badge } from "@/components/ui/card";
import { cn, formatMoney } from "@/lib/utils";

export type KanbanStage = { id: string; name: string; color: string; probability: number };
export type KanbanCard = { id: string; title: string; value: number; stageId: string; subtitle?: string; meta?: string };

function Card({ card }: { card: KanbanCard }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn(
        "cursor-grab touch-none rounded-md border bg-card p-3 shadow-sm active:cursor-grabbing",
        isDragging && "z-50 opacity-80 shadow-lg ring-2 ring-primary",
      )}
    >
      <Link href={`/deals/${card.id}`} className="text-sm font-medium hover:underline" onPointerDown={(e) => e.stopPropagation()}>
        {card.title}
      </Link>
      {card.subtitle && <div className="mt-0.5 truncate text-xs text-muted-foreground">{card.subtitle}</div>}
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-medium">{formatMoney(card.value)}</span>
        {card.meta && <span className="text-muted-foreground">{card.meta}</span>}
      </div>
    </div>
  );
}

function Column({ stage, cards }: { stage: KanbanStage; cards: KanbanCard[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = cards.reduce((s, c) => s + c.value, 0);
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/60">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Badge color={stage.color}>{stage.name}</Badge>
          <span className="text-xs text-muted-foreground">{cards.length}</span>
        </div>
        <span className="text-xs text-muted-foreground">{formatMoney(total)}</span>
      </div>
      <div ref={setNodeRef} className={cn("flex min-h-32 flex-1 flex-col gap-2 p-2 transition-colors", isOver && "rounded-b-lg bg-accent")}>
        {cards.map((c) => (
          <Card key={c.id} card={c} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({
  stages,
  cards,
  onMove,
}: {
  stages: KanbanStage[];
  cards: KanbanCard[];
  onMove: (cardId: string, stageId: string) => Promise<void>;
}) {
  const [optimistic, move] = useOptimistic(cards, (state, { id, stageId }: { id: string; stageId: string }) =>
    state.map((c) => (c.id === id ? { ...c, stageId } : c)),
  );
  const [, start] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(e: DragEndEvent) {
    const id = String(e.active.id);
    const stageId = e.over ? String(e.over.id) : null;
    const card = optimistic.find((c) => c.id === id);
    if (!stageId || !card || card.stageId === stageId) return;
    start(async () => {
      move({ id, stageId });
      await onMove(id, stageId);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((s) => (
          <Column key={s.id} stage={s} cards={optimistic.filter((c) => c.stageId === s.id)} />
        ))}
      </div>
    </DndContext>
  );
}
