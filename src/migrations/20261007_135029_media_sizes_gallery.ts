import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "sizes_w480_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w480_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w480_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w480_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w480_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w480_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w960_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w960_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w960_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w960_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_w960_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_w960_filename" varchar;
  CREATE INDEX "media_sizes_w480_sizes_w480_filename_idx" ON "media" USING btree ("sizes_w480_filename");
  CREATE INDEX "media_sizes_w960_sizes_w960_filename_idx" ON "media" USING btree ("sizes_w960_filename");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_sizes_w480_sizes_w480_filename_idx";
  DROP INDEX "media_sizes_w960_sizes_w960_filename_idx";
  ALTER TABLE "media" DROP COLUMN "sizes_w480_url";
  ALTER TABLE "media" DROP COLUMN "sizes_w480_width";
  ALTER TABLE "media" DROP COLUMN "sizes_w480_height";
  ALTER TABLE "media" DROP COLUMN "sizes_w480_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_w480_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_w480_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_w960_url";
  ALTER TABLE "media" DROP COLUMN "sizes_w960_width";
  ALTER TABLE "media" DROP COLUMN "sizes_w960_height";
  ALTER TABLE "media" DROP COLUMN "sizes_w960_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_w960_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_w960_filename";`)
}
