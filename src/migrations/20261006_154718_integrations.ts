import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_integrations_sms_provider" AS ENUM('console', 'bd_gateway');
  CREATE TABLE "integrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"google_enabled" boolean DEFAULT true,
  	"google_client_id" varchar,
  	"google_client_secret_enc" varchar,
  	"google_client_secret_hint" varchar,
  	"facebook_enabled" boolean DEFAULT true,
  	"facebook_client_id" varchar,
  	"facebook_client_secret_enc" varchar,
  	"facebook_client_secret_hint" varchar,
  	"sms_provider" "enum_integrations_sms_provider" DEFAULT 'console',
  	"sms_api_url" varchar,
  	"sms_api_key_enc" varchar,
  	"sms_api_key_hint" varchar,
  	"sms_sender_id" varchar,
  	"email_resend_api_key_enc" varchar,
  	"email_resend_api_key_hint" varchar,
  	"email_from" varchar,
  	"email_reply_to" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
  // holds encrypted credentials: keep it closed to Supabase's public Data API like every other table
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE public.integrations FROM anon, authenticated;
        ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "integrations" CASCADE;
  DROP TYPE "public"."enum_integrations_sms_provider";`)
}
