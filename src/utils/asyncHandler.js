const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error),
    );
  };
};

export { asyncHandler };

// const asyncHandler = () => {}; normal
// const asyncHandler = (func) => () => {}; while calling inside
// const asyncHandler = (func) => async () => {}; while make it async

// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message || "Internal Server Error",
//     });
//   }
// };

// HigherOrderFunction: It is a function that accept function as a parameter or return a function as a result.
