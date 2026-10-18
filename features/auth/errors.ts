export class AuthError extends Error {
  readonly status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}
