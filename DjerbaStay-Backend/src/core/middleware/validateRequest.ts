import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

export const validateBody = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsedBody = schema.safeParse(req.body);

    if (!parsedBody.success) {
      const message = parsedBody.error.issues
        .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
        .join("; ");

      res.status(400).json({ error: message });
      return;
    }

    req.body = parsedBody.data;
    next();
  };
};
