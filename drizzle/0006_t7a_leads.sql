CREATE TABLE "counters" (
	"key" text PRIMARY KEY NOT NULL,
	"value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" uuid NOT NULL,
	"author_id" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"href" text,
	"entity_id" text,
	"email" text DEFAULT 'not_configured' NOT NULL,
	"read_at" timestamp with time zone,
	"read_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- "qualified" was never used; rename in place instead of drop/recreate (keeps the column intact).
ALTER TYPE "public"."lead_status" RENAME VALUE 'qualified' TO 'quoted';--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "reference" text NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "company" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "budget_currency" text;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_read_by_users_id_fk" FOREIGN KEY ("read_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_notes_lead_idx" ON "lead_notes" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_unread_idx" ON "notifications" USING btree ("read_at","created_at");--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_reference_unique" UNIQUE("reference");--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_budget_currency" CHECK ("leads"."budget_currency" is null or "leads"."budget_currency" in ('USD', 'SLE'));