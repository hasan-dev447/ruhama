import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "contacts_index" varchar;
  ALTER TABLE "_users_v" ADD COLUMN "version_contacts_index" varchar;
  CREATE INDEX "users_contacts_index_idx" ON "users" USING btree ("contacts_index");
  CREATE INDEX "_users_v_version_version_contacts_index_idx" ON "_users_v" USING btree ("version_contacts_index");`)
  // fill the index for existing members: emails and numbers (numbers also without +88)
  await db.execute(sql`
    UPDATE users u SET contacts_index = lower(concat_ws(' ',
      u.email,
      u.phone_number,
      CASE WHEN u.phone_number LIKE '+88%' THEN substr(u.phone_number, 4) END,
      (SELECT string_agg(
         CASE WHEN c.value LIKE '+88%' THEN c.value || ' ' || substr(c.value, 4) ELSE c.value END, ' ')
       FROM user_contacts c WHERE c.user_id = u.id)
    ));
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "users_contacts_index_idx";
  DROP INDEX "_users_v_version_version_contacts_index_idx";
  ALTER TABLE "users" DROP COLUMN "contacts_index";
  ALTER TABLE "_users_v" DROP COLUMN "version_contacts_index";`)
}
