import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forum_threads" ALTER COLUMN "author_id" DROP NOT NULL;
  ALTER TABLE "forum_posts" ALTER COLUMN "author_id" DROP NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forum_threads" ALTER COLUMN "author_id" SET NOT NULL;
  ALTER TABLE "forum_posts" ALTER COLUMN "author_id" SET NOT NULL;`)
}
