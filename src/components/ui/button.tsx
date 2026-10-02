import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium select-none whitespace-nowrap rounded-md min-h-11 min-w-11 transition-[transform,background-color,color,box-shadow,opacity] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-45 active:not-disabled:scale-[0.96]",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_1px_2px_rgba(26,107,99,0.28)] hover:bg-accent-hover",
        secondary:
          "bg-surface text-fg shadow-card hover:shadow-card-hover hover:bg-surface-2",
        ghost:
          "bg-transparent text-muted hover:text-fg hover:bg-surface-2",
        danger:
          "bg-danger-soft text-danger hover:opacity-90",
        outline:
          "bg-transparent text-fg shadow-[0_0_0_1px_var(--sf-border-strong)] hover:bg-surface-2",
      },
      size: {
        default: "px-4 py-2.5 text-sm",
        lg: "px-5 py-3 text-[0.95rem] rounded-lg",
        sm: "px-3 py-2 text-sm min-h-10 rounded-sm",
        icon: "p-0 size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  staticPress?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, staticPress, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        buttonVariants({ variant, size }),
        staticPress && "active:not-disabled:scale-100",
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
