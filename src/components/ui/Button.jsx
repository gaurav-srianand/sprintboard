const VARIANTS = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-700 focus-visible:outline-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:focus-visible:outline-zinc-100",
  secondary:
    "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 focus-visible:outline-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:outline-zinc-500",
  danger:
    "bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600 dark:bg-red-600 dark:text-white dark:hover:bg-red-500",
};

const SIZES = {
  md: "h-11 px-4 text-sm",
  sm: "h-9 px-3 text-sm",
};

export default function Button({
  type = "button",
  children,
  pending = false,
  pendingLabel = "Please wait…",
  disabled = false,
  fullWidth = true,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}) {
  const variantClass = VARIANTS[variant] || VARIANTS.primary;
  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`inline-flex ${
        fullWidth ? "w-full" : "w-auto"
      } ${sizeClass} items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className}`}
      {...rest}
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
