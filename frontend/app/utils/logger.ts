const isDevelopment = process.env.NODE_ENV !== "production"

type LogContext = Record<string, unknown> | undefined

function formatMessage(message: string, context?: LogContext) {
  if (!context || Object.keys(context).length === 0) {
    return [message] as const
  }

  return [message, context] as const
}

export const logger = {
  warn(message: string, context?: LogContext) {
    if (!isDevelopment) return
    console.warn(...formatMessage(message, context))
  },

  error(message: string, error?: unknown, context?: LogContext) {
    if (context && Object.keys(context).length > 0) {
      console.error(message, context, error)
      return
    }

    if (error !== undefined) {
      console.error(message, error)
      return
    }

    console.error(message)
  }
}
