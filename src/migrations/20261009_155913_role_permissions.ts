import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_audit_logs_action" ADD VALUE 'permissions_change' BEFORE 'account_deletion';
  CREATE TABLE "role_permissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"matrix" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
  // read through Payload only; closed to Supabase's Data API
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE public.role_permissions FROM anon, authenticated;
        ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "role_permissions" CASCADE;
  ALTER TABLE "audit_logs" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_logs_action";
  CREATE TYPE "public"."enum_audit_logs_action" AS ENUM('role_change', 'submit', 'approve', 'request_changes', 'publish', 'unpublish', 'withdraw', 'moderation', 'rules_change', 'profile_review', 'account_deletion');
  ALTER TABLE "audit_logs" ALTER COLUMN "action" SET DATA TYPE "public"."enum_audit_logs_action" USING "action"::"public"."enum_audit_logs_action";`)
}
