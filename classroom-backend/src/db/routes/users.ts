import express from "express";
import { user } from "../schema/index.js";
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { db } from "../../index.js";

const router = express.Router();

// Get all users with optional search, filtering by role, and pagination
router.get("/", async (req, res) => {
    try {
        const { search, role, page = 1, limit = 100 } = req.query;

        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.max(Math.min(parseInt(String(limit), 10) || 100, 100), 1); // max 100 records per page

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        // If search query exists, filter by user name or email
        if (search) {
            filterConditions.push(
                or(
                    ilike(user.name, `%${search}%`),
                    ilike(user.email, `%${search}%`)
                )
            );
        }

        // If role filter exists, filter by role (e.g., 'teacher', 'student', 'admin')
        if (role) {
            filterConditions.push(eq(user.role, String(role) as "student" | "teacher" | "admin"));
        }

        // Combine all filters using AND if any exist
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        // Get total count
        const countResult = await db.select({ count: sql<number>`COUNT(*)` })
            .from(user)
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        // Get paginated users
        const usersList = await db.select(getTableColumns(user))
            .from(user)
            .where(whereClause)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            },
        });
    } catch (e) {
        console.error(`GET /users error: ${e}`);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

export default router;
