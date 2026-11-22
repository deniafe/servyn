export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_STATE_TRANSITION"
  | "INVALID_MONEY"
  | "RATE_LIMITED"
  | "EXTERNAL_SERVICE_ERROR"
  | "INTERNAL_ERROR";

export interface SerializedAppError {
  readonly code: AppErrorCode;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly httpStatus: number;
  public readonly details?: Record<string, unknown>;

  public constructor(
    code: AppErrorCode,
    message: string,
    httpStatus = 400,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.httpStatus = httpStatus;
    if (details !== undefined) {
      this.details = details;
    }
  }

  public toJSON(): SerializedAppError {
    if (this.details !== undefined) {
      return {
        code: this.code,
        message: this.message,
        details: this.details,
      };
    }
    return {
      code: this.code,
      message: this.message,
    };
  }
}

export class InvalidMoneyError extends AppError {
  public constructor(message: string, details?: Record<string, unknown>) {
    super("INVALID_MONEY", message, 400, details);
  }
}
