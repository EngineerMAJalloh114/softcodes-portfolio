-- T7a: the contact form now submits a quote request (M-03) instead of opening the email app.
-- Replace the old mailto button text and note, only where they still have the seeded values
-- (owner edits are kept). New labels come from the seed via the loader's merge.
UPDATE "content_sections"
SET "data" = jsonb_set("data", '{form,submitLabel}', '"Send request"')
WHERE "key" = 'contact_section' AND "data" #>> '{form,submitLabel}' = 'Send email';
--> statement-breakpoint
UPDATE "content_sections"
SET "data" = jsonb_set("data", '{form,note}', '"I reply within one working day. Your details are only used to answer your request."')
WHERE "key" = 'contact_section' AND "data" #>> '{form,note}' = 'This opens your email app with the message ready to send.';
