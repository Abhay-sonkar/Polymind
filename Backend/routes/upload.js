// Backend/routes/upload.js
//
// Receives a file from the browser (multipart/form-data), holds it in
// memory briefly (multer memoryStorage — no temp file on disk to clean
// up), then forwards the bytes to the Python RAG service's /upload
// endpoint along with the authenticated user's id.
//
// This is the missing link: without this route, the frontend has
// nothing to call, and Backend/utils/ragService.js's uploadDocument()
// (written earlier) is unreachable from the browser.

import express from "express";
import multer from "multer";
import authMiddleware from "../middlewares/auth.js";
import { uploadDocument } from "../utils/ragService.js";

const router = express.Router();

// 10MB cap — generous for resumes/notes/reports, stops someone from
// accidentally (or deliberately) uploading something huge that stalls
// extraction or blows past your free-tier RAM budget.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(authMiddleware);

router.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
    }

    const allowedExtensions = ["pdf", "docx", "txt", "md"];
    const ext = req.file.originalname.toLowerCase().split(".").pop();
    if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({
            error: `Unsupported file type: .${ext}. Use PDF, DOCX, TXT, or MD.`,
        });
    }

    try {
        const result = await uploadDocument(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            req.user.userId   // same JWT-derived id used everywhere else — never trust a client-supplied id
        );

        res.status(201).json(result);

    } catch (err) {
        console.error("Upload error:", err.message);
        res.status(502).json({ error: "Failed to index document. Try again shortly." });
    }
});

export default router;
