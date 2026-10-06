import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_gender" AS ENUM('male', 'female');
  CREATE TYPE "public"."enum_users_cover_kind" AS ENUM('none', 'ayah', 'hadith', 'text');
  CREATE TYPE "public"."enum_users_privacy_visibility" AS ENUM('public', 'members', 'custom', 'private');
  CREATE TYPE "public"."enum__users_v_version_gender" AS ENUM('male', 'female');
  CREATE TYPE "public"."enum__users_v_version_cover_kind" AS ENUM('none', 'ayah', 'hadith', 'text');
  CREATE TYPE "public"."enum__users_v_version_privacy_visibility" AS ENUM('public', 'members', 'custom', 'private');
  CREATE TABLE "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "_users_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "avatars" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"prefix" varchar DEFAULT 'avatars',
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_sm_url" varchar,
  	"sizes_sm_width" numeric,
  	"sizes_sm_height" numeric,
  	"sizes_sm_mime_type" varchar,
  	"sizes_sm_filesize" numeric,
  	"sizes_sm_filename" varchar,
  	"sizes_md_url" varchar,
  	"sizes_md_width" numeric,
  	"sizes_md_height" numeric,
  	"sizes_md_mime_type" varchar,
  	"sizes_md_filesize" numeric,
  	"sizes_md_filename" varchar,
  	"sizes_lg_url" varchar,
  	"sizes_lg_width" numeric,
  	"sizes_lg_height" numeric,
  	"sizes_lg_mime_type" varchar,
  	"sizes_lg_filesize" numeric,
  	"sizes_lg_filename" varchar
  );
  
  ALTER TABLE "users" ADD COLUMN "gender" "enum_users_gender";
  ALTER TABLE "users" ADD COLUMN "avatar_id" integer;
  ALTER TABLE "users" ADD COLUMN "cover_kind" "enum_users_cover_kind" DEFAULT 'none';
  ALTER TABLE "users" ADD COLUMN "cover_ayah_key" varchar;
  ALTER TABLE "users" ADD COLUMN "cover_hadith_key" varchar;
  ALTER TABLE "users" ADD COLUMN "cover_text" varchar;
  ALTER TABLE "users" ADD COLUMN "cover_source" varchar;
  ALTER TABLE "users" ADD COLUMN "privacy_visibility" "enum_users_privacy_visibility" DEFAULT 'public';
  ALTER TABLE "users" ADD COLUMN "privacy_show_photo" boolean DEFAULT true;
  ALTER TABLE "users" ADD COLUMN "privacy_show_cover" boolean DEFAULT true;
  ALTER TABLE "users" ADD COLUMN "privacy_show_bio" boolean DEFAULT true;
  ALTER TABLE "users" ADD COLUMN "privacy_show_district" boolean DEFAULT true;
  ALTER TABLE "_users_v" ADD COLUMN "version_gender" "enum__users_v_version_gender";
  ALTER TABLE "_users_v" ADD COLUMN "version_avatar_id" integer;
  ALTER TABLE "_users_v" ADD COLUMN "version_cover_kind" "enum__users_v_version_cover_kind" DEFAULT 'none';
  ALTER TABLE "_users_v" ADD COLUMN "version_cover_ayah_key" varchar;
  ALTER TABLE "_users_v" ADD COLUMN "version_cover_hadith_key" varchar;
  ALTER TABLE "_users_v" ADD COLUMN "version_cover_text" varchar;
  ALTER TABLE "_users_v" ADD COLUMN "version_cover_source" varchar;
  ALTER TABLE "_users_v" ADD COLUMN "version_privacy_visibility" "enum__users_v_version_privacy_visibility" DEFAULT 'public';
  ALTER TABLE "_users_v" ADD COLUMN "version_privacy_show_photo" boolean DEFAULT true;
  ALTER TABLE "_users_v" ADD COLUMN "version_privacy_show_cover" boolean DEFAULT true;
  ALTER TABLE "_users_v" ADD COLUMN "version_privacy_show_bio" boolean DEFAULT true;
  ALTER TABLE "_users_v" ADD COLUMN "version_privacy_show_district" boolean DEFAULT true;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "avatars_id" integer;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_users_v_rels" ADD CONSTRAINT "_users_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_users_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_users_v_rels" ADD CONSTRAINT "_users_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "avatars" ADD CONSTRAINT "avatars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX "users_rels_users_id_idx" ON "users_rels" USING btree ("users_id");
  CREATE INDEX "_users_v_rels_order_idx" ON "_users_v_rels" USING btree ("order");
  CREATE INDEX "_users_v_rels_parent_idx" ON "_users_v_rels" USING btree ("parent_id");
  CREATE INDEX "_users_v_rels_path_idx" ON "_users_v_rels" USING btree ("path");
  CREATE INDEX "_users_v_rels_users_id_idx" ON "_users_v_rels" USING btree ("users_id");
  CREATE UNIQUE INDEX "avatars_user_idx" ON "avatars" USING btree ("user_id");
  CREATE INDEX "avatars_updated_at_idx" ON "avatars" USING btree ("updated_at");
  CREATE INDEX "avatars_created_at_idx" ON "avatars" USING btree ("created_at");
  CREATE UNIQUE INDEX "avatars_filename_idx" ON "avatars" USING btree ("filename");
  CREATE INDEX "avatars_sizes_sm_sizes_sm_filename_idx" ON "avatars" USING btree ("sizes_sm_filename");
  CREATE INDEX "avatars_sizes_md_sizes_md_filename_idx" ON "avatars" USING btree ("sizes_md_filename");
  CREATE INDEX "avatars_sizes_lg_sizes_lg_filename_idx" ON "avatars" USING btree ("sizes_lg_filename");
  ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_avatars_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."avatars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_users_v" ADD CONSTRAINT "_users_v_version_avatar_id_avatars_id_fk" FOREIGN KEY ("version_avatar_id") REFERENCES "public"."avatars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_avatars_fk" FOREIGN KEY ("avatars_id") REFERENCES "public"."avatars"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_gender_idx" ON "users" USING btree ("gender");
  CREATE INDEX "users_avatar_idx" ON "users" USING btree ("avatar_id");
  CREATE INDEX "_users_v_version_version_gender_idx" ON "_users_v" USING btree ("version_gender");
  CREATE INDEX "_users_v_version_version_avatar_idx" ON "_users_v" USING btree ("version_avatar_id");
  CREATE INDEX "payload_locked_documents_rels_avatars_id_idx" ON "payload_locked_documents_rels" USING btree ("avatars_id");`)
  // members who had switched their profile off keep it locked
  await db.execute(sql`
    UPDATE users SET privacy_visibility = 'private' WHERE privacy_profile_public = false;
  `)
  // photos now come only from a member's own upload, never from Google or Facebook
  await db.execute(sql`UPDATE users SET image = NULL WHERE avatar_id IS NULL;`)
  // new tables stay closed to Supabase's public Data API, like every other table
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE public.avatars, public.users_rels, public._users_v_rels FROM anon, authenticated;
        ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.users_rels ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public._users_v_rels ENABLE ROW LEVEL SECURITY;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_users_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "avatars" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_rels" CASCADE;
  DROP TABLE "_users_v_rels" CASCADE;
  DROP TABLE "avatars" CASCADE;
  ALTER TABLE "users" DROP CONSTRAINT "users_avatar_id_avatars_id_fk";
  
  ALTER TABLE "_users_v" DROP CONSTRAINT "_users_v_version_avatar_id_avatars_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_avatars_fk";
  
  DROP INDEX "users_gender_idx";
  DROP INDEX "users_avatar_idx";
  DROP INDEX "_users_v_version_version_gender_idx";
  DROP INDEX "_users_v_version_version_avatar_idx";
  DROP INDEX "payload_locked_documents_rels_avatars_id_idx";
  ALTER TABLE "users" DROP COLUMN "gender";
  ALTER TABLE "users" DROP COLUMN "avatar_id";
  ALTER TABLE "users" DROP COLUMN "cover_kind";
  ALTER TABLE "users" DROP COLUMN "cover_ayah_key";
  ALTER TABLE "users" DROP COLUMN "cover_hadith_key";
  ALTER TABLE "users" DROP COLUMN "cover_text";
  ALTER TABLE "users" DROP COLUMN "cover_source";
  ALTER TABLE "users" DROP COLUMN "privacy_visibility";
  ALTER TABLE "users" DROP COLUMN "privacy_show_photo";
  ALTER TABLE "users" DROP COLUMN "privacy_show_cover";
  ALTER TABLE "users" DROP COLUMN "privacy_show_bio";
  ALTER TABLE "users" DROP COLUMN "privacy_show_district";
  ALTER TABLE "_users_v" DROP COLUMN "version_gender";
  ALTER TABLE "_users_v" DROP COLUMN "version_avatar_id";
  ALTER TABLE "_users_v" DROP COLUMN "version_cover_kind";
  ALTER TABLE "_users_v" DROP COLUMN "version_cover_ayah_key";
  ALTER TABLE "_users_v" DROP COLUMN "version_cover_hadith_key";
  ALTER TABLE "_users_v" DROP COLUMN "version_cover_text";
  ALTER TABLE "_users_v" DROP COLUMN "version_cover_source";
  ALTER TABLE "_users_v" DROP COLUMN "version_privacy_visibility";
  ALTER TABLE "_users_v" DROP COLUMN "version_privacy_show_photo";
  ALTER TABLE "_users_v" DROP COLUMN "version_privacy_show_cover";
  ALTER TABLE "_users_v" DROP COLUMN "version_privacy_show_bio";
  ALTER TABLE "_users_v" DROP COLUMN "version_privacy_show_district";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "avatars_id";
  DROP TYPE "public"."enum_users_gender";
  DROP TYPE "public"."enum_users_cover_kind";
  DROP TYPE "public"."enum_users_privacy_visibility";
  DROP TYPE "public"."enum__users_v_version_gender";
  DROP TYPE "public"."enum__users_v_version_cover_kind";
  DROP TYPE "public"."enum__users_v_version_privacy_visibility";`)
}
