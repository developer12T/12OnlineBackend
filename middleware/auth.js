exports.verifyToken = (req, res, next) => {
  const auth = req.headers['authorization'];

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Access denied. Missing token." });
  }

  req.accessToken = auth.split(' ')[1];
  next();
};