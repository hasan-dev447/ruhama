import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_youtube_connections_status" AS ENUM('active', 'revoked');
  CREATE TYPE "public"."enum_integrations_youtube_audience" AS ENUM('staff', 'members');
  CREATE TABLE "youtube_connections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"channel_id" varchar NOT NULL,
  	"channel_title" varchar,
  	"channel_handle" varchar,
  	"channel_thumb" varchar,
  	"uploads_playlist_id" varchar,
  	"status" "enum_youtube_connections_status" DEFAULT 'active',
  	"scope" varchar,
  	"refresh_token_enc" varchar,
  	"connected_at" timestamp(3) with time zone,
  	"last_used_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "youtube_connections_id" integer;
  ALTER TABLE "integrations" ADD COLUMN "youtube_enabled" boolean DEFAULT false;
  ALTER TABLE "integrations" ADD COLUMN "youtube_audience" "enum_integrations_youtube_audience" DEFAULT 'staff';
  ALTER TABLE "integrations" ADD COLUMN "youtube_client_id" varchar;
  ALTER TABLE "integrations" ADD COLUMN "youtube_client_secret_enc" varchar;
  ALTER TABLE "integrations" ADD COLUMN "youtube_client_secret_hint" varchar;
  ALTER TABLE "youtube_connections" ADD CONSTRAINT "youtube_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "youtube_connections_user_idx" ON "youtube_connections" USING btree ("user_id");
  CREATE INDEX "youtube_connections_channel_id_idx" ON "youtube_connections" USING btree ("channel_id");
  CREATE INDEX "youtube_connections_updated_at_idx" ON "youtube_connections" USING btree ("updated_at");
  CREATE INDEX "youtube_connections_created_at_idx" ON "youtube_connections" USING btree ("created_at");
  CREATE UNIQUE INDEX "user_channelId_idx" ON "youtube_connections" USING btree ("user_id","channel_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_youtube_connections_fk" FOREIGN KEY ("youtube_connections_id") REFERENCES "public"."youtube_connections"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_youtube_connections_id_idx" ON "payload_locked_documents_rels" USING btree ("youtube_connections_id");`)
  // a connected channel goes with its account (its token too), and the table stays closed to Supabase's Data API
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE public.youtube_connections FROM anon, authenticated;
        ALTER TABLE public.youtube_connections ENABLE ROW LEVEL SECURITY;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "youtube_connections" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "youtube_connections" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_youtube_connections_fk";
  
  DROP INDEX "payload_locked_documents_rels_youtube_connections_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "youtube_connections_id";
  ALTER TABLE "integrations" DROP COLUMN "youtube_enabled";
  ALTER TABLE "integrations" DROP COLUMN "youtube_audience";
  ALTER TABLE "integrations" DROP COLUMN "youtube_client_id";
  ALTER TABLE "integrations" DROP COLUMN "youtube_client_secret_enc";
  ALTER TABLE "integrations" DROP COLUMN "youtube_client_secret_hint";
  DROP TYPE "public"."enum_youtube_connections_status";
  DROP TYPE "public"."enum_integrations_youtube_audience";`)
}
