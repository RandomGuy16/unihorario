import { ReactNode} from "react";
import { AnimatePresence, motion } from "motion/react";


interface BooleanFilterToggleProps {
  title: string;
  description: string;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  value: boolean;
  onValueChange: (value: boolean) => void;
  trueLabel: string;
  falseLabel: string;
  icon: ReactNode;
}

export function BooleanFilterToggle({
                                      title,
                                      description,
                                      enabled,
                                      onEnabledChange,
                                      value,
                                      onValueChange,
                                      trueLabel,
                                      falseLabel,
                                      icon
                                    }: BooleanFilterToggleProps) {
  return (
    <div className="w-full flex flex-col justify-center items-center gap-2">
      <div className={'flex flex-row justify-between items-center w-full transition-all duration-200 ease-out'}>
        <div className="flex flex-row flex-1 items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            {icon}
          </div>
          <div className="flex flex-col justify-start items-start">
            <div className="flex flex-row items-center gap-2">
              <span className="text-label font-semibold text-foreground">{title}</span>
              {enabled && (
                <span
                  className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-micro uppercase tracking-[0.18em] text-accent">
              activo
            </span>
              )}
            </div>
            <p className="mt-1 text-body text-foreground-muted">{description}</p>
          </div>
        </div>
        <div className={'flex flex-row justify-center items-center gap-2 h-full'}>
          <button
            type="button"
            aria-pressed={enabled}
            aria-label={`Alternar filtro ${title}`}
            onClick={() => onEnabledChange(!enabled)}
            className={`relative h-7 w-12 shrink-0 rounded-full border transition-all duration-200 ease-out ${
              enabled
                ? "border-accent bg-accent shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
                : "border-border-strong bg-surface-muted"
            }`}
          >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-200 ease-out ${
              enabled ? "left-[1.45rem]" : "left-0.5"
            }`}
          />
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            key="filter-options"
            initial={{opacity: 0, height: 0, y: -6}}
            animate={{opacity: 1, height: "auto", y: 0}}
            exit={{opacity: 0, height: 0, y: -6}}
            transition={{duration: 0.2, ease: "easeOut"}}
            className="w-full overflow-hidden"
          >
            <div className="flex flex-row justify-center items-center gap-2 w-full pt-1">
              <button
                type="button"
                onClick={() => onValueChange(true)}
                className={`flex-1 rounded-lg border px-3 text-body font-medium transition-colors duration-150 ${
                  value
                    ? "border-accent bg-accent text-on-action"
                    : "border-border bg-surface-muted text-foreground-muted"
                }`}
              >
                {trueLabel}
              </button>
              <button
                type="button"
                onClick={() => onValueChange(false)}
                className={`flex-1 rounded-lg border px-3 text-body font-medium transition-colors duration-150 ${
                  !value
                    ? "border-accent-secondary bg-accent-secondary/15 text-foreground"
                    : "border-border bg-surface-muted text-foreground-muted"
                }`}
              >
                {falseLabel}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}