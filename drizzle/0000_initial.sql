CREATE TABLE IF NOT EXISTS "verification_codes" (
  "id" serial PRIMARY KEY,
  "email" text NOT NULL,
  "code" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "expires_at" timestamp NOT NULL,
  "used" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "unverified_users" (
  "email" text PRIMARY KEY,
  "username" text NOT NULL,
  "password" text NOT NULL,
  "full_name" text NOT NULL,
  "user_type" text NOT NULL CHECK ("user_type" IN ('student', 'helper')),
  "bio" text,
  "skills" text[],
  "profile_image" text,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "username" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "full_name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "user_type" text NOT NULL CHECK ("user_type" IN ('student', 'helper')),
  "is_verified" boolean DEFAULT false,
  "bio" text,
  "skills" text[],
  "profile_image" text,
  "rating" integer DEFAULT 0,
  "review_count" integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "assignments" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "budget" integer NOT NULL,
  "deadline" timestamp NOT NULL,
  "category" text NOT NULL,
  "is_open" boolean DEFAULT true,
  "student_id" integer NOT NULL,
  "helper_id" integer,
  "created_at" timestamp DEFAULT now(),
  "status" text DEFAULT 'open',
  FOREIGN KEY ("student_id") REFERENCES "users" ("id"),
  FOREIGN KEY ("helper_id") REFERENCES "users" ("id")
);

CREATE TABLE IF NOT EXISTS "bids" (
  "id" serial PRIMARY KEY,
  "assignment_id" integer NOT NULL,
  "helper_id" integer NOT NULL,
  "amount" integer NOT NULL,
  "description" text NOT NULL,
  "status" text DEFAULT 'pending',
  "created_at" timestamp DEFAULT now(),
  FOREIGN KEY ("assignment_id") REFERENCES "assignments" ("id"),
  FOREIGN KEY ("helper_id") REFERENCES "users" ("id")
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id" serial PRIMARY KEY,
  "sender_id" integer NOT NULL,
  "receiver_id" integer NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "is_read" boolean DEFAULT false,
  FOREIGN KEY ("sender_id") REFERENCES "users" ("id"),
  FOREIGN KEY ("receiver_id") REFERENCES "users" ("id")
);

CREATE TABLE IF NOT EXISTS "reviews" (
  "id" serial PRIMARY KEY,
  "assignment_id" integer NOT NULL,
  "student_id" integer NOT NULL,
  "helper_id" integer NOT NULL,
  "rating" integer NOT NULL,
  "comment" text,
  "created_at" timestamp DEFAULT now(),
  FOREIGN KEY ("assignment_id") REFERENCES "assignments" ("id"),
  FOREIGN KEY ("student_id") REFERENCES "users" ("id"),
  FOREIGN KEY ("helper_id") REFERENCES "users" ("id")
);

CREATE TABLE IF NOT EXISTS "doubts" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "question" text NOT NULL,
  "subject" text NOT NULL,
  "sub_topic" text,
  "student_id" integer NOT NULL,
  "helper_id" integer,
  "created_at" timestamp DEFAULT now(),
  "status" text DEFAULT 'open',
  FOREIGN KEY ("student_id") REFERENCES "users" ("id"),
  FOREIGN KEY ("helper_id") REFERENCES "users" ("id")
);

CREATE TABLE IF NOT EXISTS "answers" (
  "id" serial PRIMARY KEY,
  "doubt_id" integer NOT NULL,
  "helper_id" integer NOT NULL,
  "answer" text NOT NULL,
  "image" text,
  "created_at" timestamp DEFAULT now(),
  FOREIGN KEY ("doubt_id") REFERENCES "doubts" ("id"),
  FOREIGN KEY ("helper_id") REFERENCES "users" ("id")
);
