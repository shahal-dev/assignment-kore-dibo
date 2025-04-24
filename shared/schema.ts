import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Define constants for reuse across the schema
export const doubtStatuses = ['open', 'answered', 'closed'] as const;

export const userTypes = ['student', 'helper'] as const;

export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
});

export const unverifiedUsers = pgTable("unverified_users", {
  email: text("email").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  userType: text("user_type", { enum: userTypes }).notNull(),
  bio: text("bio"),
  skills: text("skills").array(),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  userType: text("user_type", { enum: userTypes }).notNull(),
  verified: boolean("verified").default(false),
  bio: text("bio"),
  skills: text("skills").array(),
  profileImage: text("profile_image"),
  rating: integer("rating").default(0),
  reviewCount: integer("review_count").default(0),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  budget: integer("budget").notNull(),
  deadline: timestamp("deadline").notNull(),
  category: text("category").notNull(),
  isOpen: boolean("is_open").default(true),
  studentId: integer("student_id").notNull(),
  helperId: integer("helper_id"),
  createdAt: timestamp("created_at").defaultNow(),
  status: text("status").default("open"),
});

export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  helperId: integer("helper_id").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isRead: boolean("is_read").default(false),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  studentId: integer("student_id").notNull(),
  helperId: integer("helper_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Doubts table for quick questions/answers (like Chegg)
export const doubts = pgTable("doubts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  question: text("question").notNull(),
  subject: text("subject").notNull(),
  subTopic: text("sub_topic"), // Optional sub-topic within the subject
  image: text("image"), // Optional image URL for doubt visualization
  budget: integer("budget").default(100), // Default lower price than assignments
  studentId: integer("student_id").notNull(),
  helperId: integer("helper_id"), // Initially null until a helper answers
  createdAt: timestamp("created_at").defaultNow(),
  status: text("status", { enum: doubtStatuses }).default("open"),
});

// Answers table for doubt solutions
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  doubtId: integer("doubt_id").notNull(),
  helperId: integer("helper_id").notNull(),
  answer: text("answer").notNull(),
  image: text("image"), // Optional image URL for solution visualization
  createdAt: timestamp("created_at").defaultNow(),
  isAccepted: boolean("is_accepted").default(false),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    fullName: true,
    email: true,
    userType: true,
    bio: true,
    skills: true,
    profileImage: true,
  })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Invalid email format"),
    userType: z.enum(userTypes),
    bio: z.string().optional(),
    skills: z.array(z.string()).optional(),
    profileImage: z.string().optional(),
  });

export const insertAssignmentSchema = createInsertSchema(assignments)
  .pick({
    title: true,
    description: true,
    budget: true,
    deadline: true,
    category: true,
    studentId: true,
  })
  .extend({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    deadline: z.string().or(z.date()),
  });

export const insertBidSchema = createInsertSchema(bids)
  .pick({
    assignmentId: true,
    helperId: true,
    amount: true,
    description: true,
  })
  .extend({
    description: z.string().min(10, "Description must be at least 10 characters"),
  });

export const insertMessageSchema = createInsertSchema(messages)
  .pick({
    senderId: true,
    receiverId: true,
    content: true,
  })
  .extend({
    content: z.string().min(1, "Message cannot be empty"),
  });

export const insertReviewSchema = createInsertSchema(reviews)
  .pick({
    assignmentId: true,
    studentId: true,
    helperId: true,
    rating: true,
    comment: true,
  })
  .extend({
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
  });

// Schema for doubts
export const insertDoubtSchema = createInsertSchema(doubts)
  .pick({
    title: true,
    question: true,
    subject: true,
    subTopic: true,
    image: true,
    budget: true,
    studentId: true,
  })
  .extend({
    title: z.string().min(3, "Title must be at least 3 characters"),
    question: z.string().min(10, "Question must be at least 10 characters"),
    subTopic: z.string().optional(),
    image: z.string().optional(),
    budget: z.number().default(100),
  });

// Schema for answers
export const insertAnswerSchema = createInsertSchema(answers)
  .pick({
    doubtId: true,
    helperId: true,
    answer: true,
    image: true,
  })
  .extend({
    answer: z.string().min(10, "Answer must be at least 10 characters"),
    image: z.string().optional(),
  });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bids.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertDoubt = z.infer<typeof insertDoubtSchema>;
export type Doubt = typeof doubts.$inferSelect;

export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answers.$inferSelect;

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  assignmentsAsStudent: many(assignments, { relationName: 'student_assignments' }),
  assignmentsAsHelper: many(assignments, { relationName: 'helper_assignments' }),
  bids: many(bids),
  receivedReviews: many(reviews, { relationName: 'helper_reviews' }),
  givenReviews: many(reviews, { relationName: 'student_reviews' }),
  sentMessages: many(messages, { relationName: 'sent_messages' }),
  receivedMessages: many(messages, { relationName: 'received_messages' }),
  doubtsAsStudent: many(doubts),
  answersAsHelper: many(answers),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  student: one(users, {
    fields: [assignments.studentId],
    references: [users.id],
    relationName: 'student_assignments',
  }),
  helper: one(users, {
    fields: [assignments.helperId],
    references: [users.id],
    relationName: 'helper_assignments',
  }),
  bids: many(bids),
  reviews: many(reviews),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  assignment: one(assignments, {
    fields: [bids.assignmentId],
    references: [assignments.id],
  }),
  helper: one(users, {
    fields: [bids.helperId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: 'sent_messages',
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: 'received_messages',
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  assignment: one(assignments, {
    fields: [reviews.assignmentId],
    references: [assignments.id],
  }),
  student: one(users, {
    fields: [reviews.studentId],
    references: [users.id],
    relationName: 'student_reviews',
  }),
  helper: one(users, {
    fields: [reviews.helperId],
    references: [users.id],
    relationName: 'helper_reviews',
  }),
}));

// Doubts relationships
export const doubtsRelations = relations(doubts, ({ one, many }) => ({
  student: one(users, {
    fields: [doubts.studentId],
    references: [users.id],
  }),
  helper: one(users, {
    fields: [doubts.helperId],
    references: [users.id],
  }),
  answers: many(answers),
}));

// Answers relationships
export const answersRelations = relations(answers, ({ one }) => ({
  doubt: one(doubts, {
    fields: [answers.doubtId],
    references: [doubts.id],
  }),
  helper: one(users, {
    fields: [answers.helperId],
    references: [users.id],
  }),
}));
