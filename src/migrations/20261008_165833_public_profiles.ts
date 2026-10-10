import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_users_role" ADD VALUE 'scholar' BEFORE 'member';
  ALTER TYPE "public"."enum_users_role" ADD VALUE 'speaker' BEFORE 'member';
  ALTER TYPE "public"."enum__users_v_version_role" ADD VALUE 'scholar' BEFORE 'member';
  ALTER TYPE "public"."enum__users_v_version_role" ADD VALUE 'speaker' BEFORE 'member';
  ALTER TYPE "public"."enum_admin_invitations_role" ADD VALUE 'scholar' BEFORE 'member';
  ALTER TYPE "public"."enum_admin_invitations_role" ADD VALUE 'speaker' BEFORE 'member';
  ALTER TYPE "public"."enum_audit_logs_action" ADD VALUE 'profile_review' BEFORE 'account_deletion';
  ALTER TABLE "people" ADD COLUMN "pending_changes" jsonb;
  ALTER TABLE "people" ADD COLUMN "pending_at" timestamp(3) with time zone;
  CREATE INDEX "people_pending_at_idx" ON "people" USING btree ("pending_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_role" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('super_admin', 'shura', 'reviewer', 'editor', 'author', 'moderator', 'member');
  ALTER TABLE "users_role" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_role" USING "value"::"public"."enum_users_role";
  ALTER TABLE "_users_v_version_role" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum__users_v_version_role";
  CREATE TYPE "public"."enum__users_v_version_role" AS ENUM('super_admin', 'shura', 'reviewer', 'editor', 'author', 'moderator', 'member');
  ALTER TABLE "_users_v_version_role" ALTER COLUMN "value" SET DATA TYPE "public"."enum__users_v_version_role" USING "value"::"public"."enum__users_v_version_role";
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DEFAULT 'super_admin'::text;
  DROP TYPE "public"."enum_admin_invitations_role";
  CREATE TYPE "public"."enum_admin_invitations_role" AS ENUM('super_admin', 'shura', 'reviewer', 'editor', 'author', 'moderator', 'member');
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DEFAULT 'super_admin'::"public"."enum_admin_invitations_role";
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DATA TYPE "public"."enum_admin_invitations_role" USING "role"::"public"."enum_admin_invitations_role";
  ALTER TABLE "audit_logs" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_logs_action";
  CREATE TYPE "public"."enum_audit_logs_action" AS ENUM('role_change', 'submit', 'approve', 'request_changes', 'publish', 'unpublish', 'withdraw', 'moderation', 'rules_change', 'account_deletion');
  ALTER TABLE "audit_logs" ALTER COLUMN "action" SET DATA TYPE "public"."enum_audit_logs_action" USING "action"::"public"."enum_audit_logs_action";
  DROP INDEX "people_pending_at_idx";
  ALTER TABLE "people" DROP COLUMN "pending_changes";
  ALTER TABLE "people" DROP COLUMN "pending_at";`)
}
