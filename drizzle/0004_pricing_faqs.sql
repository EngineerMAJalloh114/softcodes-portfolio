ALTER TYPE "public"."content_section_key" ADD VALUE 'pricing';--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"draft" jsonb,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faqs_question_unique" UNIQUE("question")
);
--> statement-breakpoint
CREATE TABLE "pricing_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price_usd_minor" bigint NOT NULL,
	"price_sle_minor" bigint NOT NULL,
	"unit" text DEFAULT '' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"draft" jsonb,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pricing_packages_slug_unique" UNIQUE("slug"),
	CONSTRAINT "pricing_packages_usd_nonnegative" CHECK ("pricing_packages"."price_usd_minor" >= 0),
	CONSTRAINT "pricing_packages_sle_nonnegative" CHECK ("pricing_packages"."price_sle_minor" >= 0)
);
--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_packages" ADD CONSTRAINT "pricing_packages_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;