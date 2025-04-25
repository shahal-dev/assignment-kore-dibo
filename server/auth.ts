import { config } from 'dotenv';
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import express, { Express } from "express";
import session from "express-session";

config();
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { sendVerificationEmail } from "./email";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.JWT_SECRET || "assignment-kore-dibo-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    }
  };

  app.set("trust proxy", 1);
  const sessionMiddleware = session(sessionSettings);
  const passportInitialize = passport.initialize();
  const passportSession = passport.session();
  
  app.use((req, res, next) => sessionMiddleware(req, res, next));
  app.use((req, res, next) => passportInitialize(req, res, next));
  app.use((req, res, next) => passportSession(req, res, next));

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    console.log("[DEBUG] Registration request:", req.body);
    try {
      const validatedData = insertUserSchema.parse(req.body);
      console.log("[DEBUG] Validated data:", validatedData);

      // Check if user exists with same email or username
      const [existingEmail, existingUsername] = await Promise.all([
        storage.getUserByEmail(validatedData.email),
        storage.getUserByUsername(validatedData.username)
      ]);
      console.log("[DEBUG] Existing email user:", existingEmail);
      console.log("[DEBUG] Existing username user:", existingUsername);
      
      if (existingEmail?.isVerified) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Generate verification code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await storage.createVerificationCode({
        email: validatedData.email,
        code,
        expiresAt
      });

      // Store user data temporarily
      console.log("[DEBUG] Creating unverified user...");
      await storage.createUnverifiedUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
      });

      // Send verification email
      await sendVerificationEmail(validatedData.email, code);

      res.status(200).json({ message: "Verification code sent" });
    } catch (error) {
      console.error("[DEBUG] Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.status(200).json(userWithoutPassword);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });

  // Update user profile
  app.patch("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const allowedFields = ['fullName', 'bio', 'skills', 'profileImage'];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    storage.updateUser(req.user.id, updateData)
      .then(updatedUser => {
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
        // Remove password from response
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      })
      .catch(error => {
        res.status(500).json({ message: "Failed to update user" });
      });
  });

  app.post("/api/verify", async (req, res) => {
    try {
      const { email, code } = req.body;

      const verificationCode = await storage.getVerificationCode(email, code);
      if (!verificationCode || verificationCode.used || new Date() > verificationCode.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      const userData = await storage.getUnverifiedUser(email);
      if (!userData) {
        return res.status(400).json({ message: "No registration found" });
      }

      // Create verified user
      // Create the actual user
      const user = await storage.createUser({
        email: userData.email,
        username: userData.username,
        fullName: userData.fullName,
        password: userData.password,
        userType: userData.userType,
        bio: userData.bio || undefined,
        skills: userData.skills || undefined,
        profileImage: userData.profileImage || undefined
      });
      await storage.markVerificationCodeUsed(verificationCode.id);

      // Log user in using a promise wrapper
      await new Promise<void>((resolve, reject) => {
        req.login(user, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Verification failed" });
    }
  });
}