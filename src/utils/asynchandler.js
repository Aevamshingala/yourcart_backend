const asynchandler = (requesthandeler) => {
  return (req, res, next) => {
    Promise.resolve(requesthandeler(req, res, next)).catch((error) =>
      next(error)
    );
  };
};

export { asynchandler };
