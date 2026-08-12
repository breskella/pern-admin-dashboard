import { integer, pgTable,timestamp, varchar, text, boolean } from "drizzle-orm/pg-core";
import {relations} from "drizzle-orm";

const timestamps = {
   createdAt: timestamp('created_at').defaultNow().notNull(),
   updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}

export const departments = pgTable('departments', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }),
  ... timestamps
});

export const subjects = pgTable('subjects', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  departmentId: integer('department_id').notNull().references(() => departments.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  ... timestamps
});

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 50 }).notNull().default('student'),
  department: varchar('department', { length: 255 }),
  image: varchar('image', { length: 255 }),
  imageCldPubId: varchar('image_cld_pub_id', { length: 255 }),
  ... timestamps
});

export const classes = pgTable('classes', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  subjectId: integer('subject_id').notNull().references(() => subjects.id, { onDelete: 'restrict' }),
  teacherId: varchar('teacher_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  capacity: integer('capacity').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  bannerUrl: varchar('banner_url', { length: 255 }).notNull(),
  bannerCldPubId: varchar('banner_cld_pub_id', { length: 255 }).notNull(),
  inviteCode: varchar('invite_code', { length: 50 }),
  ... timestamps
});

export const departmentRelations = relations(departments, ({ many }) => ({
  subjects: many(subjects),
}));

export const subjectRelations = relations(subjects, ({ one, many }) => ({
  department: one(departments, {
    fields: [subjects.departmentId],
    references: [departments.id],
  }),
  classes: many(classes),
}));

export const userRelations = relations(users, ({ many }) => ({
  classes: many(classes),
}));

export const classRelations = relations(classes, ({ one }) => ({
  subject: one(subjects, {
    fields: [classes.subjectId],
    references: [subjects.id],
  }),
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id],
  }),
}));

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;