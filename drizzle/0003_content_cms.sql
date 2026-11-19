ALTER TYPE "public"."content_section_key" ADD VALUE 'process';--> statement-breakpoint
ALTER TABLE "content_sections" ADD COLUMN "draft" jsonb;--> statement-breakpoint
ALTER TABLE "content_sections" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "filename" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "type" text DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "draft" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "draft" jsonb;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "stack_items" ADD COLUMN "published" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "stack_items" ADD COLUMN "draft" jsonb;--> statement-breakpoint
ALTER TABLE "stack_items" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "content_sections" ADD CONSTRAINT "content_sections_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stack_items" ADD CONSTRAINT "stack_items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;