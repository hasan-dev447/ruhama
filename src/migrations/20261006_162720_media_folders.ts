import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_media_folder" AS ENUM('auto', 'articles', 'events', 'courses', 'people', 'circles', 'site');
  ALTER TABLE "media" ADD COLUMN "folder" "enum_media_folder" DEFAULT 'auto';
  ALTER TABLE "media" ADD COLUMN "prefix" varchar;
  ALTER TABLE "media" ADD COLUMN "_objectkey" varchar;
  CREATE INDEX "media_folder_idx" ON "media" USING btree ("folder");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_folder_idx";
  ALTER TABLE "media" DROP COLUMN "folder";
  ALTER TABLE "media" DROP COLUMN "prefix";
  ALTER TABLE "media" DROP COLUMN "_objectkey";
  DROP TYPE "public"."enum_media_folder";`)
}
