"use client";

import Link from "next/link";
import { useActionState, useEffect, useOptimistic, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatDate, type ActionState } from "@/lib/utils";
import { deleteTask, toggleTask } from "@/app/t/[tenant]/(app)/tasks/actions";
import { DeleteIconButton } from "./delete-button";

export type TaskRow = {
  id: string;
  title: string;
  done: boolean;
  dueAt: string | null;
  assignee?: string | null;
  link?: { href: string; label: string } | null;
};

function TaskItem({ task }: { task: TaskRow }) {
  const [optimisticDone, setDone] = useOptimistic(task.done);
  const [, start] = useTransition();
  const overdue = !optimisticDone && task.dueAt && new Date(task.dueAt) < new Date(new Date().toDateString());
  return (
    <li className="group flex items-start gap-3 py-2">
      <input
        type="checkbox"
        checked={optimisticDone}
        onChange={(e) => {
          const v = e.target.checked;
          start(async () => {
            setDone(v);
            await toggleTask(task.id, v);
          });
        }}
        className="mt-0.5 size-4 accent-[var(--primary)] cursor-pointer"
      />
      <div className="min-w-0 flex-1">
        <div className={cn("text-sm", optimisticDone && "text-muted-foreground line-through")}>{task.title}</div>
        <div className="text-xs text-muted-foreground">
          {task.dueAt && <span className={cn(overdue && "font-medium text-destructive")}>Due {formatDate(task.dueAt)}</span>}
          {task.assignee && <span> · {task.assignee}</span>}
          {task.link && (
            <>
              {" · "}
              <Link href={task.link.href} className="hover:underline">
                {task.link.label}
              </Link>
            </>
          )}
        </div>
      </div>
      <DeleteIconButton action={deleteTask.bind(null, task.id)} confirmText="Delete this task?" />
    </li>
  );
}

export function TaskList({ tasks, empty = "No tasks." }: { tasks: TaskRow[]; empty?: string }) {
  if (tasks.length === 0) return <p className="py-3 text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y">
      {tasks.map((t) => (
        <TaskItem key={t.id} task={t} />
      ))}
    </ul>
  );
}

export function TaskQuickAdd({
  action,
  placeholder,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  placeholder: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={formAction} className="flex gap-2">
      <Input name="title" placeholder={placeholder} required />
      <Input name="dueAt" type="date" className="w-40" />
      <Button type="submit" size="sm" className="h-9" disabled={pending}>
        Add
      </Button>
    </form>
  );
}
