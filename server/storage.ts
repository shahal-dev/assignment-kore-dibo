import {
  users,
  assignments,
  bids,
  messages,
  reviews,
  doubts,
  answers,
  verificationCodes,
  unverifiedUsers,
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
  type Doubt,
  type InsertDoubt,
  type Answer,
  type InsertAnswer,
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and, desc, asc, or, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Verification operations
  createVerificationCode(data: { email: string; code: string; expiresAt: Date }): Promise<any>;
  getVerificationCode(email: string, code: string): Promise<any>;
  markVerificationCodeUsed(id: number): Promise<any>;
  createUnverifiedUser(userData: InsertUser): Promise<typeof unverifiedUsers.$inferSelect>;
  getUnverifiedUser(email: string): Promise<typeof unverifiedUsers.$inferSelect | undefined>;

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
  
  // Doubt operations (Chegg-like feature)
  getDoubt(id: number): Promise<Doubt | undefined>;
  createDoubt(doubt: InsertDoubt): Promise<Doubt>;
  updateDoubt(id: number, doubt: Partial<Doubt>): Promise<Doubt | undefined>;
  getDoubts(filters?: Partial<Doubt>): Promise<Doubt[]>;
  getRecentDoubts(limit: number): Promise<Doubt[]>;
  getDoubtsByStudentId(studentId: number): Promise<Doubt[]>;
  getDoubtsByHelperId(helperId: number): Promise<Doubt[]>;
  getDoubtsBySubject(subject: string): Promise<Doubt[]>;
  
  // Answer operations
  getAnswer(id: number): Promise<Answer | undefined>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  updateAnswer(id: number, answer: Partial<Answer>): Promise<Answer | undefined>;
  getAnswersByDoubtId(doubtId: number): Promise<Answer[]>;
  getAnswersByHelperId(helperId: number): Promise<Answer[]>;
  acceptAnswer(id: number): Promise<Answer | undefined>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool: pool as any,
      createTableIfMissing: true 
    });
  }

  async createUnverifiedUser(userData: InsertUser): Promise<typeof unverifiedUsers.$inferSelect> {
    await db.delete(unverifiedUsers)
      .where(eq(unverifiedUsers.email, userData.email));
    const [user] = await db.insert(unverifiedUsers)
      .values(userData)
      .returning();
    return user;
  }

  async getUnverifiedUser(email: string): Promise<typeof unverifiedUsers.$inferSelect | undefined> {
    const [user] = await db.select()
      .from(unverifiedUsers)
      .where(eq(unverifiedUsers.email, email));
    return user;
  }

  // Verification operations
  async createVerificationCode(data: { email: string; code: string; expiresAt: Date }): Promise<any> {
    const [code] = await db.insert(verificationCodes)
      .values(data)
      .returning();
    return code;
  }

  async getVerificationCode(email: string, code: string): Promise<any> {
    const [verificationCode] = await db.select()
      .from(verificationCodes)
      .where(and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.code, code)
      ));
    return verificationCode;
  }

  async markVerificationCodeUsed(id: number): Promise<any> {
    const [code] = await db.update(verificationCodes)
      .set({ used: true })
      .where(eq(verificationCodes.id, id))
      .returning();
    return code;
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
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Delete any existing unverified user with this email
      await tx.delete(unverifiedUsers)
        .where(eq(unverifiedUsers.email, insertUser.email));

      // Create the verified user
      const [user] = await tx.insert(users)
        .values({
          ...insertUser,
          isVerified: true,
          rating: 0,
          reviewCount: 0,
        })
        .returning();

      return user;
    });
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

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(assignments)
      .values({
        description: assignment.description,
        title: assignment.title,
        budget: assignment.budget,
        deadline: new Date(assignment.deadline),
        category: assignment.category,
        studentId: assignment.studentId,
        isOpen: true,
        helperId: null,
        status: "open",
        photos: assignment.photos ?? [],
      })
      .returning();
      
    if (!newAssignment) {
      throw new Error('Failed to create assignment');
    }
    
    return newAssignment;
  }

  async updateAssignment(id: number, data: Partial<Assignment>): Promise<Assignment> {
    const updateData: Partial<Assignment> = {};
    
    if (data.isOpen !== undefined && data.isOpen !== null) {
      updateData.isOpen = data.isOpen;
    }
    
    if (data.helperId !== undefined && data.helperId !== null) {
      updateData.helperId = data.helperId;
    }
    
    if (data.status !== undefined && data.status !== null) {
      updateData.status = data.status;
    }

    const [updatedAssignment] = await db.update(assignments)
      .set(updateData)
      .where(eq(assignments.id, id))
      .returning();
      
    if (!updatedAssignment) {
      throw new Error(`Assignment with id ${id} not found`);
    }
    
    return updatedAssignment;
  }

  async getAssignments(filters?: Partial<Assignment>): Promise<Assignment[]> {
    let query = db.select().from(assignments);
    
    if (filters) {
      const conditions = [];
      
      if (filters.status !== undefined && filters.status !== null) {
        conditions.push(eq(assignments.status, filters.status));
      }
      
      if (filters.studentId !== undefined && filters.studentId !== null) {
        conditions.push(eq(assignments.studentId, filters.studentId));
      }
      
      if (filters.helperId !== undefined && filters.helperId !== null) {
        conditions.push(eq(assignments.helperId, filters.helperId));
      }
      
      if (filters.isOpen !== undefined && filters.isOpen !== null) {
        conditions.push(eq(assignments.isOpen, filters.isOpen));
      }
      
      if (filters.category !== undefined && filters.category !== null) {
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
    if (!message) return undefined;
    return {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      createdAt: message.createdAt ? message.createdAt.toISOString() : '',
      isRead: Boolean(message.isRead),
    };
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages)
      .values({
        ...insertMessage,
        isRead: false,
      })
      .returning();
    return {
      id: msg.id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      content: msg.content,
      createdAt: msg.createdAt ? msg.createdAt.toISOString() : '',
      isRead: Boolean(msg.isRead),
    };
  }

  async getMessagesByUserId(userId: number): Promise<Message[]> {
    const rows = await db.select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(desc(messages.createdAt));
    return rows.map(m => ({
      id: m.id,
      senderId: m.senderId,
      receiverId: m.receiverId,
      content: m.content,
      createdAt: m.createdAt ? m.createdAt.toISOString() : '',
      isRead: Boolean(m.isRead),
    }));
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    const rows = await db.select()
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
      .orderBy(desc(messages.createdAt));
    return rows.map(m => ({
      id: m.id,
      senderId: m.senderId,
      receiverId: m.receiverId,
      content: m.content,
      createdAt: m.createdAt ? m.createdAt.toISOString() : '',
      isRead: Boolean(m.isRead),
    }));
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

  // Doubt operations
  async getDoubt(id: number): Promise<Doubt | undefined> {
    const [doubt] = await db.select()
      .from(doubts)
      .where(eq(doubts.id, id));
    return doubt;
  }

  async createDoubt(insertDoubt: InsertDoubt): Promise<Doubt> {
    const [doubt] = await db.insert(doubts)
      .values({
        ...insertDoubt,
        helperId: null,
        status: 'open'
      })
      .returning();
    return doubt;
  }

  async getDoubts(filters?: Partial<Doubt>): Promise<Doubt[]> {
    let query = db.select().from(doubts);
    
    if (filters) {
      const conditions = [];
      
      if (filters.status !== undefined && filters.status !== null) {
        conditions.push(eq(doubts.status, filters.status as 'open' | 'answered' | 'closed'));
      }
      
      if (filters.studentId !== undefined && filters.studentId !== null) {
        conditions.push(eq(doubts.studentId, filters.studentId));
      }
      
      if (filters.helperId !== undefined && filters.helperId !== null) {
        conditions.push(eq(doubts.helperId, filters.helperId));
      }
      
      if (filters.subject !== undefined && filters.subject !== null) {
        conditions.push(eq(doubts.subject, filters.subject));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    const result = await query.orderBy(desc(doubts.createdAt));
    return result;
  }

  async getRecentDoubts(limit: number): Promise<Doubt[]> {
    return await db.select()
      .from(doubts)
      .where(eq(doubts.status, 'open'))
      .orderBy(desc(doubts.createdAt))
      .limit(limit);
  }

  async getDoubtsByStudentId(studentId: number): Promise<Doubt[]> {
    return await db.select()
      .from(doubts)
      .where(eq(doubts.studentId, studentId))
      .orderBy(desc(doubts.createdAt));
  }

  async getDoubtsByHelperId(helperId: number): Promise<Doubt[]> {
    return await db.select()
      .from(doubts)
      .where(eq(doubts.helperId, helperId))
      .orderBy(desc(doubts.createdAt));
  }

  async getDoubtsBySubject(subject: string): Promise<Doubt[]> {
    return await db.select()
      .from(doubts)
      .where(eq(doubts.subject, subject))
      .orderBy(desc(doubts.createdAt));
  }

  async updateDoubt(id: number, data: Partial<Doubt>): Promise<Doubt> {
    const updateData: Partial<Doubt> = {};
    
    if (data.helperId !== undefined && data.helperId !== null) {
      updateData.helperId = data.helperId;
    }
    
    if (data.status !== undefined && data.status !== null) {
      updateData.status = data.status as 'open' | 'answered' | 'closed';
    }

    const [updatedDoubt] = await db.update(doubts)
      .set(updateData)
      .where(eq(doubts.id, id))
      .returning();
      
    if (!updatedDoubt) {
      throw new Error(`Doubt with id ${id} not found`);
    }
    
    return updatedDoubt;
  }

  // Answer operations
  async getAnswer(id: number): Promise<Answer | undefined> {
    const [answer] = await db.select()
      .from(answers)
      .where(eq(answers.id, id));
    return answer;
  }

  async createAnswer(insertAnswer: InsertAnswer): Promise<Answer> {
    const [answer] = await db.insert(answers)
      .values({
        ...insertAnswer,
        isAccepted: false,
      })
      .returning();
    return answer;
  }

  async updateAnswer(id: number, answerData: Partial<Answer>): Promise<Answer | undefined> {
    const [answer] = await db.update(answers)
      .set(answerData)
      .where(eq(answers.id, id))
      .returning();
    return answer;
  }

  async getAnswersByDoubtId(doubtId: number): Promise<Answer[]> {
    return await db.select()
      .from(answers)
      .where(eq(answers.doubtId, doubtId))
      .orderBy(desc(answers.createdAt));
  }

  async getAnswersByHelperId(helperId: number): Promise<Answer[]> {
    return await db.select()
      .from(answers)
      .where(eq(answers.helperId, helperId))
      .orderBy(desc(answers.createdAt));
  }

  async acceptAnswer(id: number): Promise<Answer | undefined> {
    // First, get the answer to find its doubtId
    const answer = await this.getAnswer(id);
    if (!answer) return undefined;

    // Update the doubt status to 'answered'
    await db.update(doubts)
      .set({ 
        status: 'answered',
        helperId: answer.helperId
      })
      .where(eq(doubts.id, answer.doubtId));

    // Mark this answer as accepted
    const [updatedAnswer] = await db.update(answers)
      .set({ isAccepted: true })
      .where(eq(answers.id, id))
      .returning();
    
    return updatedAnswer;
  }
}

export const storage = new DatabaseStorage();
