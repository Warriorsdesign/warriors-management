import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: err.message, code: err.code, details: err.details },
      { status: err.status }
    );
  }

  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: err.flatten() },
      { status: 400 }
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Duplicate value', code: 'UNIQUE_CONSTRAINT' }, { status: 409 });
    }
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Resource not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    if (err.code === 'P2003') {
      return NextResponse.json(
        { error: 'Resource is referenced by other records', code: 'FK_CONSTRAINT' },
        { status: 409 }
      );
    }
  }

  console.error(err);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
