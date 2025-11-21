ALTER TABLE "docs" ADD COLUMN "title" text DEFAULT 'Untitled Document' NOT NULL;--> statement-breakpoint
ALTER TABLE "docs" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "docs" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "docs" SET "created_by" = 'system' WHERE "created_by" IS NULL;--> statement-breakpoint
ALTER TABLE "docs" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "docs" ADD CONSTRAINT "docs_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;