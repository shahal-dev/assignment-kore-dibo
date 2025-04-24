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
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private assignments: Map<number, Assignment>;
  private bids: Map<number, Bid>;
  private messages: Map<number, Message>;
  private reviews: Map<number, Review>;
  sessionStore: session.SessionStore;
  
  private userCurrentId: number;
  private assignmentCurrentId: number;
  private bidCurrentId: number;
  private messageCurrentId: number;
  private reviewCurrentId: number;

  constructor() {
    this.users = new Map();
    this.assignments = new Map();
    this.bids = new Map();
    this.messages = new Map();
    this.reviews = new Map();
    
    this.userCurrentId = 1;
    this.assignmentCurrentId = 1;
    this.bidCurrentId = 1;
    this.messageCurrentId = 1;
    this.reviewCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id, rating: 0, reviewCount: 0 };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getHelpers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.userType === 'helper'
    );
  }

  async getTopHelpers(limit: number): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.userType === 'helper')
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  // Assignment operations
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = this.assignmentCurrentId++;
    const assignment: Assignment = {
      ...insertAssignment,
      id,
      isOpen: true,
      helperId: null,
      createdAt: new Date(),
      status: 'open',
    };
    this.assignments.set(id, assignment);
    return assignment;
  }

  async updateAssignment(id: number, assignmentData: Partial<Assignment>): Promise<Assignment | undefined> {
    const assignment = await this.getAssignment(id);
    if (!assignment) return undefined;

    const updatedAssignment = { ...assignment, ...assignmentData };
    this.assignments.set(id, updatedAssignment);
    return updatedAssignment;
  }

  async getAssignments(filters?: Partial<Assignment>): Promise<Assignment[]> {
    let assignments = Array.from(this.assignments.values());
    
    if (filters) {
      assignments = assignments.filter(assignment => {
        return Object.entries(filters).every(([key, value]) => {
          return assignment[key as keyof Assignment] === value;
        });
      });
    }
    
    return assignments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getRecentAssignments(limit: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values())
      .filter(assignment => assignment.isOpen)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  }

  async getAssignmentsByStudentId(studentId: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values())
      .filter(assignment => assignment.studentId === studentId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async getAssignmentsByHelperId(helperId: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values())
      .filter(assignment => assignment.helperId === helperId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  // Bid operations
  async getBid(id: number): Promise<Bid | undefined> {
    return this.bids.get(id);
  }

  async createBid(insertBid: InsertBid): Promise<Bid> {
    const id = this.bidCurrentId++;
    const bid: Bid = {
      ...insertBid,
      id,
      status: 'pending',
      createdAt: new Date(),
    };
    this.bids.set(id, bid);
    return bid;
  }

  async updateBid(id: number, bidData: Partial<Bid>): Promise<Bid | undefined> {
    const bid = await this.getBid(id);
    if (!bid) return undefined;

    const updatedBid = { ...bid, ...bidData };
    this.bids.set(id, updatedBid);
    return updatedBid;
  }

  async getBidsByAssignmentId(assignmentId: number): Promise<Bid[]> {
    return Array.from(this.bids.values())
      .filter(bid => bid.assignmentId === assignmentId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async getBidsByHelperId(helperId: number): Promise<Bid[]> {
    return Array.from(this.bids.values())
      .filter(bid => bid.helperId === helperId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async getBidCountByAssignmentId(assignmentId: number): Promise<number> {
    return (await this.getBidsByAssignmentId(assignmentId)).length;
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageCurrentId++;
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
      isRead: false,
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByUserId(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        message.senderId === userId || message.receiverId === userId
      )
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        (message.senderId === user1Id && message.receiverId === user2Id) ||
        (message.senderId === user2Id && message.receiverId === user1Id)
      )
      .sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = await this.getMessage(id);
    if (!message) return undefined;

    const updatedMessage = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Review operations
  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewCurrentId++;
    const review: Review = {
      ...insertReview,
      id,
      createdAt: new Date(),
    };
    this.reviews.set(id, review);
    
    // Update helper rating
    const helper = await this.getUser(insertReview.helperId);
    if (helper) {
      const helperReviews = await this.getReviewsByHelperId(insertReview.helperId);
      const totalRating = helperReviews.reduce((sum, review) => sum + review.rating, 0);
      const updatedHelper = {
        ...helper,
        rating: Math.round(totalRating / helperReviews.length),
        reviewCount: helperReviews.length,
      };
      this.users.set(helper.id, updatedHelper);
    }
    
    return review;
  }

  async getReviewsByHelperId(helperId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.helperId === helperId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async getReviewsByAssignmentId(assignmentId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.assignmentId === assignmentId);
  }
}

export const storage = new MemStorage();
