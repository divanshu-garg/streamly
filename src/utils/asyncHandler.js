const asyncHandler = (requestHandler) => {
  // console.log("async handler");
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      return next(err);
    });

  };
};

export { asyncHandler };