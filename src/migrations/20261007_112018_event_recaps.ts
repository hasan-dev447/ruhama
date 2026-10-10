import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_event_recaps_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__event_recaps_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "event_recaps_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"title" varchar,
  	"youtube_id" varchar
  );
  
  CREATE TABLE "event_recaps" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" integer,
  	"summary" varchar,
  	"attendance" numeric,
  	"content" jsonb,
  	"title" varchar,
  	"event_date" timestamp(3) with time zone,
  	"notified_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_event_recaps_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "event_recaps_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_event_recaps_v_version_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"title" varchar,
  	"youtube_id" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_event_recaps_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_event_id" integer,
  	"version_summary" varchar,
  	"version_attendance" numeric,
  	"version_content" jsonb,
  	"version_title" varchar,
  	"version_event_date" timestamp(3) with time zone,
  	"version_notified_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__event_recaps_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_event_recaps_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "event_recaps_id" integer;
  ALTER TABLE "home_page" ADD COLUMN "events_past_title" varchar DEFAULT 'সাম্প্রতিক মজলিস';
  ALTER TABLE "_home_page_v" ADD COLUMN "version_events_past_title" varchar DEFAULT 'সাম্প্রতিক মজলিস';
  ALTER TABLE "event_recaps_videos" ADD CONSTRAINT "event_recaps_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_recaps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_recaps" ADD CONSTRAINT "event_recaps_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_recaps_rels" ADD CONSTRAINT "event_recaps_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."event_recaps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_recaps_rels" ADD CONSTRAINT "event_recaps_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_event_recaps_v_version_videos" ADD CONSTRAINT "_event_recaps_v_version_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_event_recaps_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_event_recaps_v" ADD CONSTRAINT "_event_recaps_v_parent_id_event_recaps_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."event_recaps"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_event_recaps_v" ADD CONSTRAINT "_event_recaps_v_version_event_id_events_id_fk" FOREIGN KEY ("version_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_event_recaps_v_rels" ADD CONSTRAINT "_event_recaps_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_event_recaps_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_event_recaps_v_rels" ADD CONSTRAINT "_event_recaps_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "event_recaps_videos_order_idx" ON "event_recaps_videos" USING btree ("_order");
  CREATE INDEX "event_recaps_videos_parent_id_idx" ON "event_recaps_videos" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "event_recaps_event_idx" ON "event_recaps" USING btree ("event_id");
  CREATE INDEX "event_recaps_event_date_idx" ON "event_recaps" USING btree ("event_date");
  CREATE INDEX "event_recaps_updated_at_idx" ON "event_recaps" USING btree ("updated_at");
  CREATE INDEX "event_recaps_created_at_idx" ON "event_recaps" USING btree ("created_at");
  CREATE INDEX "event_recaps__status_idx" ON "event_recaps" USING btree ("_status");
  CREATE INDEX "event_recaps_rels_order_idx" ON "event_recaps_rels" USING btree ("order");
  CREATE INDEX "event_recaps_rels_parent_idx" ON "event_recaps_rels" USING btree ("parent_id");
  CREATE INDEX "event_recaps_rels_path_idx" ON "event_recaps_rels" USING btree ("path");
  CREATE INDEX "event_recaps_rels_media_id_idx" ON "event_recaps_rels" USING btree ("media_id");
  CREATE INDEX "_event_recaps_v_version_videos_order_idx" ON "_event_recaps_v_version_videos" USING btree ("_order");
  CREATE INDEX "_event_recaps_v_version_videos_parent_id_idx" ON "_event_recaps_v_version_videos" USING btree ("_parent_id");
  CREATE INDEX "_event_recaps_v_parent_idx" ON "_event_recaps_v" USING btree ("parent_id");
  CREATE INDEX "_event_recaps_v_version_version_event_idx" ON "_event_recaps_v" USING btree ("version_event_id");
  CREATE INDEX "_event_recaps_v_version_version_event_date_idx" ON "_event_recaps_v" USING btree ("version_event_date");
  CREATE INDEX "_event_recaps_v_version_version_updated_at_idx" ON "_event_recaps_v" USING btree ("version_updated_at");
  CREATE INDEX "_event_recaps_v_version_version_created_at_idx" ON "_event_recaps_v" USING btree ("version_created_at");
  CREATE INDEX "_event_recaps_v_version_version__status_idx" ON "_event_recaps_v" USING btree ("version__status");
  CREATE INDEX "_event_recaps_v_created_at_idx" ON "_event_recaps_v" USING btree ("created_at");
  CREATE INDEX "_event_recaps_v_updated_at_idx" ON "_event_recaps_v" USING btree ("updated_at");
  CREATE INDEX "_event_recaps_v_latest_idx" ON "_event_recaps_v" USING btree ("latest");
  CREATE INDEX "_event_recaps_v_rels_order_idx" ON "_event_recaps_v_rels" USING btree ("order");
  CREATE INDEX "_event_recaps_v_rels_parent_idx" ON "_event_recaps_v_rels" USING btree ("parent_id");
  CREATE INDEX "_event_recaps_v_rels_path_idx" ON "_event_recaps_v_rels" USING btree ("path");
  CREATE INDEX "_event_recaps_v_rels_media_id_idx" ON "_event_recaps_v_rels" USING btree ("media_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_recaps_fk" FOREIGN KEY ("event_recaps_id") REFERENCES "public"."event_recaps"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_event_recaps_id_idx" ON "payload_locked_documents_rels" USING btree ("event_recaps_id");`)
  // the app reads these through Payload only; keep them closed to Supabase's Data API
  await db.execute(sql`
    DO $$
    DECLARE t text;
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        FOREACH t IN ARRAY ARRAY['event_recaps', 'event_recaps_videos', 'event_recaps_rels',
          '_event_recaps_v', '_event_recaps_v_version_videos', '_event_recaps_v_rels'] LOOP
          EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
          EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        END LOOP;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "event_recaps_videos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_recaps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_recaps_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_event_recaps_v_version_videos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_event_recaps_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_event_recaps_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "event_recaps_videos" CASCADE;
  DROP TABLE "event_recaps" CASCADE;
  DROP TABLE "event_recaps_rels" CASCADE;
  DROP TABLE "_event_recaps_v_version_videos" CASCADE;
  DROP TABLE "_event_recaps_v" CASCADE;
  DROP TABLE "_event_recaps_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_event_recaps_fk";
  
  DROP INDEX "payload_locked_documents_rels_event_recaps_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "event_recaps_id";
  ALTER TABLE "home_page" DROP COLUMN "events_past_title";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_events_past_title";
  DROP TYPE "public"."enum_event_recaps_status";
  DROP TYPE "public"."enum__event_recaps_v_version_status";`)
}
