export const validate = (schema, source = "body") => (req, res, next) => {
  const payload = req[source];
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation failed",
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
    });
  }

  req[source] = parsed.data;
  return next();
};
