import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (typeof err === "string") {
    const is404 = err.toLowerCase().endsWith("not found");
    res.status(is404 ? 404 : 400).json({ message: err });
    return;
  }

  if (err instanceof Error) {
    res.status(500).json({ message: err.message });
    return;
  }

  res.status(500).json({ message: "An unexpected error occurred" });
}