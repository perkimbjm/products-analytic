export class AppError extends Error {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    public statusCode: number,
    public message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class BadRequest extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = 'BadRequest';
  }
}

export class NotFound extends AppError {
  constructor(message: string = 'Not found') {
    super(404, message);
    this.name = 'NotFound';
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, message);
    this.name = 'InternalError';
  }
}
