import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-surface-2 text-muted">
        {icon}
      </div>
      <h3 className="text-xl text-fg mb-2">{title}</h3>
      <p className="text-muted max-w-sm mb-8 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}
