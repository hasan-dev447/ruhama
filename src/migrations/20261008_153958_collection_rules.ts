import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_audit_logs_action" ADD VALUE 'rules_change' BEFORE 'account_deletion';
  CREATE TABLE "collection_rules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"rules" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "events" ALTER COLUMN "capacity" DROP DEFAULT;
  ALTER TABLE "_events_v" ALTER COLUMN "version_capacity" DROP DEFAULT;`)
  // read through Payload only; closed to Supabase's Data API
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE public.collection_rules FROM anon, authenticated;
        ALTER TABLE public.collection_rules ENABLE ROW LEVEL SECURITY;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "collection_rules" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "collection_rules" CASCADE;
  ALTER TABLE "audit_logs" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_logs_action";
  CREATE TYPE "public"."enum_audit_logs_action" AS ENUM('role_change', 'submit', 'approve', 'request_changes', 'publish', 'unpublish', 'withdraw', 'moderation', 'account_deletion');
  ALTER TABLE "audit_logs" ALTER COLUMN "action" SET DATA TYPE "public"."enum_audit_logs_action" USING "action"::"public"."enum_audit_logs_action";
  ALTER TABLE "events" ALTER COLUMN "capacity" SET DEFAULT 100;
  ALTER TABLE "_events_v" ALTER COLUMN "version_capacity" SET DEFAULT 100;`)
}
