import {
    boolean,
    doublePrecision,
    foreignKey,
    index,
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
    role: text('role').notNull().default('user'), // 'user' or 'admin' (if committee)
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Reviews table containing course ratings and descriptions
export const reviews = pgTable('review', {
    id: uuid('id').defaultRandom().primaryKey(),
    courseCode: text('course_code').notNull(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    overallRating: integer('overall_rating').notNull(), // 1 to 5 stars
    difficultyScore: doublePrecision('difficulty_score').notNull(), // 0.5 to 5.0
    usefulnessScore: doublePrecision('usefulness_score').notNull(), // 0.5 to 5.0
    enjoymentScore: doublePrecision('enjoyment_score').notNull(), // 0.5 to 5.0
    termTaken: text('term_taken').notNull(), // E.g., "Semester 1, 2025"
    grade: text('grade'), // E.g., "HD", "D", "C", "P", "F", "WDN" (Optional)
    isAnonymous: boolean('is_anonymous').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    courseCodeIdx: index('review_course_code_idx').on(table.courseCode),
}));

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

// Course update votes, community consensus on a course's last major update term
// Each user can cast exactly one vote per course (upsert on conflict).
// suggestedTerm = the term the user believes was the last major course change
// e.g. "Semester 2, 2025" — if agreeing with consensus, it equals consensusTerm
export const courseUpdateVotes = pgTable('course_update_vote', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    courseCode: text('course_code').notNull(),
    suggestedTerm: text('suggested_term').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    courseUserIdx: index('course_update_vote_user_course_idx').on(table.userId, table.courseCode),
}));
