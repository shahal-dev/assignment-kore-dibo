import {
  users,
  assignments,
  bids,
  messages,
  reviews,
  type User,
  type InsertUser,
  type Assignment,
  type InsertAssignment,
  type Bid,
  type InsertBid,
  type Message,
  type InsertMessage,
  type Review,
  type InsertReview,
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and, desc, asc, or, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getHelpers(): Promise<User[]>;
  getTopHelpers(limit: number): Promise<User[]>;

  // Assignment operations
  getAssignment(id: number): Promise<Assignment | undefined>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, assignment: Partial<Assignment>): Promise<Assignment | undefined>;
  getAssignments(filters?: Partial<Assignment>): Promise<Assignment[]>;
  getRecentAssignments(limit: number): Promise<Assignment[]>;
  getAssignmentsByStudentId(studentId: number): Promise<Assignment[]>;
  getAssignmentsByHelperId(helperId: number): Promise<Assignment[]>;

  // Bid operations
  getBid(id: number): Promise<Bid | undefined>;
  createBid(bid: InsertBid): Promise<Bid>;
  updateBid(id: number, bid: Partial<Bid>): Promise<Bid | undefined>;
  getBidsByAssignmentId(assignmentId: number): Promise<Bid[]>;
  getBidsByHelperId(helperId: number): Promise<Bid[]>;
  getBidCountByAssignmentId(assignmentId: number): Promise<number>;

  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUserId(userId: number): Promise<Message[]>;
  getConversation(user1Id: number, user2Id: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<Message | undefined>;

  // Review operations
  getReview(id: number): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByHelperId(helperId: number): Promise<Review[]>;
  getReviewsByAssignmentId(assignmentId: number): Promise<Review[]>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users)
      .values({ 
        ...insertUser, 
        rating: 0, 
        reviewCount: 0 
      })
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getHelpers(): Promise<User[]> {
    return await db.select()
      .from(users)
      .where(eq(users.userType, 'helper'));
  }

  async getTopHelpers(limit: number): Promise<User[]> {
    return await db.select()
      .from(users)
      .where(eq(users.userType, 'helper'))
      .orderBy(desc(users.rating))
      .limit(limit);
  }

  // Assignment operations
  async getAssignment(id: number): Promise<Assignment | undefined> {
    const [assignment] = await db.select()
      .from(assignments)
      .where(eq(assignments.id, id));
    return assignment;
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const [assignment] = await db.insert(assignments)
      .values({
        ...insertAssignment,
        isOpen: true,
        helperId: null,
        status: 'open',
      })
      .returning();
    return assignment;
  }

  async updateAssignment(id: number, assignmentData: Partial<Assignment>): Promise<Assignment | undefined> {
    const [assignment] = await db.update(assignments)
      .set(assignmentData)
      .where(eq(assignments.id, id))
      .returning();
    return assignment;
  }

  async getAssignments(filters?: Partial<Assignment>): Promise<Assignment[]> {
    let query = db.select().from(assignments);
    
    if (filters) {
      const conditions = [];
      
      if (filters.isOpen !== undefined) {
        conditions.push(eq(assignments.isOpen, filters.isOpen));
      }
      
      if (filters.studentId !== undefined) {
        conditions.push(eq(assignments.studentId, filters.studentId));
      }
      
      if (filters.helperId !== undefined) {
        conditions.push(eq(assignments.helperId, filters.helperId));
      }
      
      if (filters.status !== undefined) {
        conditions.push(eq(assignments.status, filters.status));
      }
      
      if (filters.category !== undefined) {
        conditions.push(eq(assignments.category, filters.category));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(assignments.createdAt));
  }

  async getRecentAssignments(limit: number): Promise<Assignment[]> {
    return await db.select()
      .from(assignments)
      .where(eq(assignments.isOpen, true))
      .orderBy(desc(assignments.createdAt))
      .limit(limit);
  }

  async getAssignmentsByStudentId(studentId: number): Promise<Assignment[]> {
    return await db.select()
      .from(assignments)
      .where(eq(assignments.studentId, studentId))
      .orderBy(desc(assignments.createdAt));
  }

  async getAssignmentsByHelperId(helperId: number): Promise<Assignment[]> {
    return await db.select()
      .from(assignments)
      .where(eq(assignments.helperId, helperId))
      .orderBy(desc(assignments.createdAt));
  }

  // Bid operations
  async getBid(id: number): Promise<Bid | undefined> {
    const [bid] = await db.select()
      .from(bids)
      .where(eq(bids.id, id));
    return bid;
  }

  async createBid(insertBid: InsertBid): Promise<Bid> {
    const [bid] = await db.insert(bids)
      .values({
        ...insertBid,
        status: 'pending',
      })
      .returning();
    return bid;
  }

  async updateBid(id: number, bidData: Partial<Bid>): Promise<Bid | undefined> {
    const [bid] = await db.update(bids)
      .set(bidData)
      .where(eq(bids.id, id))
      .returning();
    return bid;
  }

  async getBidsByAssignmentId(assignmentId: number): Promise<Bid[]> {
    return await db.select()
      .from(bids)
      .where(eq(bids.assignmentId, assignmentId))
      .orderBy(desc(bids.createdAt));
  }

  async getBidsByHelperId(helperId: number): Promise<Bid[]> {
    return await db.select()
      .from(bids)
      .where(eq(bids.helperId, helperId))
      .orderBy(desc(bids.createdAt));
  }

  async getBidCountByAssignmentId(assignmentId: number): Promise<number> {
    const result = await db.select({ count: sql`count(*)` })
      .from(bids)
      .where(eq(bids.assignmentId, assignmentId));
    return Number(result[0].count);
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select()
      .from(messages)
      .where(eq(messages.id, id));
    return message;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages)
      .values({
        ...insertMessage,
        isRead: false,
      })
      .returning();
    return message;
  }

  async getMessagesByUserId(userId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, user1Id),
            eq(messages.receiverId, user2Id)
          ),
          and(
            eq(messages.senderId, user2Id),
            eq(messages.receiverId, user1Id)
          )
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [message] = await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return message;
  }

  // Review operations
  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select()
      .from(reviews)
      .where(eq(reviews.id, id));
    return review;
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews)
      .values(insertReview)
      .returning();
    
    // Update helper rating and review count
    const helperReviews = await this.getReviewsByHelperId(insertReview.helperId);
    const totalRating = helperReviews.reduce((sum, review) => sum + review.rating, 0);
    await db.update(users)
      .set({ 
        rating: Math.round(totalRating / helperReviews.length),
        reviewCount: helperReviews.length
      })
      .where(eq(users.id, insertReview.helperId));
    
    return review;
  }

  async getReviewsByHelperId(helperId: number): Promise<Review[]> {
    return await db.select()
      .from(reviews)
      .where(eq(reviews.helperId, helperId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewsByAssignmentId(assignmentId: number): Promise<Review[]> {
    return await db.select()
      .from(reviews)
      .where(eq(reviews.assignmentId, assignmentId));
  }
}

export const storage = new DatabaseStorage();
