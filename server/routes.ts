import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import type { Message, Conversation } from "@shared/schema";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import {
  insertAssignmentSchema,
  insertBidSchema,
  insertReviewSchema,
  insertDoubtSchema,
  insertAnswerSchema,
  sendMessageSchema,
  // insertMessageSchema, // not needed in routes
} from "@shared/schema";
import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("!!! ROUTES FILE LOADED AT", new Date().toISOString());
import * as notifications from './notifications';

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // --- Notification API ---
  app.get('/api/notifications', async (req, res) => {
    if (!req.isAuthenticated() || !req.user) return res.status(401).json({ message: 'Unauthorized' });
    const result = await notifications.getNotifications(req.user.id);
    res.json(result);
  });

  app.post('/api/notifications/mark-read', async (req, res) => {
    if (!req.isAuthenticated() || !req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { notificationId } = req.body;
    await notifications.markNotificationRead(notificationId);
    res.json({ success: true });
  });

  app.post('/api/notifications/mark-all-read', async (req, res) => {
    if (!req.isAuthenticated() || !req.user) return res.status(401).json({ message: 'Unauthorized' });
    await notifications.markAllNotificationsRead(req.user.id);
    res.json({ success: true });
  });

// Helper middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user) return next();
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Helper middleware to check if user is a student
  const isStudent = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user && (req.user as any).userType === 'student') return next();
    return res.status(403).json({ message: "Only students can perform this action" });
  };

  // Helper middleware to check if user is a helper
  const isHelper = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user && (req.user as any).userType === 'helper') return next();
    return res.status(403).json({ message: "Only helpers can perform this action" });
  
  };

  // Assignment routes
  app.get("/api/assignments", async (req, res) => {
    try {
      const { category, budget, deadline, status } = req.query;
      let filters: any = {};
      
      if (category) filters.category = category as string;
      if (status) filters.status = status as string;
      
      let assignments = await storage.getAssignments(filters);
      
      // Apply additional filtering that doesn't directly map to fields
      if (budget) {
        const budgetNum = parseInt(budget as string);
        if (!isNaN(budgetNum)) {
          assignments = assignments.filter(a => a.budget <= budgetNum);
        }
      }
      
      if (deadline) {
        const deadlineDate = new Date(deadline as string);
        if (!isNaN(deadlineDate.getTime())) {
          assignments = assignments.filter(a => new Date(a.deadline) >= deadlineDate);
        }
      }
      
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.get("/api/assignments/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const assignments = await storage.getRecentAssignments(limit);
      
      // Also get bid counts for each assignment
      const assignmentsWithBidCount = await Promise.all(
        assignments.map(async (assignment) => {
          const bidCount = await storage.getBidCountByAssignmentId(assignment.id);
          return { ...assignment, bidCount };
        })
      );
      
      res.json(assignmentsWithBidCount);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent assignments" });
    }
  });

  app.get("/api/assignments/:id", async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Get bid count
      const bidCount = await storage.getBidCountByAssignmentId(assignmentId);
      
      // Get student info
      const student = await storage.getUser(assignment.studentId);
      
      // If assignment has a helper, get helper info
      let helper = undefined;
      if (assignment.helperId) {
        helper = await storage.getUser(assignment.helperId);
      }
      
      res.json({
        ...assignment,
        bidCount,
        student: student ? { 
          id: student.id, 
          username: student.username,
          fullName: student.fullName,
          profileImage: student.profileImage
        } : null,
        helper: helper ? { 
          id: helper.id, 
          username: helper.username,
          fullName: helper.fullName,
          profileImage: helper.profileImage,
          rating: helper.rating,
          reviewCount: helper.reviewCount
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignment" });
    }
  });

  app.post("/api/assignments", isStudent, multer({ dest: path.join(__dirname, '../uploads/assignments'), limits: { fileSize: 5 * 1024 * 1024 } }).array('photos', 5), async (req, res) => {
    console.debug("[Assignment Request] body:", req.body, "files:", req.files);
    try {
      // collect photo URLs
      const files = (req.files as Express.Multer.File[]) || [];
      const photoUrls = files.map(f => `/uploads/assignments/${f.filename}`);
      // validate and include photos
      const user = req.user!;
      // Coerce numeric and string fields from form-data
      const { title, description, budget, deadline, category } = req.body;
      const validatedData = insertAssignmentSchema.parse({
        title,
        description,
        budget: Number(budget),
        deadline,
        category,
        studentId: user.id,
        photos: photoUrls,
      });
      const assignment = await storage.createAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("[Assignment Validation Error]", error.errors);
        return res.status(400).json({ message: "Invalid assignment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.patch("/api/assignments/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const assignmentId = parseInt(req.params.id);
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Only the student who created the assignment can update it
      if (assignment.studentId !== user.id && user.userType !== 'helper') {
        return res.status(403).json({ message: "Unauthorized to update this assignment" });
      }
      
      const updatedAssignment = await storage.updateAssignment(assignmentId, req.body);
      res.json(updatedAssignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update assignment" });
    }
  });

  app.get("/api/assignments/student/:id", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const assignments = await storage.getAssignmentsByStudentId(studentId);
      
      // Also get bid counts for each assignment
      const assignmentsWithBidCount = await Promise.all(
        assignments.map(async (assignment) => {
          const bidCount = await storage.getBidCountByAssignmentId(assignment.id);
          return { ...assignment, bidCount };
        })
      );
      
      res.json(assignmentsWithBidCount);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student assignments" });
    }
  });

  app.get("/api/assignments/helper/:id", async (req, res) => {
    try {
      const helperId = parseInt(req.params.id);
      const assignments = await storage.getAssignmentsByHelperId(helperId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch helper assignments" });
    }
  });

  // Bid routes
  app.get("/api/bids/assignment/:id", async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const bids = await storage.getBidsByAssignmentId(assignmentId);
      
      // Enrich bid data with helper info
      const enrichedBids = await Promise.all(
        bids.map(async (bid) => {
          const helper = await storage.getUser(bid.helperId);
          return {
            ...bid,
            helper: helper ? {
              id: helper.id,
              username: helper.username,
              fullName: helper.fullName,
              profileImage: helper.profileImage,
              rating: helper.rating,
              reviewCount: helper.reviewCount
            } : null
          };
        })
      );
      
      res.json(enrichedBids);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  app.get("/api/bids/helper/:id", isAuthenticated, async (req, res) => {
    try {
      const helperId = parseInt(req.params.id);
      
      // Only the helper can view their own bids
      if (helperId !== req.user!.id && req.user!.userType !== 'helper') {
        return res.status(403).json({ message: "Unauthorized to view these bids" });
      }
      
      const bids = await storage.getBidsByHelperId(helperId);
      
      // Enrich bid data with assignment info
      const enrichedBids = await Promise.all(
        bids.map(async (bid) => {
          const assignment = await storage.getAssignment(bid.assignmentId);
          return {
            ...bid,
            assignment: assignment || null
          };
        })
      );
      
      res.json(enrichedBids);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch helper bids" });
    }
  });

  app.post("/api/bids", isHelper, async (req, res) => {
    try {
      const validatedData = insertBidSchema.parse({
        ...req.body,
        helperId: req.user!.id
      });
      
      // Check if the assignment exists and is open
      const assignment = await storage.getAssignment(validatedData.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      if (!assignment.isOpen) {
        return res.status(400).json({ message: "This assignment is not open for bidding" });
      }
      
      // Check if the helper has already placed a bid on this assignment
      const existingBids = await storage.getBidsByHelperId(req.user!.id);
      const alreadyBid = existingBids.some(bid => bid.assignmentId === validatedData.assignmentId);
      
      if (alreadyBid) {
        return res.status(400).json({ message: "You have already placed a bid on this assignment" });
      }
      
      const bid = await storage.createBid(validatedData);
      res.status(201).json(bid);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bid" });
    }
  });

  app.patch("/api/bids/:id", isAuthenticated, async (req, res) => {
    try {
      const bidId = parseInt(req.params.id);
      const bid = await storage.getBid(bidId);
      
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      
      // Get the assignment to check if the current user is the student who posted it
      const assignment = await storage.getAssignment(bid.assignmentId);
      
      // Only the student who posted the assignment or the helper who placed the bid can update it
      if (assignment?.studentId !== req.user!.id && bid.helperId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized to update this bid" });
      }
      
      // If the student is accepting a bid
      if (req.body.status === 'accepted' && assignment?.studentId === req.user!.id) {
        // Update the assignment to mark it as assigned to this helper
        await storage.updateAssignment(bid.assignmentId, {
          isOpen: false,
          helperId: bid.helperId,
          status: 'in-progress'
        });
        
        // Reject all other bids
        const otherBids = await storage.getBidsByAssignmentId(bid.assignmentId);
        await Promise.all(
          otherBids
            .filter(otherBid => otherBid.id !== bidId)
            .map(otherBid => storage.updateBid(otherBid.id, { status: 'rejected' }))
        );
      }
      
      const updatedBid = await storage.updateBid(bidId, req.body);
      res.json(updatedBid);
    } catch (error) {
      res.status(500).json({ message: "Failed to update bid" });
    }
  });

  // Helper routes
  app.get("/api/helpers", async (req, res) => {
    try {
      const helpers = await storage.getHelpers();
      res.json(helpers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch helpers" });
    }
  });

  app.get("/api/helpers/top", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      const helpers = await storage.getTopHelpers(limit);
      res.json(helpers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch top helpers" });
    }
  });

  app.get("/api/helpers/:id", async (req, res) => {
    try {
      const helperId = parseInt(req.params.id);
      const helper = await storage.getUser(helperId);
      
      if (!helper || helper.userType !== 'helper') {
        return res.status(404).json({ message: "Helper not found" });
      }
      
      // Get reviews for this helper
      const reviews = await storage.getReviewsByHelperId(helperId);
      
      // Enrich reviews with student and assignment info
      const enrichedReviews = await Promise.all(
        reviews.map(async (review) => {
          const student = await storage.getUser(review.studentId);
          const assignment = await storage.getAssignment(review.assignmentId);
          
          return {
            ...review,
            student: student ? {
              id: student.id,
              username: student.username,
              fullName: student.fullName,
              profileImage: student.profileImage
            } : null,
            assignment: assignment ? {
              id: assignment.id,
              title: assignment.title
            } : null
          };
        })
      );
      
      res.json({
        ...helper,
        reviews: enrichedReviews
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch helper" });
    }
  });

  // Message routes
  app.get("/api/messages", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.user!.id;
      const messages = await storage.getMessagesByUserId(userId);
      
      // Group messages by conversation
      const conversationMap = new Map();
      
      for (const message of messages) {
        const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
        
        if (!conversationMap.has(otherUserId)) {
          const otherUser = await storage.getUser(otherUserId);
          conversationMap.set(otherUserId, {
            user: otherUser ? {
              id: otherUser.id,
              username: otherUser.username,
              fullName: otherUser.fullName,
              profileImage: otherUser.profileImage,
              userType: otherUser.userType
            } : null,
            lastMessage: message,
            unreadCount: message.receiverId === userId && !message.isRead ? 1 : 0
          });
        } else {
          const conversation = conversationMap.get(otherUserId);
          if (new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)) {
            conversation.lastMessage = message;
          }
          if (message.receiverId === userId && !message.isRead) {
            conversation.unreadCount += 1;
          }
        }
      }
      
      const conversations = Array.from(conversationMap.values());
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/:userId", isAuthenticated, async (req, res) => {
    try {
      const otherUserId = parseInt(req.params.userId);
      const conversation = await storage.getConversation(req.user!.id, otherUserId);
      
      // Mark all received messages as read
      await Promise.all(
        conversation
          .filter(msg => msg.receiverId === req.user!.id && !msg.isRead)
          .map(msg => storage.markMessageAsRead(msg.id))
      );
      
      // Get other user info
      const otherUser = await storage.getUser(otherUserId);
      
      res.json({
        messages: conversation,
        user: otherUser ? {
          id: otherUser.id,
          username: otherUser.username,
          fullName: otherUser.fullName,
          profileImage: otherUser.profileImage,
          userType: otherUser.userType
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: Request, res: Response) => {
    console.log("INSIDE /api/messages POST handler");
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const senderId = req.user!.id;
      const { receiverId, content } = sendMessageSchema.parse(req.body);
      console.log(`[DEBUG] senderId: ${senderId}, receiverId: ${receiverId}, content: ${content}`);
      const message = await storage.createMessage({
        senderId,
        receiverId,
        content,
        isRead: false,
      });
      console.log('[DEBUG] message inserted:', message);
      return res.status(201).json({ message });
    } catch (error) {
      console.error('[ERROR] Failed to send message:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      if (error instanceof Error && (error as Error).stack) {
        return res.status(500).json({ message: "Failed to send message", error: (error as Error).stack });
      }
      res.status(500).json({ message: "Failed to send message", error });
    }
  });

  // Review routes
  app.post("/api/reviews", isStudent, async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse({
        ...req.body,
        studentId: req.user!.id
      });
      
      // Check if the assignment exists and belongs to this student
      const assignment = await storage.getAssignment(validatedData.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      if (assignment.studentId !== req.user!.id) {
        return res.status(403).json({ message: "You can only review assignments that you posted" });
      }
      
      // Check if the student has already reviewed this assignment
      const existingReviews = await storage.getReviewsByAssignmentId(validatedData.assignmentId);
      if (existingReviews.length > 0) {
        return res.status(400).json({ message: "You have already reviewed this assignment" });
      }
      
      const review = await storage.createReview(validatedData);
      
      // Update assignment status to completed if it's in progress
      if (assignment.status === 'in-progress') {
        await storage.updateAssignment(validatedData.assignmentId, { status: 'completed' });
      }
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get("/api/reviews/helper/:id", async (req, res) => {
    try {
      const helperId = parseInt(req.params.id);
      const reviews = await storage.getReviewsByHelperId(helperId);
      
      // Enrich reviews with student and assignment info
      const enrichedReviews = await Promise.all(
        reviews.map(async (review) => {
          const student = await storage.getUser(review.studentId);
          const assignment = await storage.getAssignment(review.assignmentId);
          
          return {
            ...review,
            student: student ? {
              id: student.id,
              username: student.username,
              fullName: student.fullName,
              profileImage: student.profileImage
            } : null,
            assignment: assignment ? {
              id: assignment.id,
              title: assignment.title
            } : null
          };
        })
      );
      
      res.json(enrichedReviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Doubt routes (Chegg-like quick questions)
  app.get("/api/doubts", async (req, res) => {
    try {
      const { subject, status } = req.query;
      let filters: any = {};
      
      if (subject) filters.subject = subject as string;
      if (status) filters.status = status as string;
      
      const doubts = await storage.getDoubts(filters);
      res.json(doubts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doubts" });
    }
  });

  app.get("/api/doubts/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const doubts = await storage.getRecentDoubts(limit);
      
      // Enrich doubt data with student info and answer count
      const enrichedDoubts = await Promise.all(
        doubts.map(async (doubt) => {
          const student = await storage.getUser(doubt.studentId);
          const answers = await storage.getAnswersByDoubtId(doubt.id);
          
          return {
            ...doubt,
            answerCount: answers.length,
            student: student ? {
              id: student.id,
              username: student.username,
              fullName: student.fullName,
              profileImage: student.profileImage
            } : null
          };
        })
      );
      
      res.json(enrichedDoubts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent doubts" });
    }
  });

  app.get("/api/doubts/:id", async (req, res) => {
    try {
      const doubtId = parseInt(req.params.id);
      const doubt = await storage.getDoubt(doubtId);
      
      if (!doubt) {
        return res.status(404).json({ message: "Doubt not found" });
      }
      
      // Get student info
      const student = await storage.getUser(doubt.studentId);
      
      // Get answers for this doubt
      const answers = await storage.getAnswersByDoubtId(doubtId);
      
      // Enrich answers with helper info
      const enrichedAnswers = await Promise.all(
        answers.map(async (answer) => {
          const helper = await storage.getUser(answer.helperId);
          return {
            ...answer,
            helper: helper ? {
              id: helper.id,
              username: helper.username,
              fullName: helper.fullName,
              profileImage: helper.profileImage,
              rating: helper.rating,
              reviewCount: helper.reviewCount
            } : null
          };
        })
      );
      
      res.json({
        ...doubt,
        student: student ? {
          id: student.id,
          username: student.username,
          fullName: student.fullName,
          profileImage: student.profileImage
        } : null,
        answers: enrichedAnswers
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doubt" });
    }
  });

  app.post("/api/doubts", isStudent, multer({ dest: path.join(__dirname, '../uploads/doubts'), limits: { fileSize: 5 * 1024 * 1024 } }).array('photos', 5), async (req: Request, res: Response) => {
    console.debug("[Doubt Request] body:", req.body, "files:", req.files);
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      const first = files[0];
      const imageUrl = first ? `/uploads/doubts/${first.filename}` : undefined;
      const user = req.user!;
      const { question } = req.body;
      // Use question as title and default subject
      const validatedData = insertDoubtSchema.parse({
        title: question,
        question,
        subject: 'General',
        image: imageUrl,
        studentId: user.id,
      });
      const doubt = await storage.createDoubt(validatedData);
      res.status(201).json(doubt);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error("[Doubt Validation Error]", err.errors);
        return res.status(400).json({ message: "Invalid doubt data", errors: err.errors });
      }
      res.status(500).json({ message: "Failed to create doubt" });
    }
  });

  app.patch("/api/doubts/:id", isAuthenticated, async (req, res) => {
    try {
      const doubtId = parseInt(req.params.id);
      const doubt = await storage.getDoubt(doubtId);
      
      if (!doubt) {
        return res.status(404).json({ message: "Doubt not found" });
      }
      
      // Only the student who created the doubt can update it
      if (doubt.studentId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized to update this doubt" });
      }
      
      const updatedDoubt = await storage.updateDoubt(doubtId, req.body);
      res.json(updatedDoubt);
    } catch (error) {
      res.status(500).json({ message: "Failed to update doubt" });
    }
  });

  app.get("/api/doubts/student/:id", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const doubts = await storage.getDoubtsByStudentId(studentId);
      res.json(doubts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student doubts" });
    }
  });

  app.get("/api/doubts/helper/:id", async (req, res) => {
    try {
      const helperId = parseInt(req.params.id);
      const doubts = await storage.getDoubtsByHelperId(helperId);
      res.json(doubts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch helper doubts" });
    }
  });

  app.get("/api/doubts/subject/:subject", async (req, res) => {
    try {
      const subject = req.params.subject;
      const doubts = await storage.getDoubtsBySubject(subject);
      res.json(doubts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doubts by subject" });
    }
  });

  // Answer routes
  app.get("/api/answers/doubt/:id", async (req, res) => {
    try {
      const doubtId = parseInt(req.params.id);
      const answers = await storage.getAnswersByDoubtId(doubtId);
      
      // Enrich answer data with helper info
      const enrichedAnswers = await Promise.all(
        answers.map(async (answer) => {
          const helper = await storage.getUser(answer.helperId);
          return {
            ...answer,
            helper: helper ? {
              id: helper.id,
              username: helper.username,
              fullName: helper.fullName,
              profileImage: helper.profileImage,
              rating: helper.rating,
              reviewCount: helper.reviewCount
            } : null
          };
        })
      );
      
      res.json(enrichedAnswers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch answers" });
    }
  });

  app.post("/api/answers", isHelper, async (req, res) => {
    try {
      const validatedData = insertAnswerSchema.parse({
        ...req.body,
        helperId: req.user!.id
      });
      
      // Check if the doubt exists and is open
      const doubt = await storage.getDoubt(validatedData.doubtId);
      if (!doubt) {
        return res.status(404).json({ message: "Doubt not found" });
      }
      
      if (doubt.status !== 'open') {
        return res.status(400).json({ message: "This doubt is not open for answers" });
      }
      
      const answer = await storage.createAnswer(validatedData);
      res.status(201).json(answer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid answer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create answer" });
    }
  });

  app.patch("/api/answers/:id/accept", isAuthenticated, async (req, res) => {
    try {
      const answerId = parseInt(req.params.id);
      const answer = await storage.getAnswer(answerId);
      
      if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
      }
      
      // Get the doubt to check if the current user is the student who posted it
      const doubt = await storage.getDoubt(answer.doubtId);
      
      // Only the student who posted the doubt can accept an answer
      if (!doubt || doubt.studentId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized to accept this answer" });
      }
      
      const updatedAnswer = await storage.acceptAnswer(answerId);
      res.json(updatedAnswer);
    } catch (error) {
      res.status(500).json({ message: "Failed to accept answer" });
    }
  });

  const uploadDir = path.join(__dirname, '../uploads');
  console.log('[DEBUG] Resolved uploadDir:', uploadDir);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const upload = multer({ dest: uploadDir, limits: { fileSize: 2 * 1024 * 1024 } });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Profile photo upload endpoint with error handling
  app.post('/api/user/photo', (req: any, res: any, next) => {
    upload.single('profileImage')(req, res, (err: any) => {
      if (err) {
        console.error('[DEBUG] Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds 2MB limit' });
        }
        return res.status(500).json({ message: 'Upload failed', error: err.message });
      }
      next();
    });
  }, (req: any, res: any) => {
    console.log('[DEBUG] Uploaded file:', req.file);
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    storage.updateUser((req.user as any).id, { profileImage: fileUrl })
      .then(updatedUser => {
        const { password, ...userWithoutPassword } = updatedUser!;
        res.json(userWithoutPassword);
      })
      .catch(error => {
        console.error('[DEBUG] Photo upload error:', error);
        res.status(500).json({ message: 'Failed to upload photo' });
      });
  });

  const assignmentDir = path.join(__dirname, '../uploads/assignments');
  if (!fs.existsSync(assignmentDir)) fs.mkdirSync(assignmentDir, { recursive: true });
  const assignmentUpload = multer({ dest: assignmentDir, limits: { fileSize: 5 * 1024 * 1024 } });

  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  const doubtDir = path.join(__dirname, '../uploads/doubts');
  if (!fs.existsSync(doubtDir)) fs.mkdirSync(doubtDir, { recursive: true });
  const doubtUpload = multer({ dest: doubtDir, limits: { fileSize: 5 * 1024 * 1024 } });

  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  const httpServer = createServer(app);
  return httpServer;
}
