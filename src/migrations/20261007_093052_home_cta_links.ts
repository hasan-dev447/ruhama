import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" ADD COLUMN "primary_cta_href" varchar DEFAULT '#journey';
  ALTER TABLE "home_page" ADD COLUMN "secondary_cta_href" varchar DEFAULT '/about';
  ALTER TABLE "_home_page_v" ADD COLUMN "version_primary_cta_href" varchar DEFAULT '#journey';
  ALTER TABLE "_home_page_v" ADD COLUMN "version_secondary_cta_href" varchar DEFAULT '/about';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" DROP COLUMN "primary_cta_href";
  ALTER TABLE "home_page" DROP COLUMN "secondary_cta_href";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_primary_cta_href";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_secondary_cta_href";`)
}
