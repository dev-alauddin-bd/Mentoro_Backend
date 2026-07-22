import { NextFunction, Request, Response } from "express";
import { CustomAppError } from "../errors/customError";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { MulterError } from "multer";
import { JsonWebTokenError, TokenExpiredError, NotBeforeError } from "jsonwebtoken";
import logger from "../../lib/logger";

const isDev = process.env.NODE_ENV === "development";

const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
   
  _next: NextFunction
) => {
  console.log(err)
  let statusCode = 500;
  let message = "Something went wrong!";
  let errorSources: { path: string; message: string }[] = [
    {
      path: "",
      message: isDev
        ? (err as Error).message || "Internal Server Error"
        : "Internal Server Error",
    },
  ];
  // Log every error internally (never exposed to client)
  logger.error(
    `Global error handler caught an error | Method: ${req.method} | URL: ${req.originalUrl} | Error: ${
      err instanceof Error ? err.stack || err.message : JSON.stringify(err)
    }`
  );

  // ========================
  // 1. Custom Application Error
  // ========================
  if (err instanceof CustomAppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [{ path: "", message: err.message }];
  }

  // ========================
  // 2. Zod Validation Error
  // ========================
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    errorSources = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  }

  // ========================
  // 3. JWT — Token Expired
  // ========================
  else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = "Session expired. Please log in again.";
    errorSources = [{ path: "token", message }];
  }

  // ========================
  // 4. JWT — Invalid Token
  // ========================
  else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid or malformed token.";
    errorSources = [{ path: "token", message }];
  }

  // ========================
  // 5. JWT — Not Before Error
  // ========================
  else if (err instanceof NotBeforeError) {
    statusCode = 401;
    message = "Token not yet active.";
    errorSources = [{ path: "token", message }];
  }

  // ========================
  // 6. Multer File Upload Error
  // ========================
  else if (err instanceof MulterError) {
    statusCode = 400;

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File is too large. Please upload a smaller file.";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "Too many files uploaded at once.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = `Unexpected file field: "${err.field}".`;
    } else {
      message = `File upload error: ${err.message}`;
    }

    errorSources = [{ path: err.field || "file", message }];
  }

  // ========================
  // 7. Malformed JSON Body (SyntaxError from express.json())
  // ========================
  else if (err instanceof SyntaxError && "body" in err) {
    statusCode = 400;
    message = "Malformed JSON in request body.";
    errorSources = [{ path: "body", message }];
  }

  // ========================
  // 8. Prisma Known Request Error
  // ========================
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;

    // Unique constraint violation (e.g., duplicate email)
    if (err.code === "P2002") {
      const field = (err.meta?.target as string[])?.join(", ") || "field";
      message = `Duplicate value: ${field} already exists.`;
      errorSources = [{ path: field, message }];
    }
    // Record not found
    else if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found.";
      errorSources = [{ path: "", message }];
    }
    // Foreign key constraint failure
    else if (err.code === "P2003") {
      message = "A related record is missing or restricted.";
      errorSources = [{ path: "", message }];
    }
    // Required field missing
    else if (err.code === "P2011") {
      const field = (err.meta?.constraint as string) || "field";
      message = `Required field missing: ${field}.`;
      errorSources = [{ path: field, message }];
    }
    // Value out of range
    else if (err.code === "P2006") {
      message = "One or more field values are invalid.";
      errorSources = [{ path: "", message }];
    } else {
      message = isDev ? `Database Error: ${err.message}` : "Database operation failed.";
      errorSources = [{ path: err.code || "", message }];
    }
  }

  // ========================
  // 9. Prisma Validation Error
  // ========================
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid data provided. Check your fields.";
    errorSources = [
      {
        path: "",
        message: isDev ? err.message : "Invalid data provided.",
      },
    ];
  }

  // ========================
  // 10. Prisma Connection Error
  // ========================
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = "Service temporarily unavailable. Please try again later.";
    errorSources = [
      {
        path: "",
        message: isDev ? err.message : "Database connection failed.",
      },
    ];
  }

  // ========================
  // 11. Prisma Rust Panic (catastrophic DB error)
  // ========================
  else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 503;
    message = "A critical database error occurred. Please try again later.";
    errorSources = [{ path: "", message }];
  }

  // ========================
  // 12. TypeError / RangeError (unhandled programming errors)
  // ========================
  else if (err instanceof TypeError || err instanceof RangeError) {
    statusCode = 500;
    message = isDev ? (err as Error).message : "Internal server error.";
    errorSources = [{ path: "", message }];
  }

  // console.log(message)
  // console.log(statusCode)
  // console.log(errorSources)
  // ========================
  // Final Response
  // ========================
  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    // Only include stack trace in development
    ...(isDev && { stack: (err as Error).stack }),
  });
};

export default globalErrorHandler;
