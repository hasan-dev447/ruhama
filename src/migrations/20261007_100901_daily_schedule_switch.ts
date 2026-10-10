import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" ADD COLUMN "daily_scheduled" boolean DEFAULT true;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_daily_scheduled" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" DROP COLUMN "daily_scheduled";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_daily_scheduled";`)
}
