import express from "express";
import { classes, subjects, user, departments } from "../schema/index.js";
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { db } from "../../index.js";

const router = express.Router();

// Get all classes with optional search, filtering, and pagination
router.get("/", async (req, res) => {
    try {
        const { search, subject, teacher, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.max(Math.min(parseInt(String(limit), 10) || 10, 100), 1); // max 100 records per page

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        // If search query exists, filter by class name
        if (search) {
            filterConditions.push(ilike(classes.name, `%${search}%`));
        }

        // If subject filter exists, filter by subject ID
        if (subject) {
            filterConditions.push(eq(classes.subjectId, parseInt(String(subject), 10)));
        }

        // If teacher filter exists, filter by teacher ID
        if (teacher) {
            filterConditions.push(eq(classes.teacherId, String(teacher)));
        }

        // Combine all filters using AND if any exist
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        // Get total count
        const countResult = await db.select({ count: sql<number>`COUNT(*)` })
            .from(classes)
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        // Get paginated classes with relations (subject and teacher info)
        const classList = await db.select({
            ...getTableColumns(classes),
            subject: getTableColumns(subjects),
            teacher: getTableColumns(user),
        })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause)
            .orderBy(desc(classes.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: classList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            },
        });
    } catch (e) {
        console.error(`GET /classes error: ${e}`);
        res.status(500).json({ error: 'Failed to get classes' });
    }
});

export default router;
