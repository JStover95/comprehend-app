/**
 * Base error class for database bootstrap operations
 */
export class BootstrapError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "BootstrapError";
    Object.setPrototypeOf(this, BootstrapError.prototype);
  }
}

/**
 * Error thrown when schema operations fail
 */
export class SchemaError extends BootstrapError {
  constructor(
    message: string,
    cause?: Error
  ) {
    super(message, cause);
    this.name = "SchemaError";
    Object.setPrototypeOf(this, SchemaError.prototype);
  }
}

/**
 * Error thrown when database connection operations fail
 */
export class ConnectionError extends BootstrapError {
  constructor(
    message: string,
    cause?: Error
  ) {
    super(message, cause);
    this.name = "ConnectionError";
    Object.setPrototypeOf(this, ConnectionError.prototype);
  }
}

