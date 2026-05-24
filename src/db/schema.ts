import { sql } from 'drizzle-orm';
import {
    boolean,
    foreignKey,
    integer,
    pgTable,
    primaryKey,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core';

// Users table mapping to Keycloak authentication profile
export const users = pgTable('user', {
    id: text('id').primaryKey(), // Keycloak 'sub' subject claim
    name: text('name').notNull(),
    email: text('email').notNull(),
    image: text('image'),
    role: text('role').notNull().default('user'), // 'user' or 'admin' (if committee)
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Cache table for courses fetched from Adelaide University Courses API
export const courses = pgTable('course', {
    code: text('code').primaryKey(), // E.g., 'COMP SCI 1102'
    name: text('name').notNull(),
    description: text('description'),
    terms: text('terms').notNull(), // Serialized array of terms e.g., ["Semester 1", "Semester 2"]
    officialLink: text('official_link'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Reviews table containing course ratings and descriptions
export const reviews = pgTable('review', {
    id: uuid('id').defaultRandom().primaryKey(),
    courseCode: text('course_code')
        .notNull()
        .references(() => courses.code, { onDelete: 'cascade' }),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    overallRating: integer('overall_rating').notNull(), // 1 to 5 stars
    difficultyScore: integer('difficulty_score').notNull(), // 1 to 5
    usefulnessScore: integer('usefulness_score').notNull(), // 1 to 5
    enjoymentScore: integer('enjoyment_score').notNull(), // 1 to 5
    termTaken: text('term_taken').notNull(), // E.g., "Semester 1, 2025"
    grade: text('grade'), // E.g., "HD", "D", "C", "P", "F", "WDN" (Optional)
    isAnonymous: boolean('is_anonymous').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Comments table for threaded review discussions
export const comments = pgTable(
    'comment',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        reviewId: uuid('review_id')
            .notNull()
            .references(() => reviews.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        parentId: uuid('parent_id'), // Threading parent
        content: text('content').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => ({
        parentFk: foreignKey({
            columns: [table.parentId],
            foreignColumns: [table.id],
            name: 'comment_parent_id_fk',
        }).onDelete('cascade'),
    })
);

// Likes tracker table to prevent double liking reviews
export const likes = pgTable(
    'like',
    {
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        reviewId: uuid('review_id')
            .notNull()
            .references(() => reviews.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => [primaryKey({ columns: [table.userId, table.reviewId] })]
);
