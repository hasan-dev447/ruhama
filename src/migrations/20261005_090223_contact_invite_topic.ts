import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_contact_messages_topic" ADD VALUE 'invite';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contact_messages" ALTER COLUMN "topic" SET DATA TYPE text;
  ALTER TABLE "contact_messages" ALTER COLUMN "topic" SET DEFAULT 'general'::text;
  DROP TYPE "public"."enum_contact_messages_topic";
  CREATE TYPE "public"."enum_contact_messages_topic" AS ENUM('general', 'correction', 'partnership', 'technical');
  ALTER TABLE "contact_messages" ALTER COLUMN "topic" SET DEFAULT 'general'::"public"."enum_contact_messages_topic";
  ALTER TABLE "contact_messages" ALTER COLUMN "topic" SET DATA TYPE "public"."enum_contact_messages_topic" USING "topic"::"public"."enum_contact_messages_topic";`)
}
