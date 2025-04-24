import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import {
  insertAssignmentSchema,
  insertBidSchema,
  insertMessageSchema,
  insertReviewSchema,
  insertDoubtSchema,
  insertAnswerSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Helper middleware to check if user is authenticated
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Helper middleware to check if user is a student
  const isStudent = (req, res, next) => {
    if (req.isAuthenticated() && req.user.userType === 'student') return next();
    return res.status(403).json({ message: "Only students can perform this action" });
  };

  // Helper middleware to check if user is a helper
  const isHelper = (req, res, next) => {
    if (req.isAuthenticated() && req.user.userType === 'helper') return next();
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

  app.post("/api/assignments", isStudent, async (req, res) => {
    try {
      const validatedData = insertAssignmentSchema.parse({
        ...req.body,
        studentId: req.user.id
      });
      
      const assignment = await storage.createAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assignment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.patch("/api/assignments/:id", isAuthenticated, async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Only the student who created the assignment can update it
      if (assignment.studentId !== req.user.id && req.user.userType !== 'helper') {
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
      if (helperId !== req.user.id && req.user.userType !== 'helper') {
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
        helperId: req.user.id
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
      const existingBids = await storage.getBidsByHelperId(req.user.id);
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
      if (assignment?.studentId !== req.user.id && bid.helperId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to update this bid" });
      }
      
      // If the student is accepting a bid
      if (req.body.status === 'accepted' && assignment?.studentId === req.user.id) {
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
      
      // Enrich reviews with student info
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
  app.get("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getMessagesByUserId(req.user.id);
      
      // Group messages by conversation
      const conversationMap = new Map();
      
      for (const message of messages) {
        const otherUserId = message.senderId === req.user.id ? message.receiverId : message.senderId;
        
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
            unreadCount: message.receiverId === req.user.id && !message.isRead ? 1 : 0
          });
        } else {
          const conversation = conversationMap.get(otherUserId);
          if (new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)) {
            conversation.lastMessage = message;
          }
          if (message.receiverId === req.user.id && !message.isRead) {
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
      const conversation = await storage.getConversation(req.user.id, otherUserId);
      
      // Mark all received messages as read
      await Promise.all(
        conversation
          .filter(msg => msg.receiverId === req.user.id && !msg.isRead)
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

  app.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id
      });
      
      // Check if receiver exists
      const receiver = await storage.getUser(validatedData.receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }
      
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Review routes
  app.post("/api/reviews", isStudent, async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse({
        ...req.body,
        studentId: req.user.id
      });
      
      // Check if the assignment exists and belongs to this student
      const assignment = await storage.getAssignment(validatedData.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      if (assignment.studentId !== req.user.id) {
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

  app.post("/api/doubts", isStudent, async (req, res) => {
    try {
      const validatedData = insertDoubtSchema.parse({
        ...req.body,
        studentId: req.user.id
      });
      
      const doubt = await storage.createDoubt(validatedData);
      res.status(201).json(doubt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid doubt data", errors: error.errors });
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
      if (doubt.studentId !== req.user.id) {
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
        helperId: req.user.id
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
      if (!doubt || doubt.studentId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to accept this answer" });
      }
      
      const updatedAnswer = await storage.acceptAnswer(answerId);
      res.json(updatedAnswer);
    } catch (error) {
      res.status(500).json({ message: "Failed to accept answer" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
