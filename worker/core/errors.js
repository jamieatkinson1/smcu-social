export class OperationalError extends Error {
  constructor(code, message, { status = 400, retryable = false, recovery = "Review the communication and try again." } = {}) {
    super(message); this.name = "OperationalError"; this.code = code; this.status = status; this.retryable = retryable; this.recovery = recovery;
  }
}
export const safeError = (error) => error instanceof OperationalError
  ? { code:error.code, message:error.message, recovery:error.recovery, retryable:error.retryable, status:error.status }
  : { code:"INTERNAL_ERROR", message:"The publishing request could not be completed.", recovery:"Try again. If it continues, check Settings.", retryable:true, status:500 };

