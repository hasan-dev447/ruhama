import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ayahs" ADD COLUMN "label" varchar;
  ALTER TABLE "hadiths" ADD COLUMN "label" varchar;
  CREATE INDEX "ayahs_label_idx" ON "ayahs" USING btree ("label");
  CREATE INDEX "hadiths_label_idx" ON "hadiths" USING btree ("label");`)
  // a readable label for pickers ("2:255 · আল-বাকারা · অনুবাদের শুরু…"), kept by triggers so it is
  // right for Payload saves and for the raw-SQL import scripts alike
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION ruhama_ayah_label() RETURNS trigger AS $$
    BEGIN
      NEW.label := NEW.surah::int || ':' || NEW.ayah::int
        || coalesce(' · ' || (SELECT s.name_bangla FROM surahs s WHERE s.number = NEW.surah), '')
        || ' · ' || left(NEW.translation, 70)
        || CASE WHEN char_length(NEW.translation) > 70 THEN '…' ELSE '' END;
      RETURN NEW;
    END $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION ruhama_hadith_label() RETURNS trigger AS $$
    DECLARE words text;
    BEGIN
      -- the Prophet's words after "...বলেছেনঃ" read better than the chain of narrators
      words := coalesce(substring(NEW.text FROM '(?:বলেছেন|বলেন)\\s*[ঃ:]\\s*(.*)$'), NEW.text);
      NEW.label := coalesce((SELECT c.short_name FROM hadith_collections c WHERE c.id = NEW.book_id), '')
        || ' ' || coalesce(NEW.number_label, NEW.number::int::text)
        || ' · ' || left(words, 70)
        || CASE WHEN char_length(words) > 70 THEN '…' ELSE '' END;
      RETURN NEW;
    END $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS ayahs_label ON ayahs;
    CREATE TRIGGER ayahs_label BEFORE INSERT OR UPDATE OF surah, ayah, translation, label ON ayahs
      FOR EACH ROW EXECUTE FUNCTION ruhama_ayah_label();
    DROP TRIGGER IF EXISTS hadiths_label ON hadiths;
    CREATE TRIGGER hadiths_label BEFORE INSERT OR UPDATE OF book_id, number, number_label, text, label ON hadiths
      FOR EACH ROW EXECUTE FUNCTION ruhama_hadith_label();

    UPDATE ayahs SET label = NULL;
    UPDATE hadiths SET label = NULL;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TRIGGER IF EXISTS ayahs_label ON ayahs;
  DROP TRIGGER IF EXISTS hadiths_label ON hadiths;
  DROP FUNCTION IF EXISTS ruhama_ayah_label();
  DROP FUNCTION IF EXISTS ruhama_hadith_label();
   DROP INDEX "ayahs_label_idx";
  DROP INDEX "hadiths_label_idx";
  ALTER TABLE "ayahs" DROP COLUMN "label";
  ALTER TABLE "hadiths" DROP COLUMN "label";`)
}
