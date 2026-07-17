/**
 * Zod-based validation middleware factory.
 * Validates req.body (and optionally req.params / req.query) against a Zod schema.
 * Rejects with 400 and a clear error if validation fails — prevents bad input
 * from ever reaching controllers or Mongoose (guards against NoSQL injection).
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (!result.success) {
    const errList = result.error.errors || result.error.issues || [];
    const errors = errList.map((e) => ({
      field: e.path ? e.path.join(".") : "unknown",
      message: e.message
    }));

    return res.status(400).json({
      message: "Validation failed",
      errors
    });
  }

  // Replace parsed (coerced/stripped) values back onto req
  if (result.data.body) req.body = result.data.body;
  if (result.data.params) req.params = result.data.params;
  if (result.data.query) req.query = result.data.query;

  return next();
};

export default validate;
