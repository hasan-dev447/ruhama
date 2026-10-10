import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "about_page_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer
  );
  
  CREATE TABLE "_about_page_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer
  );
  
  ALTER TABLE "about_page_rels" ADD CONSTRAINT "about_page_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_rels" ADD CONSTRAINT "about_page_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v_rels" ADD CONSTRAINT "_about_page_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v_rels" ADD CONSTRAINT "_about_page_v_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "about_page_rels_order_idx" ON "about_page_rels" USING btree ("order");
  CREATE INDEX "about_page_rels_parent_idx" ON "about_page_rels" USING btree ("parent_id");
  CREATE INDEX "about_page_rels_path_idx" ON "about_page_rels" USING btree ("path");
  CREATE INDEX "about_page_rels_people_id_idx" ON "about_page_rels" USING btree ("people_id");
  CREATE INDEX "_about_page_v_rels_order_idx" ON "_about_page_v_rels" USING btree ("order");
  CREATE INDEX "_about_page_v_rels_parent_idx" ON "_about_page_v_rels" USING btree ("parent_id");
  CREATE INDEX "_about_page_v_rels_path_idx" ON "_about_page_v_rels" USING btree ("path");
  CREATE INDEX "_about_page_v_rels_people_id_idx" ON "_about_page_v_rels" USING btree ("people_id");`)
  // read through Payload only; closed to Supabase's Data API
  await db.execute(sql`
    DO $$
    DECLARE t text;
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        FOREACH t IN ARRAY ARRAY['about_page_rels', '_about_page_v_rels'] LOOP
          EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
          EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        END LOOP;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "about_page_rels" CASCADE;
  DROP TABLE "_about_page_v_rels" CASCADE;`)
}
