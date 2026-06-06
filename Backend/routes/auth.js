import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
    const {username, email, password} = req.body;

    if(!username || !email || !password) {
        return res.status(400).json({error: "All fields are required"});
    }

    try {
        // ✅ FIX — Check BOTH email AND username for duplicates in one query.
        // THE BUG (old code): only checked email → if username was already taken,
        // User.save() threw a MongoDB E11000 duplicate key error which the catch
        // block swallowed as a generic 500 "Registration failed". The user saw a
        // vague error with no idea what was wrong.
        const existingUser = await User.findOne({ $or: [{email}, {username}] });
        if(existingUser) {
            if(existingUser.email === email) {
                return res.status(400).json({error: "Email already registered"});
            }
            return res.status(400).json({error: "Username already taken"});
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = new User({username, email, password: hashedPassword});
        await user.save();

        // Generate token
        const token = jwt.sign(
            {userId: user._id, username: user.username},
            process.env.JWT_SECRET,
            {expiresIn: "7d"}
        );

        res.status(201).json({
            token,
            user: {id: user._id, username: user.username, email: user.email}
        });

    } catch(err) {
        console.error("Register error:", err.message);

        // ✅ FIX — Fallback handler for E11000 duplicate key errors.
        // Covers race conditions where two requests pass the pre-check above
        // simultaneously and one of them loses the unique-index race in MongoDB.
        if(err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({
                error: field === "email" ? "Email already registered" : "Username already taken"
            });
        }

        res.status(500).json({error: "Registration failed"});
    }
});

// Login
router.post("/login", async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password) {
        return res.status(400).json({error: "All fields are required"});
    }

    try {
        // Find user
        const user = await User.findOne({email});
        if(!user) {
            return res.status(400).json({error: "Invalid email or password"});
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({error: "Invalid email or password"});
        }

        // Generate token
        const token = jwt.sign(
            {userId: user._id, username: user.username},
            process.env.JWT_SECRET,
            {expiresIn: "7d"}
        );

        res.json({
            token,
            user: {id: user._id, username: user.username, email: user.email}
        });

    } catch(err) {
        console.error("Login error:", err.message);
        res.status(500).json({error: "Login failed"});
    }
});

export default router;