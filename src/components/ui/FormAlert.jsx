const VARIANTS = {
  error: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  success:
    "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200",
  info: "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
};

export default function FormAlert({
  variant = "error",
  children,
  className = "",
  ...rest
}) {
  if (!children) {
    return null;
  }

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-lg border px-3 py-2 text-sm ${
        VARIANTS[variant] || VARIANTS.info
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
