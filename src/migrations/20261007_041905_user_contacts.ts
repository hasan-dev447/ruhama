import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_user_contacts_kind" AS ENUM('email', 'phone');
  CREATE TABLE "user_contacts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"kind" "enum_user_contacts_kind" NOT NULL,
  	"value" varchar NOT NULL,
  	"verified" boolean DEFAULT false,
  	"verified_at" timestamp(3) with time zone,
  	"code_hash" varchar,
  	"code_expires_at" timestamp(3) with time zone,
  	"attempts" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "user_contacts_id" integer;
  ALTER TABLE "user_contacts" ADD CONSTRAINT "user_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "user_contacts_user_idx" ON "user_contacts" USING btree ("user_id");
  CREATE UNIQUE INDEX "user_contacts_value_idx" ON "user_contacts" USING btree ("value");
  CREATE INDEX "user_contacts_verified_idx" ON "user_contacts" USING btree ("verified");
  CREATE INDEX "user_contacts_updated_at_idx" ON "user_contacts" USING btree ("updated_at");
  CREATE INDEX "user_contacts_created_at_idx" ON "user_contacts" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_contacts_fk" FOREIGN KEY ("user_contacts_id") REFERENCES "public"."user_contacts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_user_contacts_id_idx" ON "payload_locked_documents_rels" USING btree ("user_contacts_id");`)
  // a member's extra emails and numbers go with the account, and stay closed to Supabase's Data API
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE public.user_contacts FROM anon, authenticated;
        ALTER TABLE public.user_contacts ENABLE ROW LEVEL SECURITY;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "user_contacts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "user_contacts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_user_contacts_fk";
  
  DROP INDEX "payload_locked_documents_rels_user_contacts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "user_contacts_id";
  DROP TYPE "public"."enum_user_contacts_kind";`)
}
