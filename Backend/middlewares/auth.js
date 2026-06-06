import jwt from "jsonwebtoken";

// Attaches req.user = { userId, username } to every protected request.
// userId is the string form of the MongoDB _id set during register/login.
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;   // { userId, username, iat, exp }
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid or expired token." });
    }
};

export default authMiddleware;