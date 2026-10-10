import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" ADD COLUMN "max_guests" numeric;
  ALTER TABLE "_events_v" ADD COLUMN "version_max_guests" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" DROP COLUMN "max_guests";
  ALTER TABLE "_events_v" DROP COLUMN "version_max_guests";`)
}
