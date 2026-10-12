// Error with an HTTP status whose message is safe to show to the client
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.expose = true;
    if (details) this.details = details;
  }
}

module.exports = HttpError;
