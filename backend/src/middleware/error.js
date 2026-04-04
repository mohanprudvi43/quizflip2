export const notFound = (req, res, _next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (err, _req, res, _next) => {
  const isUploadError = err.name === "MulterError" || /Only PDF files are supported/i.test(err.message || "");
  const isEntityTooLarge = err.type === "entity.too.large" || err.status === 413;
  const status = err.status || (isEntityTooLarge ? 413 : isUploadError ? 400 : 500);
  const message =
    isEntityTooLarge
      ? "Payload is too large. Reduce image size or increase REQUEST_BODY_LIMIT on the server."
      : err.name === "MulterError" && err.code === "LIMIT_FILE_SIZE"
      ? "PDF file is too large. Maximum allowed size is 50MB."
      : err.message || "Server error";
  res.status(status).json({
    message
  });
};
