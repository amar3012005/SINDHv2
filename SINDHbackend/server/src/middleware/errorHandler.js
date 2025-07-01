const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle CastError for invalid ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: 'The provided ID is not valid'
    });
  }

  // Handle other errors
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
};

module.exports = errorHandler;
