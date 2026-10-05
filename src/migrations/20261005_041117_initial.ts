import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // trigram indexes below (partial-match search) need pg_trgm; available on Supabase and stock Postgres
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`)
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('super_admin', 'shura', 'reviewer', 'editor', 'author', 'moderator', 'member');
  CREATE TYPE "public"."enum_users_interests" AS ENUM('writing', 'dawah', 'translation', 'tech', 'events');
  CREATE TYPE "public"."enum_users_journey_stage" AS ENUM('kalema', 'iman', 'ilm', 'amal', 'tazkiyah', 'akhlaq', 'ukhuwwah', 'unity');
  CREATE TYPE "public"."enum_users_avatar_color" AS ENUM('teal', 'gold', 'sage', 'deep');
  CREATE TYPE "public"."enum_users_district" AS ENUM('dhaka', 'gazipur', 'narayanganj', 'narsingdi', 'manikganj', 'munshiganj', 'tangail', 'kishoreganj', 'faridpur', 'gopalganj', 'madaripur', 'rajbari', 'shariatpur', 'chattogram', 'coxs-bazar', 'cumilla', 'feni', 'noakhali', 'lakshmipur', 'chandpur', 'brahmanbaria', 'rangamati', 'khagrachhari', 'bandarban', 'rajshahi', 'natore', 'naogaon', 'chapainawabganj', 'pabna', 'sirajganj', 'bogura', 'joypurhat', 'khulna', 'bagerhat', 'satkhira', 'jashore', 'jhenaidah', 'magura', 'narail', 'kushtia', 'chuadanga', 'meherpur', 'barishal', 'patuakhali', 'bhola', 'pirojpur', 'jhalokati', 'barguna', 'sylhet', 'moulvibazar', 'habiganj', 'sunamganj', 'rangpur', 'dinajpur', 'thakurgaon', 'panchagarh', 'nilphamari', 'lalmonirhat', 'kurigram', 'gaibandha', 'mymensingh', 'jamalpur', 'sherpur', 'netrokona');
  CREATE TYPE "public"."enum__users_v_version_role" AS ENUM('super_admin', 'shura', 'reviewer', 'editor', 'author', 'moderator', 'member');
  CREATE TYPE "public"."enum__users_v_version_interests" AS ENUM('writing', 'dawah', 'translation', 'tech', 'events');
  CREATE TYPE "public"."enum__users_v_version_journey_stage" AS ENUM('kalema', 'iman', 'ilm', 'amal', 'tazkiyah', 'akhlaq', 'ukhuwwah', 'unity');
  CREATE TYPE "public"."enum__users_v_version_avatar_color" AS ENUM('teal', 'gold', 'sage', 'deep');
  CREATE TYPE "public"."enum__users_v_version_district" AS ENUM('dhaka', 'gazipur', 'narayanganj', 'narsingdi', 'manikganj', 'munshiganj', 'tangail', 'kishoreganj', 'faridpur', 'gopalganj', 'madaripur', 'rajbari', 'shariatpur', 'chattogram', 'coxs-bazar', 'cumilla', 'feni', 'noakhali', 'lakshmipur', 'chandpur', 'brahmanbaria', 'rangamati', 'khagrachhari', 'bandarban', 'rajshahi', 'natore', 'naogaon', 'chapainawabganj', 'pabna', 'sirajganj', 'bogura', 'joypurhat', 'khulna', 'bagerhat', 'satkhira', 'jashore', 'jhenaidah', 'magura', 'narail', 'kushtia', 'chuadanga', 'meherpur', 'barishal', 'patuakhali', 'bhola', 'pirojpur', 'jhalokati', 'barguna', 'sylhet', 'moulvibazar', 'habiganj', 'sunamganj', 'rangpur', 'dinajpur', 'thakurgaon', 'panchagarh', 'nilphamari', 'lalmonirhat', 'kurigram', 'gaibandha', 'mymensingh', 'jamalpur', 'sherpur', 'netrokona');
  CREATE TYPE "public"."enum_admin_invitations_role" AS ENUM('super_admin', 'shura', 'reviewer', 'editor', 'author', 'moderator', 'member');
  CREATE TYPE "public"."enum_articles_references_type" AS ENUM('quran', 'hadith', 'ikhtilaf', 'athar', 'book', 'other');
  CREATE TYPE "public"."enum_articles_approvals_decision" AS ENUM('approved', 'changes_requested');
  CREATE TYPE "public"."enum_articles_level" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TYPE "public"."enum_articles_tint" AS ENUM('sage', 'gold', 'teal');
  CREATE TYPE "public"."enum_articles_review_status" AS ENUM('draft', 'in_review', 'needs_changes', 'approved', 'published');
  CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_version_references_type" AS ENUM('quran', 'hadith', 'ikhtilaf', 'athar', 'book', 'other');
  CREATE TYPE "public"."enum__articles_v_version_approvals_decision" AS ENUM('approved', 'changes_requested');
  CREATE TYPE "public"."enum__articles_v_version_level" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TYPE "public"."enum__articles_v_version_tint" AS ENUM('sage', 'gold', 'teal');
  CREATE TYPE "public"."enum__articles_v_version_review_status" AS ENUM('draft', 'in_review', 'needs_changes', 'approved', 'published');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_ikhtilaf_topics_opinions_evidence_kind" AS ENUM('hadith', 'ayah');
  CREATE TYPE "public"."enum_ikhtilaf_topics_opinions_evidence_grade" AS ENUM('sahih', 'hasan', 'daif', 'mawdu', 'unknown');
  CREATE TYPE "public"."enum_ikhtilaf_topics_references_type" AS ENUM('quran', 'hadith', 'ikhtilaf', 'athar', 'book', 'other');
  CREATE TYPE "public"."enum_ikhtilaf_topics_approvals_decision" AS ENUM('approved', 'changes_requested');
  CREATE TYPE "public"."enum_ikhtilaf_topics_level" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TYPE "public"."enum_ikhtilaf_topics_review_status" AS ENUM('draft', 'in_review', 'needs_changes', 'approved', 'published');
  CREATE TYPE "public"."enum_ikhtilaf_topics_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__ikhtilaf_topics_v_version_opinions_evidence_kind" AS ENUM('hadith', 'ayah');
  CREATE TYPE "public"."enum__ikhtilaf_topics_v_version_opinions_evidence_grade" AS ENUM('sahih', 'hasan', 'daif', 'mawdu', 'unknown');
  CREATE TYPE "public"."enum__ikhtilaf_topics_v_version_references_type" AS ENUM('quran', 'hadith', 'ikhtilaf', 'athar', 'book', 'other');
  CREATE TYPE "public"."enum__ikhtilaf_topics_v_version_approvals_decision" AS ENUM('approved', 'changes_requested');
  CREATE TYPE "public"."enum__ikhtilaf_topics_v_version_level" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TYPE "public"."enum__ikhtilaf_topics_v_version_review_status" AS ENUM('draft', 'in_review', 'needs_changes', 'approved', 'published');
  CREATE TYPE "public"."enum__ikhtilaf_topics_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_questions_references_type" AS ENUM('quran', 'hadith', 'ikhtilaf', 'athar', 'book', 'other');
  CREATE TYPE "public"."enum_questions_approvals_decision" AS ENUM('approved', 'changes_requested');
  CREATE TYPE "public"."enum_questions_asker_district" AS ENUM('dhaka', 'gazipur', 'narayanganj', 'narsingdi', 'manikganj', 'munshiganj', 'tangail', 'kishoreganj', 'faridpur', 'gopalganj', 'madaripur', 'rajbari', 'shariatpur', 'chattogram', 'coxs-bazar', 'cumilla', 'feni', 'noakhali', 'lakshmipur', 'chandpur', 'brahmanbaria', 'rangamati', 'khagrachhari', 'bandarban', 'rajshahi', 'natore', 'naogaon', 'chapainawabganj', 'pabna', 'sirajganj', 'bogura', 'joypurhat', 'khulna', 'bagerhat', 'satkhira', 'jashore', 'jhenaidah', 'magura', 'narail', 'kushtia', 'chuadanga', 'meherpur', 'barishal', 'patuakhali', 'bhola', 'pirojpur', 'jhalokati', 'barguna', 'sylhet', 'moulvibazar', 'habiganj', 'sunamganj', 'rangpur', 'dinajpur', 'thakurgaon', 'panchagarh', 'nilphamari', 'lalmonirhat', 'kurigram', 'gaibandha', 'mymensingh', 'jamalpur', 'sherpur', 'netrokona');
  CREATE TYPE "public"."enum_questions_moderation" AS ENUM('pending', 'accepted', 'rejected', 'duplicate');
  CREATE TYPE "public"."enum_questions_review_status" AS ENUM('draft', 'in_review', 'needs_changes', 'approved', 'published');
  CREATE TYPE "public"."enum_questions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__questions_v_version_references_type" AS ENUM('quran', 'hadith', 'ikhtilaf', 'athar', 'book', 'other');
  CREATE TYPE "public"."enum__questions_v_version_approvals_decision" AS ENUM('approved', 'changes_requested');
  CREATE TYPE "public"."enum__questions_v_version_asker_district" AS ENUM('dhaka', 'gazipur', 'narayanganj', 'narsingdi', 'manikganj', 'munshiganj', 'tangail', 'kishoreganj', 'faridpur', 'gopalganj', 'madaripur', 'rajbari', 'shariatpur', 'chattogram', 'coxs-bazar', 'cumilla', 'feni', 'noakhali', 'lakshmipur', 'chandpur', 'brahmanbaria', 'rangamati', 'khagrachhari', 'bandarban', 'rajshahi', 'natore', 'naogaon', 'chapainawabganj', 'pabna', 'sirajganj', 'bogura', 'joypurhat', 'khulna', 'bagerhat', 'satkhira', 'jashore', 'jhenaidah', 'magura', 'narail', 'kushtia', 'chuadanga', 'meherpur', 'barishal', 'patuakhali', 'bhola', 'pirojpur', 'jhalokati', 'barguna', 'sylhet', 'moulvibazar', 'habiganj', 'sunamganj', 'rangpur', 'dinajpur', 'thakurgaon', 'panchagarh', 'nilphamari', 'lalmonirhat', 'kurigram', 'gaibandha', 'mymensingh', 'jamalpur', 'sherpur', 'netrokona');
  CREATE TYPE "public"."enum__questions_v_version_moderation" AS ENUM('pending', 'accepted', 'rejected', 'duplicate');
  CREATE TYPE "public"."enum__questions_v_version_review_status" AS ENUM('draft', 'in_review', 'needs_changes', 'approved', 'published');
  CREATE TYPE "public"."enum__questions_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_categories_used_for" AS ENUM('articles', 'questions', 'videos', 'events', 'ikhtilaf');
  CREATE TYPE "public"."enum_categories_icon" AS ENUM('compass', 'scale', 'sunrise', 'sprout', 'heart', 'wallet', 'users', 'book', 'columns', 'home', 'landmark', 'mic');
  CREATE TYPE "public"."enum_people_kinds" AS ENUM('scholar', 'author', 'reviewer', 'speaker');
  CREATE TYPE "public"."enum_people_role_notes_role" AS ENUM('author', 'reviewer', 'speaker');
  CREATE TYPE "public"."enum_people_avatar_tone" AS ENUM('teal', 'gold');
  CREATE TYPE "public"."enum_courses_journey_stage" AS ENUM('kalema', 'iman', 'ilm', 'amal', 'tazkiyah', 'akhlaq', 'ukhuwwah', 'unity');
  CREATE TYPE "public"."enum_courses_level" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TYPE "public"."enum_courses_tint" AS ENUM('sage', 'gold', 'teal');
  CREATE TYPE "public"."enum_courses_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__courses_v_version_journey_stage" AS ENUM('kalema', 'iman', 'ilm', 'amal', 'tazkiyah', 'akhlaq', 'ukhuwwah', 'unity');
  CREATE TYPE "public"."enum__courses_v_version_level" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TYPE "public"."enum__courses_v_version_tint" AS ENUM('sage', 'gold', 'teal');
  CREATE TYPE "public"."enum__courses_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_lessons_media_kind" AS ENUM('none', 'youtube', 'audio');
  CREATE TYPE "public"."enum_lessons_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lessons_v_version_media_kind" AS ENUM('none', 'youtube', 'audio');
  CREATE TYPE "public"."enum__lessons_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_events_mode" AS ENUM('online', 'in_person');
  CREATE TYPE "public"."enum_events_district" AS ENUM('dhaka', 'gazipur', 'narayanganj', 'narsingdi', 'manikganj', 'munshiganj', 'tangail', 'kishoreganj', 'faridpur', 'gopalganj', 'madaripur', 'rajbari', 'shariatpur', 'chattogram', 'coxs-bazar', 'cumilla', 'feni', 'noakhali', 'lakshmipur', 'chandpur', 'brahmanbaria', 'rangamati', 'khagrachhari', 'bandarban', 'rajshahi', 'natore', 'naogaon', 'chapainawabganj', 'pabna', 'sirajganj', 'bogura', 'joypurhat', 'khulna', 'bagerhat', 'satkhira', 'jashore', 'jhenaidah', 'magura', 'narail', 'kushtia', 'chuadanga', 'meherpur', 'barishal', 'patuakhali', 'bhola', 'pirojpur', 'jhalokati', 'barguna', 'sylhet', 'moulvibazar', 'habiganj', 'sunamganj', 'rangpur', 'dinajpur', 'thakurgaon', 'panchagarh', 'nilphamari', 'lalmonirhat', 'kurigram', 'gaibandha', 'mymensingh', 'jamalpur', 'sherpur', 'netrokona');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_version_mode" AS ENUM('online', 'in_person');
  CREATE TYPE "public"."enum__events_v_version_district" AS ENUM('dhaka', 'gazipur', 'narayanganj', 'narsingdi', 'manikganj', 'munshiganj', 'tangail', 'kishoreganj', 'faridpur', 'gopalganj', 'madaripur', 'rajbari', 'shariatpur', 'chattogram', 'coxs-bazar', 'cumilla', 'feni', 'noakhali', 'lakshmipur', 'chandpur', 'brahmanbaria', 'rangamati', 'khagrachhari', 'bandarban', 'rajshahi', 'natore', 'naogaon', 'chapainawabganj', 'pabna', 'sirajganj', 'bogura', 'joypurhat', 'khulna', 'bagerhat', 'satkhira', 'jashore', 'jhenaidah', 'magura', 'narail', 'kushtia', 'chuadanga', 'meherpur', 'barishal', 'patuakhali', 'bhola', 'pirojpur', 'jhalokati', 'barguna', 'sylhet', 'moulvibazar', 'habiganj', 'sunamganj', 'rangpur', 'dinajpur', 'thakurgaon', 'panchagarh', 'nilphamari', 'lalmonirhat', 'kurigram', 'gaibandha', 'mymensingh', 'jamalpur', 'sherpur', 'netrokona');
  CREATE TYPE "public"."enum__events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_event_registrations_seating" AS ENUM('brothers', 'sisters');
  CREATE TYPE "public"."enum_event_registrations_status" AS ENUM('confirmed', 'cancelled');
  CREATE TYPE "public"."enum_circles_district" AS ENUM('dhaka', 'gazipur', 'narayanganj', 'narsingdi', 'manikganj', 'munshiganj', 'tangail', 'kishoreganj', 'faridpur', 'gopalganj', 'madaripur', 'rajbari', 'shariatpur', 'chattogram', 'coxs-bazar', 'cumilla', 'feni', 'noakhali', 'lakshmipur', 'chandpur', 'brahmanbaria', 'rangamati', 'khagrachhari', 'bandarban', 'rajshahi', 'natore', 'naogaon', 'chapainawabganj', 'pabna', 'sirajganj', 'bogura', 'joypurhat', 'khulna', 'bagerhat', 'satkhira', 'jashore', 'jhenaidah', 'magura', 'narail', 'kushtia', 'chuadanga', 'meherpur', 'barishal', 'patuakhali', 'bhola', 'pirojpur', 'jhalokati', 'barguna', 'sylhet', 'moulvibazar', 'habiganj', 'sunamganj', 'rangpur', 'dinajpur', 'thakurgaon', 'panchagarh', 'nilphamari', 'lalmonirhat', 'kurigram', 'gaibandha', 'mymensingh', 'jamalpur', 'sherpur', 'netrokona');
  CREATE TYPE "public"."enum_circles_type" AS ENUM('brothers', 'sisters', 'family');
  CREATE TYPE "public"."enum_circles_frequency" AS ENUM('weekly', 'fortnightly', 'monthly');
  CREATE TYPE "public"."enum_circles_member_unit" AS ENUM('people', 'families');
  CREATE TYPE "public"."enum_circles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_circle_memberships_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');
  CREATE TYPE "public"."enum_videos_references_type" AS ENUM('quran', 'hadith', 'ikhtilaf', 'athar', 'book', 'other');
  CREATE TYPE "public"."enum_videos_level" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TYPE "public"."enum_videos_tint" AS ENUM('teal', 'deep', 'umber', 'slate');
  CREATE TYPE "public"."enum_videos_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__videos_v_version_references_type" AS ENUM('quran', 'hadith', 'ikhtilaf', 'athar', 'book', 'other');
  CREATE TYPE "public"."enum__videos_v_version_level" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TYPE "public"."enum__videos_v_version_tint" AS ENUM('teal', 'deep', 'umber', 'slate');
  CREATE TYPE "public"."enum__videos_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_playlists_level" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TYPE "public"."enum_playlists_tint" AS ENUM('teal', 'deep', 'umber', 'slate');
  CREATE TYPE "public"."enum_surahs_revelation" AS ENUM('meccan', 'medinan');
  CREATE TYPE "public"."enum_hadiths_grade" AS ENUM('sahih', 'hasan', 'daif', 'mawdu', 'unknown');
  CREATE TYPE "public"."enum_daily_reminders_kind" AS ENUM('ayah', 'hadith');
  CREATE TYPE "public"."enum_daily_reminders_custom_grade" AS ENUM('sahih', 'hasan', 'daif', 'mawdu', 'unknown');
  CREATE TYPE "public"."enum_forum_threads_status" AS ENUM('published', 'pending', 'hidden', 'removed');
  CREATE TYPE "public"."enum_forum_posts_status" AS ENUM('published', 'pending', 'hidden', 'removed');
  CREATE TYPE "public"."enum_reports_target_type" AS ENUM('thread', 'post');
  CREATE TYPE "public"."enum_reports_reason" AS ENUM('disrespect', 'unsourced', 'partisan', 'spam');
  CREATE TYPE "public"."enum_reports_status" AS ENUM('open', 'actioned', 'dismissed');
  CREATE TYPE "public"."enum_notifications_kind" AS ENUM('answer', 'event', 'forum', 'course', 'review', 'system');
  CREATE TYPE "public"."enum_answer_votes_value" AS ENUM('helpful', 'unclear');
  CREATE TYPE "public"."enum_newsletter_subscribers_status" AS ENUM('subscribed', 'unsubscribed');
  CREATE TYPE "public"."enum_volunteers_interests" AS ENUM('writing', 'dawah', 'translation', 'tech', 'events');
  CREATE TYPE "public"."enum_volunteers_district" AS ENUM('dhaka', 'gazipur', 'narayanganj', 'narsingdi', 'manikganj', 'munshiganj', 'tangail', 'kishoreganj', 'faridpur', 'gopalganj', 'madaripur', 'rajbari', 'shariatpur', 'chattogram', 'coxs-bazar', 'cumilla', 'feni', 'noakhali', 'lakshmipur', 'chandpur', 'brahmanbaria', 'rangamati', 'khagrachhari', 'bandarban', 'rajshahi', 'natore', 'naogaon', 'chapainawabganj', 'pabna', 'sirajganj', 'bogura', 'joypurhat', 'khulna', 'bagerhat', 'satkhira', 'jashore', 'jhenaidah', 'magura', 'narail', 'kushtia', 'chuadanga', 'meherpur', 'barishal', 'patuakhali', 'bhola', 'pirojpur', 'jhalokati', 'barguna', 'sylhet', 'moulvibazar', 'habiganj', 'sunamganj', 'rangpur', 'dinajpur', 'thakurgaon', 'panchagarh', 'nilphamari', 'lalmonirhat', 'kurigram', 'gaibandha', 'mymensingh', 'jamalpur', 'sherpur', 'netrokona');
  CREATE TYPE "public"."enum_volunteers_status" AS ENUM('new', 'contacted', 'active', 'closed');
  CREATE TYPE "public"."enum_contact_messages_topic" AS ENUM('general', 'correction', 'partnership', 'technical');
  CREATE TYPE "public"."enum_contact_messages_status" AS ENUM('new', 'replied', 'closed');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_audit_logs_action" AS ENUM('role_change', 'submit', 'approve', 'request_changes', 'publish', 'unpublish', 'withdraw', 'moderation', 'account_deletion');
  CREATE TYPE "public"."enum_home_page_journey_steps_stage" AS ENUM('kalema', 'iman', 'ilm', 'amal', 'tazkiyah', 'akhlaq', 'ukhuwwah', 'unity');
  CREATE TYPE "public"."enum_home_page_values_icon" AS ENUM('handshake', 'book', 'message', 'search', 'mark', 'users');
  CREATE TYPE "public"."enum__home_page_v_version_journey_steps_stage" AS ENUM('kalema', 'iman', 'ilm', 'amal', 'tazkiyah', 'akhlaq', 'ukhuwwah', 'unity');
  CREATE TYPE "public"."enum__home_page_v_version_values_icon" AS ENUM('handshake', 'book', 'message', 'search', 'mark', 'users');
  CREATE TYPE "public"."enum_about_page_adab_rules_icon" AS ENUM('book', 'heart', 'scale', 'ban', 'megaphone', 'user');
  CREATE TYPE "public"."enum_about_page_adab_rules_tone" AS ENUM('teal', 'gold');
  CREATE TYPE "public"."enum__about_page_v_version_adab_rules_icon" AS ENUM('book', 'heart', 'scale', 'ban', 'megaphone', 'user');
  CREATE TYPE "public"."enum__about_page_v_version_adab_rules_tone" AS ENUM('teal', 'gold');
  CREATE TABLE "users_role" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_role",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_interests" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_interests",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"email_verified" boolean DEFAULT false NOT NULL,
  	"image" varchar,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"banned" boolean DEFAULT false,
  	"ban_reason" varchar,
  	"ban_expires" timestamp(3) with time zone,
  	"phone_number" varchar,
  	"phone_number_verified" boolean DEFAULT false,
  	"username" varchar,
  	"journey_stage" "enum_users_journey_stage",
  	"avatar_color" "enum_users_avatar_color",
  	"deletion_requested_at" timestamp(3) with time zone,
  	"district" "enum_users_district",
  	"bio" varchar,
  	"person_id" integer,
  	"privacy_profile_public" boolean DEFAULT true,
  	"privacy_show_activity" boolean DEFAULT true,
  	"privacy_show_journey" boolean DEFAULT true,
  	"privacy_discoverable" boolean DEFAULT false,
  	"notification_prefs_answer_email" boolean DEFAULT true,
  	"notification_prefs_answer_site" boolean DEFAULT true,
  	"notification_prefs_event_email" boolean DEFAULT true,
  	"notification_prefs_event_site" boolean DEFAULT true,
  	"notification_prefs_forum_email" boolean DEFAULT false,
  	"notification_prefs_forum_site" boolean DEFAULT true,
  	"notification_prefs_weekly_email" boolean DEFAULT true,
  	"notification_prefs_weekly_site" boolean DEFAULT false,
  	"notification_prefs_course_email" boolean DEFAULT false,
  	"notification_prefs_course_site" boolean DEFAULT true,
  	"forum_stats_approved_posts" numeric DEFAULT 0,
  	"forum_stats_trusted" boolean DEFAULT false,
  	"forum_stats_muted_until" timestamp(3) with time zone,
  	"last_active_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_users_v_version_role" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__users_v_version_role",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_users_v_version_interests" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__users_v_version_interests",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_users_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar NOT NULL,
  	"version_email" varchar NOT NULL,
  	"version_email_verified" boolean DEFAULT false NOT NULL,
  	"version_image" varchar,
  	"version_created_at" timestamp(3) with time zone NOT NULL,
  	"version_updated_at" timestamp(3) with time zone NOT NULL,
  	"version_banned" boolean DEFAULT false,
  	"version_ban_reason" varchar,
  	"version_ban_expires" timestamp(3) with time zone,
  	"version_phone_number" varchar,
  	"version_phone_number_verified" boolean DEFAULT false,
  	"version_username" varchar,
  	"version_journey_stage" "enum__users_v_version_journey_stage",
  	"version_avatar_color" "enum__users_v_version_avatar_color",
  	"version_deletion_requested_at" timestamp(3) with time zone,
  	"version_district" "enum__users_v_version_district",
  	"version_bio" varchar,
  	"version_person_id" integer,
  	"version_privacy_profile_public" boolean DEFAULT true,
  	"version_privacy_show_activity" boolean DEFAULT true,
  	"version_privacy_show_journey" boolean DEFAULT true,
  	"version_privacy_discoverable" boolean DEFAULT false,
  	"version_notification_prefs_answer_email" boolean DEFAULT true,
  	"version_notification_prefs_answer_site" boolean DEFAULT true,
  	"version_notification_prefs_event_email" boolean DEFAULT true,
  	"version_notification_prefs_event_site" boolean DEFAULT true,
  	"version_notification_prefs_forum_email" boolean DEFAULT false,
  	"version_notification_prefs_forum_site" boolean DEFAULT true,
  	"version_notification_prefs_weekly_email" boolean DEFAULT true,
  	"version_notification_prefs_weekly_site" boolean DEFAULT false,
  	"version_notification_prefs_course_email" boolean DEFAULT false,
  	"version_notification_prefs_course_site" boolean DEFAULT true,
  	"version_forum_stats_approved_posts" numeric DEFAULT 0,
  	"version_forum_stats_trusted" boolean DEFAULT false,
  	"version_forum_stats_muted_until" timestamp(3) with time zone,
  	"version_last_active_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"token" varchar NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"ip_address" varchar,
  	"user_agent" varchar,
  	"user_id" integer NOT NULL,
  	"impersonated_by_id" integer
  );
  
  CREATE TABLE "accounts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"account_id" varchar NOT NULL,
  	"provider_id" varchar NOT NULL,
  	"user_id" integer NOT NULL,
  	"access_token" varchar,
  	"refresh_token" varchar,
  	"id_token" varchar,
  	"access_token_expires_at" timestamp(3) with time zone,
  	"refresh_token_expires_at" timestamp(3) with time zone,
  	"scope" varchar,
  	"password" varchar,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "verifications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"identifier" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rate_limit" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"count" numeric NOT NULL,
  	"last_request" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "admin_invitations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "enum_admin_invitations_role" DEFAULT 'super_admin' NOT NULL,
  	"token" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "articles_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_articles_references_type" DEFAULT 'quran',
  	"citation" varchar,
  	"note" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "articles_approvals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"reviewer_id" integer,
  	"decision" "enum_articles_approvals_decision",
  	"note" varchar,
  	"content_hash" varchar,
  	"at" timestamp(3) with time zone
  );
  
  CREATE TABLE "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"category_id" integer,
  	"author_id" integer,
  	"series_id" integer,
  	"series_order" numeric,
  	"cover_image_id" integer,
  	"slug" varchar,
  	"level" "enum_articles_level" DEFAULT 'beginner',
  	"tint" "enum_articles_tint" DEFAULT 'sage',
  	"published_at" timestamp(3) with time zone,
  	"reading_time" numeric,
  	"review_status" "enum_articles_review_status" DEFAULT 'draft',
  	"created_by_id" integer,
  	"published_by_id" integer,
  	"content_hash" varchar,
  	"search_text" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_articles_status" DEFAULT 'draft',
  	"search_tsv" "tsvector" GENERATED ALWAYS AS ((setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(search_text, '')), 'B'))) STORED
  );
  
  CREATE TABLE "articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer,
  	"articles_id" integer,
  	"people_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "_articles_v_version_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__articles_v_version_references_type" DEFAULT 'quran',
  	"citation" varchar,
  	"note" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v_version_approvals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"reviewer_id" integer,
  	"decision" "enum__articles_v_version_approvals_decision",
  	"note" varchar,
  	"content_hash" varchar,
  	"at" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_category_id" integer,
  	"version_author_id" integer,
  	"version_series_id" integer,
  	"version_series_order" numeric,
  	"version_cover_image_id" integer,
  	"version_slug" varchar,
  	"version_level" "enum__articles_v_version_level" DEFAULT 'beginner',
  	"version_tint" "enum__articles_v_version_tint" DEFAULT 'sage',
  	"version_published_at" timestamp(3) with time zone,
  	"version_reading_time" numeric,
  	"version_review_status" "enum__articles_v_version_review_status" DEFAULT 'draft',
  	"version_created_by_id" integer,
  	"version_published_by_id" integer,
  	"version_content_hash" varchar,
  	"version_search_text" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer,
  	"articles_id" integer,
  	"people_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "ikhtilaf_topics_consensus" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"point" varchar
  );
  
  CREATE TABLE "ikhtilaf_topics_opinions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"holders" varchar,
  	"evidence_kind" "enum_ikhtilaf_topics_opinions_evidence_kind" DEFAULT 'hadith',
  	"evidence_arabic" varchar,
  	"evidence_text" varchar,
  	"evidence_narrator" varchar,
  	"evidence_source" varchar,
  	"evidence_grade" "enum_ikhtilaf_topics_opinions_evidence_grade",
  	"evidence_grade_note" varchar,
  	"understanding" varchar
  );
  
  CREATE TABLE "ikhtilaf_topics_conduct" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"point" varchar
  );
  
  CREATE TABLE "ikhtilaf_topics_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_ikhtilaf_topics_references_type" DEFAULT 'quran',
  	"citation" varchar,
  	"note" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "ikhtilaf_topics_approvals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"reviewer_id" integer,
  	"decision" "enum_ikhtilaf_topics_approvals_decision",
  	"note" varchar,
  	"content_hash" varchar,
  	"at" timestamp(3) with time zone
  );
  
  CREATE TABLE "ikhtilaf_topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"lead" varchar,
  	"category_id" integer,
  	"sub_topic" varchar,
  	"read_first" varchar DEFAULT 'সবগুলো মতই ইজতিহাদের বৈধ পরিসরে। এই পৃষ্ঠা ফতোয়া নয়; নিজের আমলের জন্য আপনার আস্থাভাজন আলিমের পরামর্শ নিন।',
  	"slug" varchar,
  	"level" "enum_ikhtilaf_topics_level" DEFAULT 'beginner',
  	"published_at" timestamp(3) with time zone,
  	"review_note" varchar,
  	"reading_time" numeric,
  	"review_status" "enum_ikhtilaf_topics_review_status" DEFAULT 'draft',
  	"created_by_id" integer,
  	"published_by_id" integer,
  	"content_hash" varchar,
  	"search_text" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_ikhtilaf_topics_status" DEFAULT 'draft',
  	"search_tsv" "tsvector" GENERATED ALWAYS AS ((setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(search_text, '')), 'B'))) STORED
  );
  
  CREATE TABLE "ikhtilaf_topics_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "ikhtilaf_topics_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"ikhtilaf_topics_id" integer,
  	"people_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "_ikhtilaf_topics_v_version_consensus" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"point" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ikhtilaf_topics_v_version_opinions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"holders" varchar,
  	"evidence_kind" "enum__ikhtilaf_topics_v_version_opinions_evidence_kind" DEFAULT 'hadith',
  	"evidence_arabic" varchar,
  	"evidence_text" varchar,
  	"evidence_narrator" varchar,
  	"evidence_source" varchar,
  	"evidence_grade" "enum__ikhtilaf_topics_v_version_opinions_evidence_grade",
  	"evidence_grade_note" varchar,
  	"understanding" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ikhtilaf_topics_v_version_conduct" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"point" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ikhtilaf_topics_v_version_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__ikhtilaf_topics_v_version_references_type" DEFAULT 'quran',
  	"citation" varchar,
  	"note" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ikhtilaf_topics_v_version_approvals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"reviewer_id" integer,
  	"decision" "enum__ikhtilaf_topics_v_version_approvals_decision",
  	"note" varchar,
  	"content_hash" varchar,
  	"at" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ikhtilaf_topics_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_lead" varchar,
  	"version_category_id" integer,
  	"version_sub_topic" varchar,
  	"version_read_first" varchar DEFAULT 'সবগুলো মতই ইজতিহাদের বৈধ পরিসরে। এই পৃষ্ঠা ফতোয়া নয়; নিজের আমলের জন্য আপনার আস্থাভাজন আলিমের পরামর্শ নিন।',
  	"version_slug" varchar,
  	"version_level" "enum__ikhtilaf_topics_v_version_level" DEFAULT 'beginner',
  	"version_published_at" timestamp(3) with time zone,
  	"version_review_note" varchar,
  	"version_reading_time" numeric,
  	"version_review_status" "enum__ikhtilaf_topics_v_version_review_status" DEFAULT 'draft',
  	"version_created_by_id" integer,
  	"version_published_by_id" integer,
  	"version_content_hash" varchar,
  	"version_search_text" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__ikhtilaf_topics_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_ikhtilaf_topics_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_ikhtilaf_topics_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"ikhtilaf_topics_id" integer,
  	"people_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "questions_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_questions_references_type" DEFAULT 'quran',
  	"citation" varchar,
  	"note" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "questions_approvals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"reviewer_id" integer,
  	"decision" "enum_questions_approvals_decision",
  	"note" varchar,
  	"content_hash" varchar,
  	"at" timestamp(3) with time zone
  );
  
  CREATE TABLE "questions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"category_id" integer,
  	"sub_topic" varchar,
  	"asked_by_id" integer,
  	"anonymous" boolean DEFAULT true,
  	"asker_district" "enum_questions_asker_district",
  	"answered_by_id" integer,
  	"answer" jsonb,
  	"slug" varchar,
  	"moderation" "enum_questions_moderation" DEFAULT 'pending',
  	"moderation_note" varchar,
  	"assigned_to_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"answer_excerpt" varchar,
  	"helpful_yes" numeric DEFAULT 0,
  	"helpful_no" numeric DEFAULT 0,
  	"review_status" "enum_questions_review_status" DEFAULT 'draft',
  	"created_by_id" integer,
  	"published_by_id" integer,
  	"content_hash" varchar,
  	"search_text" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_questions_status" DEFAULT 'draft',
  	"search_tsv" "tsvector" GENERATED ALWAYS AS ((setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(search_text, '')), 'B'))) STORED
  );
  
  CREATE TABLE "questions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"questions_id" integer,
  	"people_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "_questions_v_version_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__questions_v_version_references_type" DEFAULT 'quran',
  	"citation" varchar,
  	"note" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_questions_v_version_approvals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"reviewer_id" integer,
  	"decision" "enum__questions_v_version_approvals_decision",
  	"note" varchar,
  	"content_hash" varchar,
  	"at" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_questions_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_body" varchar,
  	"version_category_id" integer,
  	"version_sub_topic" varchar,
  	"version_asked_by_id" integer,
  	"version_anonymous" boolean DEFAULT true,
  	"version_asker_district" "enum__questions_v_version_asker_district",
  	"version_answered_by_id" integer,
  	"version_answer" jsonb,
  	"version_slug" varchar,
  	"version_moderation" "enum__questions_v_version_moderation" DEFAULT 'pending',
  	"version_moderation_note" varchar,
  	"version_assigned_to_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_answer_excerpt" varchar,
  	"version_helpful_yes" numeric DEFAULT 0,
  	"version_helpful_no" numeric DEFAULT 0,
  	"version_review_status" "enum__questions_v_version_review_status" DEFAULT 'draft',
  	"version_created_by_id" integer,
  	"version_published_by_id" integer,
  	"version_content_hash" varchar,
  	"version_search_text" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__questions_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_questions_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"questions_id" integer,
  	"people_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "series" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"author_id" integer NOT NULL,
  	"planned_parts" numeric,
  	"article_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories_used_for" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_categories_used_for",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"icon" "enum_categories_icon" DEFAULT 'book',
  	"order" numeric DEFAULT 0,
  	"article_count" numeric DEFAULT 0,
  	"question_count" numeric DEFAULT 0,
  	"video_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "people_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_people_kinds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "people_education" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"degree" varchar NOT NULL,
  	"institution" varchar
  );
  
  CREATE TABLE "people_role_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"role" "enum_people_role_notes_role" NOT NULL,
  	"note" varchar NOT NULL
  );
  
  CREATE TABLE "people" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"avatar_tone" "enum_people_avatar_tone" DEFAULT 'teal',
  	"slug" varchar,
  	"title" varchar,
  	"specialty" varchar,
  	"shura_role" varchar,
  	"shura_order" numeric,
  	"verified" boolean DEFAULT false,
  	"active" boolean DEFAULT true,
  	"photo_id" integer,
  	"user_id" integer,
  	"bio" varchar,
  	"joined_label" varchar,
  	"location" varchar,
  	"disclaimer" varchar,
  	"search_text" varchar,
  	"article_count" numeric DEFAULT 0,
  	"answer_count" numeric DEFAULT 0,
  	"lecture_count" numeric DEFAULT 0,
  	"reviewed_count" numeric DEFAULT 0,
  	"event_talk_count" numeric DEFAULT 0,
  	"series_count" numeric DEFAULT 0,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"search_tsv" "tsvector" GENERATED ALWAYS AS ((setweight(to_tsvector('simple', coalesce(name, '')), 'A') || setweight(to_tsvector('simple', coalesce(search_text, '')), 'B'))) STORED
  );
  
  CREATE TABLE "people_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "courses_modules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"summary" varchar
  );
  
  CREATE TABLE "courses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"journey_stage" "enum_courses_journey_stage" NOT NULL,
  	"instructor_id" integer,
  	"duration_minutes" numeric,
  	"slug" varchar,
  	"level" "enum_courses_level" DEFAULT 'beginner' NOT NULL,
  	"tint" "enum_courses_tint" DEFAULT 'sage',
  	"order" numeric DEFAULT 0,
  	"status" "enum_courses_status" DEFAULT 'draft',
  	"lesson_count" numeric DEFAULT 0,
  	"enrolled_count" numeric DEFAULT 0,
  	"search_text" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"search_tsv" "tsvector" GENERATED ALWAYS AS ((setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(search_text, '')), 'B'))) STORED
  );
  
  CREATE TABLE "courses_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer
  );
  
  CREATE TABLE "_courses_v_version_modules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"summary" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar NOT NULL,
  	"version_description" varchar NOT NULL,
  	"version_journey_stage" "enum__courses_v_version_journey_stage" NOT NULL,
  	"version_instructor_id" integer,
  	"version_duration_minutes" numeric,
  	"version_slug" varchar,
  	"version_level" "enum__courses_v_version_level" DEFAULT 'beginner' NOT NULL,
  	"version_tint" "enum__courses_v_version_tint" DEFAULT 'sage',
  	"version_order" numeric DEFAULT 0,
  	"version_status" "enum__courses_v_version_status" DEFAULT 'draft',
  	"version_lesson_count" numeric DEFAULT 0,
  	"version_enrolled_count" numeric DEFAULT 0,
  	"version_search_text" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_courses_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer
  );
  
  CREATE TABLE "lessons_quiz_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "lessons_quiz" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"correct_index" numeric NOT NULL,
  	"explanation" varchar
  );
  
  CREATE TABLE "lessons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"course_id" integer NOT NULL,
  	"module" numeric DEFAULT 1 NOT NULL,
  	"order" numeric NOT NULL,
  	"media_kind" "enum_lessons_media_kind" DEFAULT 'none',
  	"media_youtube_id" varchar,
  	"media_audio_id" integer,
  	"media_duration_seconds" numeric,
  	"content" jsonb NOT NULL,
  	"slug" varchar,
  	"duration_minutes" numeric,
  	"status" "enum_lessons_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_lessons_v_version_quiz_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_lessons_v_version_quiz" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"correct_index" numeric NOT NULL,
  	"explanation" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_lessons_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar NOT NULL,
  	"version_course_id" integer NOT NULL,
  	"version_module" numeric DEFAULT 1 NOT NULL,
  	"version_order" numeric NOT NULL,
  	"version_media_kind" "enum__lessons_v_version_media_kind" DEFAULT 'none',
  	"version_media_youtube_id" varchar,
  	"version_media_audio_id" integer,
  	"version_media_duration_seconds" numeric,
  	"version_content" jsonb NOT NULL,
  	"version_slug" varchar,
  	"version_duration_minutes" numeric,
  	"version_status" "enum__lessons_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events_agenda" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"time" varchar NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "events_speaker_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"summary" varchar NOT NULL,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"ends_at" timestamp(3) with time zone,
  	"time_label" varchar,
  	"mode" "enum_events_mode" DEFAULT 'in_person' NOT NULL,
  	"district" "enum_events_district",
  	"category_id" integer,
  	"venue_name" varchar,
  	"venue_address" varchar,
  	"map_url" varchar,
  	"online_url" varchar,
  	"audience" varchar DEFAULT 'সবার জন্য উন্মুক্ত',
  	"separate_seating" boolean DEFAULT false,
  	"allow_guests" boolean DEFAULT true,
  	"description" jsonb,
  	"slug" varchar,
  	"capacity" numeric DEFAULT 100 NOT NULL,
  	"reserved_seats" numeric DEFAULT 0,
  	"registration_open" boolean DEFAULT true,
  	"is_free" boolean DEFAULT true,
  	"circle_id" integer,
  	"status" "enum_events_status" DEFAULT 'draft',
  	"seats_taken" numeric DEFAULT 0,
  	"registration_count" numeric DEFAULT 0,
  	"reminder_sent_at" timestamp(3) with time zone,
  	"search_text" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"search_tsv" "tsvector" GENERATED ALWAYS AS ((setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(search_text, '')), 'B'))) STORED
  );
  
  CREATE TABLE "events_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer
  );
  
  CREATE TABLE "_events_v_version_agenda" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"time" varchar NOT NULL,
  	"item" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v_version_speaker_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar NOT NULL,
  	"version_summary" varchar NOT NULL,
  	"version_starts_at" timestamp(3) with time zone NOT NULL,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_time_label" varchar,
  	"version_mode" "enum__events_v_version_mode" DEFAULT 'in_person' NOT NULL,
  	"version_district" "enum__events_v_version_district",
  	"version_category_id" integer,
  	"version_venue_name" varchar,
  	"version_venue_address" varchar,
  	"version_map_url" varchar,
  	"version_online_url" varchar,
  	"version_audience" varchar DEFAULT 'সবার জন্য উন্মুক্ত',
  	"version_separate_seating" boolean DEFAULT false,
  	"version_allow_guests" boolean DEFAULT true,
  	"version_description" jsonb,
  	"version_slug" varchar,
  	"version_capacity" numeric DEFAULT 100 NOT NULL,
  	"version_reserved_seats" numeric DEFAULT 0,
  	"version_registration_open" boolean DEFAULT true,
  	"version_is_free" boolean DEFAULT true,
  	"version_circle_id" integer,
  	"version_status" "enum__events_v_version_status" DEFAULT 'draft',
  	"version_seats_taken" numeric DEFAULT 0,
  	"version_registration_count" numeric DEFAULT 0,
  	"version_reminder_sent_at" timestamp(3) with time zone,
  	"version_search_text" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_events_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"people_id" integer
  );
  
  CREATE TABLE "event_registrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" integer NOT NULL,
  	"user_id" integer,
  	"code" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar,
  	"seating" "enum_event_registrations_seating",
  	"guests" numeric DEFAULT 0,
  	"status" "enum_event_registrations_status" DEFAULT 'confirmed',
  	"reminder_sent_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "circles_format" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"detail" varchar
  );
  
  CREATE TABLE "circles_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"rule" varchar NOT NULL
  );
  
  CREATE TABLE "circles_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar NOT NULL,
  	"user_id" integer
  );
  
  CREATE TABLE "circles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"district" "enum_circles_district" NOT NULL,
  	"type" "enum_circles_type" NOT NULL,
  	"area" varchar,
  	"focus" varchar NOT NULL,
  	"frequency" "enum_circles_frequency" NOT NULL,
  	"schedule_label" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"venue" varchar,
  	"since_label" varchar,
  	"member_unit" "enum_circles_member_unit" DEFAULT 'people',
  	"slug" varchar,
  	"coordinator_id" integer,
  	"status" "enum_circles_status" DEFAULT 'published',
  	"offline_members" numeric DEFAULT 0,
  	"member_count" numeric DEFAULT 0,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "circle_meetups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"circle_id" integer NOT NULL,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"topic" varchar NOT NULL,
  	"meta" varchar,
  	"attending_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "circle_memberships" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"circle_id" integer NOT NULL,
  	"user_id" integer NOT NULL,
  	"message" varchar,
  	"status" "enum_circle_memberships_status" DEFAULT 'pending',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "meetup_rsvps" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"meetup_id" integer NOT NULL,
  	"user_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "videos_chapters" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start" numeric NOT NULL,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "videos_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_videos_references_type" DEFAULT 'quran' NOT NULL,
  	"citation" varchar NOT NULL,
  	"note" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"short_title" varchar,
  	"youtube_id" varchar NOT NULL,
  	"speaker_id" integer NOT NULL,
  	"category_id" integer NOT NULL,
  	"playlist_id" integer,
  	"episode" numeric,
  	"duration_seconds" numeric NOT NULL,
  	"description" varchar,
  	"slug" varchar,
  	"level" "enum_videos_level" DEFAULT 'beginner' NOT NULL,
  	"tint" "enum_videos_tint" DEFAULT 'teal',
  	"published_at" timestamp(3) with time zone,
  	"view_count" numeric DEFAULT 0,
  	"reviewed" boolean DEFAULT true,
  	"status" "enum_videos_status" DEFAULT 'draft',
  	"search_text" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"search_tsv" "tsvector" GENERATED ALWAYS AS ((setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(search_text, '')), 'B'))) STORED
  );
  
  CREATE TABLE "videos_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"articles_id" integer
  );
  
  CREATE TABLE "_videos_v_version_chapters" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"start" numeric NOT NULL,
  	"title" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_videos_v_version_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__videos_v_version_references_type" DEFAULT 'quran' NOT NULL,
  	"citation" varchar NOT NULL,
  	"note" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_videos_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar NOT NULL,
  	"version_short_title" varchar,
  	"version_youtube_id" varchar NOT NULL,
  	"version_speaker_id" integer NOT NULL,
  	"version_category_id" integer NOT NULL,
  	"version_playlist_id" integer,
  	"version_episode" numeric,
  	"version_duration_seconds" numeric NOT NULL,
  	"version_description" varchar,
  	"version_slug" varchar,
  	"version_level" "enum__videos_v_version_level" DEFAULT 'beginner' NOT NULL,
  	"version_tint" "enum__videos_v_version_tint" DEFAULT 'teal',
  	"version_published_at" timestamp(3) with time zone,
  	"version_view_count" numeric DEFAULT 0,
  	"version_reviewed" boolean DEFAULT true,
  	"version_status" "enum__videos_v_version_status" DEFAULT 'draft',
  	"version_search_text" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_videos_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"articles_id" integer
  );
  
  CREATE TABLE "playlists" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"speaker_label" varchar,
  	"level" "enum_playlists_level" DEFAULT 'beginner',
  	"tint" "enum_playlists_tint" DEFAULT 'teal',
  	"order" numeric DEFAULT 0,
  	"video_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "surahs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" numeric NOT NULL,
  	"name_arabic" varchar NOT NULL,
  	"name_bangla" varchar NOT NULL,
  	"name_latin" varchar NOT NULL,
  	"meaning" varchar,
  	"revelation" "enum_surahs_revelation",
  	"ayah_count" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ayahs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"surah" numeric NOT NULL,
  	"ayah" numeric NOT NULL,
  	"juz" numeric,
  	"key" varchar,
  	"sort_key" numeric,
  	"arabic" varchar NOT NULL,
  	"arabic_plain" varchar,
  	"translation" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"search_tsv" "tsvector" GENERATED ALWAYS AS ((to_tsvector('simple', coalesce(translation, '') || ' ' || coalesce(arabic_plain, '')))) STORED
  );
  
  CREATE TABLE "hadith_collections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"short_name" varchar NOT NULL,
  	"compiler" varchar,
  	"order" numeric DEFAULT 0,
  	"hadith_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "hadiths" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"book_id" integer NOT NULL,
  	"number" numeric NOT NULL,
  	"number_label" varchar,
  	"key" varchar NOT NULL,
  	"chapter" varchar,
  	"narrator" varchar,
  	"arabic" varchar,
  	"arabic_plain" varchar,
  	"text" varchar NOT NULL,
  	"grade" "enum_hadiths_grade" DEFAULT 'unknown',
  	"grade_source" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"search_tsv" "tsvector" GENERATED ALWAYS AS ((to_tsvector('simple', coalesce(text, '') || ' ' || coalesce(narrator, '') || ' ' || coalesce(arabic_plain, '')))) STORED
  );
  
  CREATE TABLE "daily_reminders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_daily_reminders_kind" NOT NULL,
  	"ayah_id" integer,
  	"ayah_to_id" integer,
  	"hadith_id" integer,
  	"custom_arabic" varchar,
  	"custom_translation" varchar,
  	"custom_reference" varchar,
  	"custom_narrator" varchar,
  	"custom_grade" "enum_daily_reminders_custom_grade",
  	"date" timestamp(3) with time zone,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "forum_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"order" numeric DEFAULT 0,
  	"thread_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "forum_threads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"category_id" integer NOT NULL,
  	"author_id" integer NOT NULL,
  	"anonymous" boolean DEFAULT false,
  	"body" varchar NOT NULL,
  	"status" "enum_forum_threads_status" DEFAULT 'pending' NOT NULL,
  	"pinned" boolean DEFAULT false,
  	"locked" boolean DEFAULT false,
  	"helpful_post_id" integer,
  	"mod_note_text" varchar,
  	"mod_note_by_id" integer,
  	"mod_note_at" timestamp(3) with time zone,
  	"reply_count" numeric DEFAULT 0,
  	"view_count" numeric DEFAULT 0,
  	"report_count" numeric DEFAULT 0,
  	"last_activity_at" timestamp(3) with time zone,
  	"last_reply_by_id" integer,
  	"deleted_at" timestamp(3) with time zone,
  	"deleted_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "forum_threads_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "forum_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"thread_id" integer NOT NULL,
  	"parent_id" integer,
  	"author_id" integer NOT NULL,
  	"body" varchar NOT NULL,
  	"arabic" varchar,
  	"reference" varchar,
  	"status" "enum_forum_posts_status" DEFAULT 'published' NOT NULL,
  	"helpful_count" numeric DEFAULT 0,
  	"marked_helpful" boolean DEFAULT false,
  	"report_count" numeric DEFAULT 0,
  	"removed_reason" varchar,
  	"deleted_at" timestamp(3) with time zone,
  	"deleted_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "forum_posts_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "forum_reactions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"post_id" integer NOT NULL,
  	"thread_id" integer NOT NULL,
  	"user_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"target_type" "enum_reports_target_type" NOT NULL,
  	"thread_id" integer,
  	"post_id" integer,
  	"reporter_id" integer NOT NULL,
  	"reason" "enum_reports_reason" NOT NULL,
  	"note" varchar,
  	"status" "enum_reports_status" DEFAULT 'open' NOT NULL,
  	"resolution" varchar,
  	"resolved_by_id" integer,
  	"resolved_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "enrollments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"course_id" integer NOT NULL,
  	"completed_lessons" numeric DEFAULT 0,
  	"progress" numeric DEFAULT 0,
  	"last_lesson_id" integer,
  	"last_activity_at" timestamp(3) with time zone,
  	"completed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "lesson_progress" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"lesson_id" integer NOT NULL,
  	"course_id" integer NOT NULL,
  	"completed_at" timestamp(3) with time zone,
  	"quiz_answers" jsonb,
  	"quiz_correct" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "bookmarks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"target_key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "bookmarks_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"articles_id" integer,
  	"ikhtilaf_topics_id" integer,
  	"videos_id" integer,
  	"questions_id" integer,
  	"ayahs_id" integer,
  	"hadiths_id" integer
  );
  
  CREATE TABLE "notifications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"recipient_id" integer NOT NULL,
  	"kind" "enum_notifications_kind" NOT NULL,
  	"text" varchar NOT NULL,
  	"link" varchar,
  	"read" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "answer_votes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question_id" integer NOT NULL,
  	"voter_key" varchar NOT NULL,
  	"value" "enum_answer_votes_value" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "newsletter_subscribers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"status" "enum_newsletter_subscribers_status" DEFAULT 'subscribed',
  	"source" varchar,
  	"user_id" integer,
  	"unsubscribe_token" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "volunteers_interests" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_volunteers_interests",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "volunteers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar,
  	"district" "enum_volunteers_district" NOT NULL,
  	"message" varchar,
  	"user_id" integer,
  	"status" "enum_volunteers_status" DEFAULT 'new',
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contact_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"topic" "enum_contact_messages_topic" DEFAULT 'general',
  	"subject" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"user_id" integer,
  	"status" "enum_contact_messages_status" DEFAULT 'new',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"lead" varchar,
  	"content" jsonb NOT NULL,
  	"slug" varchar,
  	"status" "enum_pages_status" DEFAULT 'draft',
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar NOT NULL,
  	"version_lead" varchar,
  	"version_content" jsonb NOT NULL,
  	"version_slug" varchar,
  	"version_status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"credit" varchar,
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
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" "enum_audit_logs_action" NOT NULL,
  	"actor_id" integer,
  	"target_collection" varchar,
  	"target_id" varchar,
  	"summary" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rate_limits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"count" numeric DEFAULT 0 NOT NULL,
  	"reset_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"sessions_id" integer,
  	"accounts_id" integer,
  	"verifications_id" integer,
  	"rate_limit_id" integer,
  	"admin_invitations_id" integer,
  	"articles_id" integer,
  	"ikhtilaf_topics_id" integer,
  	"questions_id" integer,
  	"series_id" integer,
  	"categories_id" integer,
  	"tags_id" integer,
  	"people_id" integer,
  	"courses_id" integer,
  	"lessons_id" integer,
  	"events_id" integer,
  	"event_registrations_id" integer,
  	"circles_id" integer,
  	"circle_meetups_id" integer,
  	"circle_memberships_id" integer,
  	"meetup_rsvps_id" integer,
  	"videos_id" integer,
  	"playlists_id" integer,
  	"surahs_id" integer,
  	"ayahs_id" integer,
  	"hadith_collections_id" integer,
  	"hadiths_id" integer,
  	"daily_reminders_id" integer,
  	"forum_categories_id" integer,
  	"forum_threads_id" integer,
  	"forum_posts_id" integer,
  	"forum_reactions_id" integer,
  	"reports_id" integer,
  	"enrollments_id" integer,
  	"lesson_progress_id" integer,
  	"bookmarks_id" integer,
  	"notifications_id" integer,
  	"answer_votes_id" integer,
  	"newsletter_subscribers_id" integer,
  	"volunteers_id" integer,
  	"contact_messages_id" integer,
  	"pages_id" integer,
  	"media_id" integer,
  	"audit_logs_id" integer,
  	"rate_limits_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"footer_blurb" varchar NOT NULL,
  	"newsletter_blurb" varchar NOT NULL,
  	"footer_ayah_arabic" varchar NOT NULL,
  	"footer_ayah_translation" varchar NOT NULL,
  	"footer_ayah_reference" varchar NOT NULL,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"address" varchar,
  	"social_facebook" varchar,
  	"social_youtube" varchar,
  	"social_telegram" varchar,
  	"default_title" varchar,
  	"default_description" varchar,
  	"og_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_page_pledges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_journey_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"stage" "enum_home_page_journey_steps_stage" NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_home_page_values_icon" NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_ikhtilaf_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_ayah_arabic" varchar NOT NULL,
  	"hero_ayah_translation" varchar NOT NULL,
  	"hero_ayah_reference" varchar NOT NULL,
  	"title_line1" varchar NOT NULL,
  	"title_line2" varchar NOT NULL,
  	"subtitle" varchar NOT NULL,
  	"primary_cta_label" varchar NOT NULL,
  	"secondary_cta_label" varchar NOT NULL,
  	"support_arabic" varchar,
  	"support_text" varchar,
  	"pledge_eyebrow" varchar DEFAULT 'আমাদের অঙ্গীকার',
  	"pledge_title" varchar NOT NULL,
  	"journey_title" varchar NOT NULL,
  	"journey_lead" varchar,
  	"values_title" varchar NOT NULL,
  	"values_lead" varchar,
  	"featured_ikhtilaf_id" integer,
  	"ilm_lead" varchar,
  	"cta_title" varchar NOT NULL,
  	"cta_text" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_home_page_v_version_pledges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_journey_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"stage" "enum__home_page_v_version_journey_steps_stage" NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__home_page_v_version_values_icon" NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_ikhtilaf_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_ayah_arabic" varchar NOT NULL,
  	"version_hero_ayah_translation" varchar NOT NULL,
  	"version_hero_ayah_reference" varchar NOT NULL,
  	"version_title_line1" varchar NOT NULL,
  	"version_title_line2" varchar NOT NULL,
  	"version_subtitle" varchar NOT NULL,
  	"version_primary_cta_label" varchar NOT NULL,
  	"version_secondary_cta_label" varchar NOT NULL,
  	"version_support_arabic" varchar,
  	"version_support_text" varchar,
  	"version_pledge_eyebrow" varchar DEFAULT 'আমাদের অঙ্গীকার',
  	"version_pledge_title" varchar NOT NULL,
  	"version_journey_title" varchar NOT NULL,
  	"version_journey_lead" varchar,
  	"version_values_title" varchar NOT NULL,
  	"version_values_lead" varchar,
  	"version_featured_ikhtilaf_id" integer,
  	"version_ilm_lead" varchar,
  	"version_cta_title" varchar NOT NULL,
  	"version_cta_text" varchar NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "about_page_adab_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_about_page_adab_rules_icon" DEFAULT 'book',
  	"tone" "enum_about_page_adab_rules_tone" DEFAULT 'teal',
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "about_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"lead" varchar NOT NULL,
  	"version" varchar,
  	"published_label" varchar,
  	"reading_time" numeric,
  	"manifesto" jsonb NOT NULL,
  	"shura_intro" varchar NOT NULL,
  	"adab_intro" varchar NOT NULL,
  	"cta_title" varchar NOT NULL,
  	"cta_text" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_about_page_v_version_adab_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__about_page_v_version_adab_rules_icon" DEFAULT 'book',
  	"tone" "enum__about_page_v_version_adab_rules_tone" DEFAULT 'teal',
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_about_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_title" varchar NOT NULL,
  	"version_lead" varchar NOT NULL,
  	"version_version" varchar,
  	"version_published_label" varchar,
  	"version_reading_time" numeric,
  	"version_manifesto" jsonb NOT NULL,
  	"version_shura_intro" varchar NOT NULL,
  	"version_adab_intro" varchar NOT NULL,
  	"version_cta_title" varchar NOT NULL,
  	"version_cta_text" varchar NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "adab_policy_enforcement" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"step" varchar NOT NULL,
  	"detail" varchar
  );
  
  CREATE TABLE "adab_policy" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"lead" varchar NOT NULL,
  	"content" jsonb NOT NULL,
  	"updated_label" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_adab_policy_v_version_enforcement" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"step" varchar NOT NULL,
  	"detail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_adab_policy_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_title" varchar NOT NULL,
  	"version_lead" varchar NOT NULL,
  	"version_content" jsonb NOT NULL,
  	"version_updated_label" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "moderation_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"first_posts_moderated" numeric DEFAULT 3,
  	"report_threshold" numeric DEFAULT 3,
  	"max_links" numeric DEFAULT 2,
  	"posts_per_hour" numeric DEFAULT 10,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "moderation_settings_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "users_role" ADD CONSTRAINT "users_role_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_interests" ADD CONSTRAINT "users_interests_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_users_v_version_role" ADD CONSTRAINT "_users_v_version_role_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_users_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_users_v_version_interests" ADD CONSTRAINT "_users_v_version_interests_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_users_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_users_v" ADD CONSTRAINT "_users_v_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_users_v" ADD CONSTRAINT "_users_v_version_person_id_people_id_fk" FOREIGN KEY ("version_person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_impersonated_by_id_users_id_fk" FOREIGN KEY ("impersonated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_references" ADD CONSTRAINT "articles_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_approvals" ADD CONSTRAINT "articles_approvals_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_approvals" ADD CONSTRAINT "articles_approvals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_people_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_references" ADD CONSTRAINT "_articles_v_version_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_approvals" ADD CONSTRAINT "_articles_v_version_approvals_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_version_approvals" ADD CONSTRAINT "_articles_v_version_approvals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_author_id_people_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_series_id_series_id_fk" FOREIGN KEY ("version_series_id") REFERENCES "public"."series"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_published_by_id_users_id_fk" FOREIGN KEY ("version_published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ikhtilaf_topics_consensus" ADD CONSTRAINT "ikhtilaf_topics_consensus_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ikhtilaf_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ikhtilaf_topics_opinions" ADD CONSTRAINT "ikhtilaf_topics_opinions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ikhtilaf_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ikhtilaf_topics_conduct" ADD CONSTRAINT "ikhtilaf_topics_conduct_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ikhtilaf_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ikhtilaf_topics_references" ADD CONSTRAINT "ikhtilaf_topics_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ikhtilaf_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ikhtilaf_topics_approvals" ADD CONSTRAINT "ikhtilaf_topics_approvals_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ikhtilaf_topics_approvals" ADD CONSTRAINT "ikhtilaf_topics_approvals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ikhtilaf_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ikhtilaf_topics" ADD CONSTRAINT "ikhtilaf_topics_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ikhtilaf_topics" ADD CONSTRAINT "ikhtilaf_topics_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ikhtilaf_topics" ADD CONSTRAINT "ikhtilaf_topics_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ikhtilaf_topics" ADD CONSTRAINT "ikhtilaf_topics_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ikhtilaf_topics_texts" ADD CONSTRAINT "ikhtilaf_topics_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ikhtilaf_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ikhtilaf_topics_rels" ADD CONSTRAINT "ikhtilaf_topics_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ikhtilaf_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ikhtilaf_topics_rels" ADD CONSTRAINT "ikhtilaf_topics_rels_ikhtilaf_topics_fk" FOREIGN KEY ("ikhtilaf_topics_id") REFERENCES "public"."ikhtilaf_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ikhtilaf_topics_rels" ADD CONSTRAINT "ikhtilaf_topics_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ikhtilaf_topics_rels" ADD CONSTRAINT "ikhtilaf_topics_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ikhtilaf_topics_v_version_consensus" ADD CONSTRAINT "_ikhtilaf_topics_v_version_consensus_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ikhtilaf_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ikhtilaf_topics_v_version_opinions" ADD CONSTRAINT "_ikhtilaf_topics_v_version_opinions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ikhtilaf_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ikhtilaf_topics_v_version_conduct" ADD CONSTRAINT "_ikhtilaf_topics_v_version_conduct_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ikhtilaf_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ikhtilaf_topics_v_version_references" ADD CONSTRAINT "_ikhtilaf_topics_v_version_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ikhtilaf_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ikhtilaf_topics_v_version_approvals" ADD CONSTRAINT "_ikhtilaf_topics_v_version_approvals_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ikhtilaf_topics_v_version_approvals" ADD CONSTRAINT "_ikhtilaf_topics_v_version_approvals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ikhtilaf_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ikhtilaf_topics_v" ADD CONSTRAINT "_ikhtilaf_topics_v_parent_id_ikhtilaf_topics_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ikhtilaf_topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ikhtilaf_topics_v" ADD CONSTRAINT "_ikhtilaf_topics_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ikhtilaf_topics_v" ADD CONSTRAINT "_ikhtilaf_topics_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ikhtilaf_topics_v" ADD CONSTRAINT "_ikhtilaf_topics_v_version_published_by_id_users_id_fk" FOREIGN KEY ("version_published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ikhtilaf_topics_v" ADD CONSTRAINT "_ikhtilaf_topics_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ikhtilaf_topics_v_texts" ADD CONSTRAINT "_ikhtilaf_topics_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_ikhtilaf_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ikhtilaf_topics_v_rels" ADD CONSTRAINT "_ikhtilaf_topics_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_ikhtilaf_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ikhtilaf_topics_v_rels" ADD CONSTRAINT "_ikhtilaf_topics_v_rels_ikhtilaf_topics_fk" FOREIGN KEY ("ikhtilaf_topics_id") REFERENCES "public"."ikhtilaf_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ikhtilaf_topics_v_rels" ADD CONSTRAINT "_ikhtilaf_topics_v_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ikhtilaf_topics_v_rels" ADD CONSTRAINT "_ikhtilaf_topics_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "questions_references" ADD CONSTRAINT "questions_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "questions_approvals" ADD CONSTRAINT "questions_approvals_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions_approvals" ADD CONSTRAINT "questions_approvals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_asked_by_id_users_id_fk" FOREIGN KEY ("asked_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_answered_by_id_people_id_fk" FOREIGN KEY ("answered_by_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions_rels" ADD CONSTRAINT "questions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "questions_rels" ADD CONSTRAINT "questions_rels_questions_fk" FOREIGN KEY ("questions_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "questions_rels" ADD CONSTRAINT "questions_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "questions_rels" ADD CONSTRAINT "questions_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_questions_v_version_references" ADD CONSTRAINT "_questions_v_version_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_questions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_questions_v_version_approvals" ADD CONSTRAINT "_questions_v_version_approvals_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_questions_v_version_approvals" ADD CONSTRAINT "_questions_v_version_approvals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_questions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_questions_v" ADD CONSTRAINT "_questions_v_parent_id_questions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."questions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_questions_v" ADD CONSTRAINT "_questions_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_questions_v" ADD CONSTRAINT "_questions_v_version_asked_by_id_users_id_fk" FOREIGN KEY ("version_asked_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_questions_v" ADD CONSTRAINT "_questions_v_version_answered_by_id_people_id_fk" FOREIGN KEY ("version_answered_by_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_questions_v" ADD CONSTRAINT "_questions_v_version_assigned_to_id_users_id_fk" FOREIGN KEY ("version_assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_questions_v" ADD CONSTRAINT "_questions_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_questions_v" ADD CONSTRAINT "_questions_v_version_published_by_id_users_id_fk" FOREIGN KEY ("version_published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_questions_v" ADD CONSTRAINT "_questions_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_questions_v_rels" ADD CONSTRAINT "_questions_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_questions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_questions_v_rels" ADD CONSTRAINT "_questions_v_rels_questions_fk" FOREIGN KEY ("questions_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_questions_v_rels" ADD CONSTRAINT "_questions_v_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_questions_v_rels" ADD CONSTRAINT "_questions_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "series" ADD CONSTRAINT "series_author_id_people_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories_used_for" ADD CONSTRAINT "categories_used_for_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people_kinds" ADD CONSTRAINT "people_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people_education" ADD CONSTRAINT "people_education_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people_role_notes" ADD CONSTRAINT "people_role_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people_texts" ADD CONSTRAINT "people_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_modules" ADD CONSTRAINT "courses_modules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_people_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_modules" ADD CONSTRAINT "_courses_v_version_modules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_parent_id_courses_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_instructor_id_people_id_fk" FOREIGN KEY ("version_instructor_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_quiz_options" ADD CONSTRAINT "lessons_quiz_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons_quiz"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_quiz" ADD CONSTRAINT "lessons_quiz_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_media_audio_id_media_id_fk" FOREIGN KEY ("media_audio_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v_version_quiz_options" ADD CONSTRAINT "_lessons_v_version_quiz_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v_version_quiz"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_version_quiz" ADD CONSTRAINT "_lessons_v_version_quiz_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_parent_id_lessons_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_version_course_id_courses_id_fk" FOREIGN KEY ("version_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_version_media_audio_id_media_id_fk" FOREIGN KEY ("version_media_audio_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_agenda" ADD CONSTRAINT "events_agenda_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_speaker_notes" ADD CONSTRAINT "events_speaker_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_circle_id_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_agenda" ADD CONSTRAINT "_events_v_version_agenda_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_speaker_notes" ADD CONSTRAINT "_events_v_version_speaker_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_circle_id_circles_id_fk" FOREIGN KEY ("version_circle_id") REFERENCES "public"."circles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_rels" ADD CONSTRAINT "_events_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_rels" ADD CONSTRAINT "_events_v_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "circles_format" ADD CONSTRAINT "circles_format_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."circles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "circles_rules" ADD CONSTRAINT "circles_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."circles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "circles_team" ADD CONSTRAINT "circles_team_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "circles_team" ADD CONSTRAINT "circles_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."circles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "circles" ADD CONSTRAINT "circles_coordinator_id_users_id_fk" FOREIGN KEY ("coordinator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "circles" ADD CONSTRAINT "circles_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "circle_meetups" ADD CONSTRAINT "circle_meetups_circle_id_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "circle_memberships" ADD CONSTRAINT "circle_memberships_circle_id_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "circle_memberships" ADD CONSTRAINT "circle_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "meetup_rsvps" ADD CONSTRAINT "meetup_rsvps_meetup_id_circle_meetups_id_fk" FOREIGN KEY ("meetup_id") REFERENCES "public"."circle_meetups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "meetup_rsvps" ADD CONSTRAINT "meetup_rsvps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos_chapters" ADD CONSTRAINT "videos_chapters_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "videos_references" ADD CONSTRAINT "videos_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_speaker_id_people_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos_rels" ADD CONSTRAINT "videos_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "videos_rels" ADD CONSTRAINT "videos_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_videos_v_version_chapters" ADD CONSTRAINT "_videos_v_version_chapters_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_videos_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_videos_v_version_references" ADD CONSTRAINT "_videos_v_version_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_videos_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_parent_id_videos_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_speaker_id_people_id_fk" FOREIGN KEY ("version_speaker_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_playlist_id_playlists_id_fk" FOREIGN KEY ("version_playlist_id") REFERENCES "public"."playlists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_videos_v_rels" ADD CONSTRAINT "_videos_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_videos_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_videos_v_rels" ADD CONSTRAINT "_videos_v_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hadiths" ADD CONSTRAINT "hadiths_book_id_hadith_collections_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."hadith_collections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "daily_reminders" ADD CONSTRAINT "daily_reminders_ayah_id_ayahs_id_fk" FOREIGN KEY ("ayah_id") REFERENCES "public"."ayahs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "daily_reminders" ADD CONSTRAINT "daily_reminders_ayah_to_id_ayahs_id_fk" FOREIGN KEY ("ayah_to_id") REFERENCES "public"."ayahs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "daily_reminders" ADD CONSTRAINT "daily_reminders_hadith_id_hadiths_id_fk" FOREIGN KEY ("hadith_id") REFERENCES "public"."hadiths"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_category_id_forum_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."forum_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_helpful_post_id_forum_posts_id_fk" FOREIGN KEY ("helpful_post_id") REFERENCES "public"."forum_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_mod_note_by_id_users_id_fk" FOREIGN KEY ("mod_note_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_last_reply_by_id_users_id_fk" FOREIGN KEY ("last_reply_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_deleted_by_id_users_id_fk" FOREIGN KEY ("deleted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forum_threads_texts" ADD CONSTRAINT "forum_threads_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."forum_threads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_thread_id_forum_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."forum_threads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_parent_id_forum_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."forum_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_deleted_by_id_users_id_fk" FOREIGN KEY ("deleted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forum_posts_texts" ADD CONSTRAINT "forum_posts_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forum_reactions" ADD CONSTRAINT "forum_reactions_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forum_reactions" ADD CONSTRAINT "forum_reactions_thread_id_forum_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."forum_threads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forum_reactions" ADD CONSTRAINT "forum_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reports" ADD CONSTRAINT "reports_thread_id_forum_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."forum_threads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reports" ADD CONSTRAINT "reports_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_last_lesson_id_lessons_id_fk" FOREIGN KEY ("last_lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_ikhtilaf_topics_fk" FOREIGN KEY ("ikhtilaf_topics_id") REFERENCES "public"."ikhtilaf_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_questions_fk" FOREIGN KEY ("questions_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_ayahs_fk" FOREIGN KEY ("ayahs_id") REFERENCES "public"."ayahs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_hadiths_fk" FOREIGN KEY ("hadiths_id") REFERENCES "public"."hadiths"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "answer_votes" ADD CONSTRAINT "answer_votes_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "volunteers_interests" ADD CONSTRAINT "volunteers_interests_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sessions_fk" FOREIGN KEY ("sessions_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_accounts_fk" FOREIGN KEY ("accounts_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_verifications_fk" FOREIGN KEY ("verifications_id") REFERENCES "public"."verifications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rate_limit_fk" FOREIGN KEY ("rate_limit_id") REFERENCES "public"."rate_limit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admin_invitations_fk" FOREIGN KEY ("admin_invitations_id") REFERENCES "public"."admin_invitations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ikhtilaf_topics_fk" FOREIGN KEY ("ikhtilaf_topics_id") REFERENCES "public"."ikhtilaf_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_questions_fk" FOREIGN KEY ("questions_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_series_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lessons_fk" FOREIGN KEY ("lessons_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_registrations_fk" FOREIGN KEY ("event_registrations_id") REFERENCES "public"."event_registrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_circles_fk" FOREIGN KEY ("circles_id") REFERENCES "public"."circles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_circle_meetups_fk" FOREIGN KEY ("circle_meetups_id") REFERENCES "public"."circle_meetups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_circle_memberships_fk" FOREIGN KEY ("circle_memberships_id") REFERENCES "public"."circle_memberships"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_meetup_rsvps_fk" FOREIGN KEY ("meetup_rsvps_id") REFERENCES "public"."meetup_rsvps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_surahs_fk" FOREIGN KEY ("surahs_id") REFERENCES "public"."surahs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ayahs_fk" FOREIGN KEY ("ayahs_id") REFERENCES "public"."ayahs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hadith_collections_fk" FOREIGN KEY ("hadith_collections_id") REFERENCES "public"."hadith_collections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hadiths_fk" FOREIGN KEY ("hadiths_id") REFERENCES "public"."hadiths"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_daily_reminders_fk" FOREIGN KEY ("daily_reminders_id") REFERENCES "public"."daily_reminders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_forum_categories_fk" FOREIGN KEY ("forum_categories_id") REFERENCES "public"."forum_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_forum_threads_fk" FOREIGN KEY ("forum_threads_id") REFERENCES "public"."forum_threads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_forum_posts_fk" FOREIGN KEY ("forum_posts_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_forum_reactions_fk" FOREIGN KEY ("forum_reactions_id") REFERENCES "public"."forum_reactions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reports_fk" FOREIGN KEY ("reports_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_enrollments_fk" FOREIGN KEY ("enrollments_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lesson_progress_fk" FOREIGN KEY ("lesson_progress_id") REFERENCES "public"."lesson_progress"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookmarks_fk" FOREIGN KEY ("bookmarks_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notifications_fk" FOREIGN KEY ("notifications_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_answer_votes_fk" FOREIGN KEY ("answer_votes_id") REFERENCES "public"."answer_votes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletter_subscribers_fk" FOREIGN KEY ("newsletter_subscribers_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_volunteers_fk" FOREIGN KEY ("volunteers_id") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_messages_fk" FOREIGN KEY ("contact_messages_id") REFERENCES "public"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rate_limits_fk" FOREIGN KEY ("rate_limits_id") REFERENCES "public"."rate_limits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_pledges" ADD CONSTRAINT "home_page_pledges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_journey_steps" ADD CONSTRAINT "home_page_journey_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_values" ADD CONSTRAINT "home_page_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_ikhtilaf_points" ADD CONSTRAINT "home_page_ikhtilaf_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_featured_ikhtilaf_id_ikhtilaf_topics_id_fk" FOREIGN KEY ("featured_ikhtilaf_id") REFERENCES "public"."ikhtilaf_topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_pledges" ADD CONSTRAINT "_home_page_v_version_pledges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_journey_steps" ADD CONSTRAINT "_home_page_v_version_journey_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_values" ADD CONSTRAINT "_home_page_v_version_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_ikhtilaf_points" ADD CONSTRAINT "_home_page_v_version_ikhtilaf_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_featured_ikhtilaf_id_ikhtilaf_topics_id_fk" FOREIGN KEY ("version_featured_ikhtilaf_id") REFERENCES "public"."ikhtilaf_topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page_adab_rules" ADD CONSTRAINT "about_page_adab_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v_version_adab_rules" ADD CONSTRAINT "_about_page_v_version_adab_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "adab_policy_enforcement" ADD CONSTRAINT "adab_policy_enforcement_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."adab_policy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_adab_policy_v_version_enforcement" ADD CONSTRAINT "_adab_policy_v_version_enforcement_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_adab_policy_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "moderation_settings_texts" ADD CONSTRAINT "moderation_settings_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."moderation_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_role_order_idx" ON "users_role" USING btree ("order");
  CREATE INDEX "users_role_parent_idx" ON "users_role" USING btree ("parent_id");
  CREATE INDEX "users_interests_order_idx" ON "users_interests" USING btree ("order");
  CREATE INDEX "users_interests_parent_idx" ON "users_interests" USING btree ("parent_id");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE UNIQUE INDEX "users_phone_number_idx" ON "users" USING btree ("phone_number");
  CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");
  CREATE INDEX "users_district_idx" ON "users" USING btree ("district");
  CREATE INDEX "users_person_idx" ON "users" USING btree ("person_id");
  CREATE INDEX "_users_v_version_role_order_idx" ON "_users_v_version_role" USING btree ("order");
  CREATE INDEX "_users_v_version_role_parent_idx" ON "_users_v_version_role" USING btree ("parent_id");
  CREATE INDEX "_users_v_version_interests_order_idx" ON "_users_v_version_interests" USING btree ("order");
  CREATE INDEX "_users_v_version_interests_parent_idx" ON "_users_v_version_interests" USING btree ("parent_id");
  CREATE INDEX "_users_v_parent_idx" ON "_users_v" USING btree ("parent_id");
  CREATE INDEX "_users_v_version_version_email_idx" ON "_users_v" USING btree ("version_email");
  CREATE INDEX "_users_v_version_version_created_at_idx" ON "_users_v" USING btree ("version_created_at");
  CREATE INDEX "_users_v_version_version_updated_at_idx" ON "_users_v" USING btree ("version_updated_at");
  CREATE INDEX "_users_v_version_version_phone_number_idx" ON "_users_v" USING btree ("version_phone_number");
  CREATE INDEX "_users_v_version_version_username_idx" ON "_users_v" USING btree ("version_username");
  CREATE INDEX "_users_v_version_version_district_idx" ON "_users_v" USING btree ("version_district");
  CREATE INDEX "_users_v_version_version_person_idx" ON "_users_v" USING btree ("version_person_id");
  CREATE INDEX "_users_v_created_at_idx" ON "_users_v" USING btree ("created_at");
  CREATE INDEX "_users_v_updated_at_idx" ON "_users_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");
  CREATE INDEX "sessions_created_at_idx" ON "sessions" USING btree ("created_at");
  CREATE INDEX "sessions_updated_at_idx" ON "sessions" USING btree ("updated_at");
  CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");
  CREATE INDEX "sessions_impersonated_by_idx" ON "sessions" USING btree ("impersonated_by_id");
  CREATE INDEX "accounts_account_id_idx" ON "accounts" USING btree ("account_id");
  CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");
  CREATE INDEX "accounts_created_at_idx" ON "accounts" USING btree ("created_at");
  CREATE INDEX "accounts_updated_at_idx" ON "accounts" USING btree ("updated_at");
  CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");
  CREATE INDEX "verifications_created_at_idx" ON "verifications" USING btree ("created_at");
  CREATE INDEX "verifications_updated_at_idx" ON "verifications" USING btree ("updated_at");
  CREATE UNIQUE INDEX "rate_limit_key_idx" ON "rate_limit" USING btree ("key");
  CREATE INDEX "rate_limit_updated_at_idx" ON "rate_limit" USING btree ("updated_at");
  CREATE INDEX "rate_limit_created_at_idx" ON "rate_limit" USING btree ("created_at");
  CREATE INDEX "admin_invitations_token_idx" ON "admin_invitations" USING btree ("token");
  CREATE INDEX "admin_invitations_updated_at_idx" ON "admin_invitations" USING btree ("updated_at");
  CREATE INDEX "admin_invitations_created_at_idx" ON "admin_invitations" USING btree ("created_at");
  CREATE INDEX "articles_references_order_idx" ON "articles_references" USING btree ("_order");
  CREATE INDEX "articles_references_parent_id_idx" ON "articles_references" USING btree ("_parent_id");
  CREATE INDEX "articles_approvals_order_idx" ON "articles_approvals" USING btree ("_order");
  CREATE INDEX "articles_approvals_parent_id_idx" ON "articles_approvals" USING btree ("_parent_id");
  CREATE INDEX "articles_approvals_reviewer_idx" ON "articles_approvals" USING btree ("reviewer_id");
  CREATE INDEX "articles_category_idx" ON "articles" USING btree ("category_id");
  CREATE INDEX "articles_author_idx" ON "articles" USING btree ("author_id");
  CREATE INDEX "articles_series_idx" ON "articles" USING btree ("series_id");
  CREATE INDEX "articles_cover_image_idx" ON "articles" USING btree ("cover_image_id");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_level_idx" ON "articles" USING btree ("level");
  CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at");
  CREATE INDEX "articles_review_status_idx" ON "articles" USING btree ("review_status");
  CREATE INDEX "articles_created_by_idx" ON "articles" USING btree ("created_by_id");
  CREATE INDEX "articles_published_by_idx" ON "articles" USING btree ("published_by_id");
  CREATE INDEX "articles_meta_meta_image_idx" ON "articles" USING btree ("meta_image_id");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "articles" USING btree ("_status");
  CREATE INDEX "articles_search_tsv_idx" ON "articles" USING gin ("search_tsv");
  CREATE INDEX "articles_title_trgm_idx" ON "articles" USING gin ("title" gin_trgm_ops);
  CREATE INDEX "articles_rels_order_idx" ON "articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_tags_id_idx" ON "articles_rels" USING btree ("tags_id");
  CREATE INDEX "articles_rels_articles_id_idx" ON "articles_rels" USING btree ("articles_id");
  CREATE INDEX "articles_rels_people_id_idx" ON "articles_rels" USING btree ("people_id");
  CREATE INDEX "articles_rels_users_id_idx" ON "articles_rels" USING btree ("users_id");
  CREATE INDEX "_articles_v_version_references_order_idx" ON "_articles_v_version_references" USING btree ("_order");
  CREATE INDEX "_articles_v_version_references_parent_id_idx" ON "_articles_v_version_references" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_approvals_order_idx" ON "_articles_v_version_approvals" USING btree ("_order");
  CREATE INDEX "_articles_v_version_approvals_parent_id_idx" ON "_articles_v_version_approvals" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_approvals_reviewer_idx" ON "_articles_v_version_approvals" USING btree ("reviewer_id");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_category_idx" ON "_articles_v" USING btree ("version_category_id");
  CREATE INDEX "_articles_v_version_version_author_idx" ON "_articles_v" USING btree ("version_author_id");
  CREATE INDEX "_articles_v_version_version_series_idx" ON "_articles_v" USING btree ("version_series_id");
  CREATE INDEX "_articles_v_version_version_cover_image_idx" ON "_articles_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_level_idx" ON "_articles_v" USING btree ("version_level");
  CREATE INDEX "_articles_v_version_version_published_at_idx" ON "_articles_v" USING btree ("version_published_at");
  CREATE INDEX "_articles_v_version_version_review_status_idx" ON "_articles_v" USING btree ("version_review_status");
  CREATE INDEX "_articles_v_version_version_created_by_idx" ON "_articles_v" USING btree ("version_created_by_id");
  CREATE INDEX "_articles_v_version_version_published_by_idx" ON "_articles_v" USING btree ("version_published_by_id");
  CREATE INDEX "_articles_v_version_meta_version_meta_image_idx" ON "_articles_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_autosave_idx" ON "_articles_v" USING btree ("autosave");
  CREATE INDEX "_articles_v_rels_order_idx" ON "_articles_v_rels" USING btree ("order");
  CREATE INDEX "_articles_v_rels_parent_idx" ON "_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_articles_v_rels_path_idx" ON "_articles_v_rels" USING btree ("path");
  CREATE INDEX "_articles_v_rels_tags_id_idx" ON "_articles_v_rels" USING btree ("tags_id");
  CREATE INDEX "_articles_v_rels_articles_id_idx" ON "_articles_v_rels" USING btree ("articles_id");
  CREATE INDEX "_articles_v_rels_people_id_idx" ON "_articles_v_rels" USING btree ("people_id");
  CREATE INDEX "_articles_v_rels_users_id_idx" ON "_articles_v_rels" USING btree ("users_id");
  CREATE INDEX "ikhtilaf_topics_consensus_order_idx" ON "ikhtilaf_topics_consensus" USING btree ("_order");
  CREATE INDEX "ikhtilaf_topics_consensus_parent_id_idx" ON "ikhtilaf_topics_consensus" USING btree ("_parent_id");
  CREATE INDEX "ikhtilaf_topics_opinions_order_idx" ON "ikhtilaf_topics_opinions" USING btree ("_order");
  CREATE INDEX "ikhtilaf_topics_opinions_parent_id_idx" ON "ikhtilaf_topics_opinions" USING btree ("_parent_id");
  CREATE INDEX "ikhtilaf_topics_conduct_order_idx" ON "ikhtilaf_topics_conduct" USING btree ("_order");
  CREATE INDEX "ikhtilaf_topics_conduct_parent_id_idx" ON "ikhtilaf_topics_conduct" USING btree ("_parent_id");
  CREATE INDEX "ikhtilaf_topics_references_order_idx" ON "ikhtilaf_topics_references" USING btree ("_order");
  CREATE INDEX "ikhtilaf_topics_references_parent_id_idx" ON "ikhtilaf_topics_references" USING btree ("_parent_id");
  CREATE INDEX "ikhtilaf_topics_approvals_order_idx" ON "ikhtilaf_topics_approvals" USING btree ("_order");
  CREATE INDEX "ikhtilaf_topics_approvals_parent_id_idx" ON "ikhtilaf_topics_approvals" USING btree ("_parent_id");
  CREATE INDEX "ikhtilaf_topics_approvals_reviewer_idx" ON "ikhtilaf_topics_approvals" USING btree ("reviewer_id");
  CREATE INDEX "ikhtilaf_topics_category_idx" ON "ikhtilaf_topics" USING btree ("category_id");
  CREATE UNIQUE INDEX "ikhtilaf_topics_slug_idx" ON "ikhtilaf_topics" USING btree ("slug");
  CREATE INDEX "ikhtilaf_topics_level_idx" ON "ikhtilaf_topics" USING btree ("level");
  CREATE INDEX "ikhtilaf_topics_published_at_idx" ON "ikhtilaf_topics" USING btree ("published_at");
  CREATE INDEX "ikhtilaf_topics_review_status_idx" ON "ikhtilaf_topics" USING btree ("review_status");
  CREATE INDEX "ikhtilaf_topics_created_by_idx" ON "ikhtilaf_topics" USING btree ("created_by_id");
  CREATE INDEX "ikhtilaf_topics_published_by_idx" ON "ikhtilaf_topics" USING btree ("published_by_id");
  CREATE INDEX "ikhtilaf_topics_meta_meta_image_idx" ON "ikhtilaf_topics" USING btree ("meta_image_id");
  CREATE INDEX "ikhtilaf_topics_updated_at_idx" ON "ikhtilaf_topics" USING btree ("updated_at");
  CREATE INDEX "ikhtilaf_topics_created_at_idx" ON "ikhtilaf_topics" USING btree ("created_at");
  CREATE INDEX "ikhtilaf_topics__status_idx" ON "ikhtilaf_topics" USING btree ("_status");
  CREATE INDEX "ikhtilaf_topics_search_tsv_idx" ON "ikhtilaf_topics" USING gin ("search_tsv");
  CREATE INDEX "ikhtilaf_topics_title_trgm_idx" ON "ikhtilaf_topics" USING gin ("title" gin_trgm_ops);
  CREATE INDEX "ikhtilaf_topics_texts_order_parent" ON "ikhtilaf_topics_texts" USING btree ("order","parent_id");
  CREATE INDEX "ikhtilaf_topics_rels_order_idx" ON "ikhtilaf_topics_rels" USING btree ("order");
  CREATE INDEX "ikhtilaf_topics_rels_parent_idx" ON "ikhtilaf_topics_rels" USING btree ("parent_id");
  CREATE INDEX "ikhtilaf_topics_rels_path_idx" ON "ikhtilaf_topics_rels" USING btree ("path");
  CREATE INDEX "ikhtilaf_topics_rels_ikhtilaf_topics_id_idx" ON "ikhtilaf_topics_rels" USING btree ("ikhtilaf_topics_id");
  CREATE INDEX "ikhtilaf_topics_rels_people_id_idx" ON "ikhtilaf_topics_rels" USING btree ("people_id");
  CREATE INDEX "ikhtilaf_topics_rels_users_id_idx" ON "ikhtilaf_topics_rels" USING btree ("users_id");
  CREATE INDEX "_ikhtilaf_topics_v_version_consensus_order_idx" ON "_ikhtilaf_topics_v_version_consensus" USING btree ("_order");
  CREATE INDEX "_ikhtilaf_topics_v_version_consensus_parent_id_idx" ON "_ikhtilaf_topics_v_version_consensus" USING btree ("_parent_id");
  CREATE INDEX "_ikhtilaf_topics_v_version_opinions_order_idx" ON "_ikhtilaf_topics_v_version_opinions" USING btree ("_order");
  CREATE INDEX "_ikhtilaf_topics_v_version_opinions_parent_id_idx" ON "_ikhtilaf_topics_v_version_opinions" USING btree ("_parent_id");
  CREATE INDEX "_ikhtilaf_topics_v_version_conduct_order_idx" ON "_ikhtilaf_topics_v_version_conduct" USING btree ("_order");
  CREATE INDEX "_ikhtilaf_topics_v_version_conduct_parent_id_idx" ON "_ikhtilaf_topics_v_version_conduct" USING btree ("_parent_id");
  CREATE INDEX "_ikhtilaf_topics_v_version_references_order_idx" ON "_ikhtilaf_topics_v_version_references" USING btree ("_order");
  CREATE INDEX "_ikhtilaf_topics_v_version_references_parent_id_idx" ON "_ikhtilaf_topics_v_version_references" USING btree ("_parent_id");
  CREATE INDEX "_ikhtilaf_topics_v_version_approvals_order_idx" ON "_ikhtilaf_topics_v_version_approvals" USING btree ("_order");
  CREATE INDEX "_ikhtilaf_topics_v_version_approvals_parent_id_idx" ON "_ikhtilaf_topics_v_version_approvals" USING btree ("_parent_id");
  CREATE INDEX "_ikhtilaf_topics_v_version_approvals_reviewer_idx" ON "_ikhtilaf_topics_v_version_approvals" USING btree ("reviewer_id");
  CREATE INDEX "_ikhtilaf_topics_v_parent_idx" ON "_ikhtilaf_topics_v" USING btree ("parent_id");
  CREATE INDEX "_ikhtilaf_topics_v_version_version_category_idx" ON "_ikhtilaf_topics_v" USING btree ("version_category_id");
  CREATE INDEX "_ikhtilaf_topics_v_version_version_slug_idx" ON "_ikhtilaf_topics_v" USING btree ("version_slug");
  CREATE INDEX "_ikhtilaf_topics_v_version_version_level_idx" ON "_ikhtilaf_topics_v" USING btree ("version_level");
  CREATE INDEX "_ikhtilaf_topics_v_version_version_published_at_idx" ON "_ikhtilaf_topics_v" USING btree ("version_published_at");
  CREATE INDEX "_ikhtilaf_topics_v_version_version_review_status_idx" ON "_ikhtilaf_topics_v" USING btree ("version_review_status");
  CREATE INDEX "_ikhtilaf_topics_v_version_version_created_by_idx" ON "_ikhtilaf_topics_v" USING btree ("version_created_by_id");
  CREATE INDEX "_ikhtilaf_topics_v_version_version_published_by_idx" ON "_ikhtilaf_topics_v" USING btree ("version_published_by_id");
  CREATE INDEX "_ikhtilaf_topics_v_version_meta_version_meta_image_idx" ON "_ikhtilaf_topics_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_ikhtilaf_topics_v_version_version_updated_at_idx" ON "_ikhtilaf_topics_v" USING btree ("version_updated_at");
  CREATE INDEX "_ikhtilaf_topics_v_version_version_created_at_idx" ON "_ikhtilaf_topics_v" USING btree ("version_created_at");
  CREATE INDEX "_ikhtilaf_topics_v_version_version__status_idx" ON "_ikhtilaf_topics_v" USING btree ("version__status");
  CREATE INDEX "_ikhtilaf_topics_v_created_at_idx" ON "_ikhtilaf_topics_v" USING btree ("created_at");
  CREATE INDEX "_ikhtilaf_topics_v_updated_at_idx" ON "_ikhtilaf_topics_v" USING btree ("updated_at");
  CREATE INDEX "_ikhtilaf_topics_v_latest_idx" ON "_ikhtilaf_topics_v" USING btree ("latest");
  CREATE INDEX "_ikhtilaf_topics_v_autosave_idx" ON "_ikhtilaf_topics_v" USING btree ("autosave");
  CREATE INDEX "_ikhtilaf_topics_v_texts_order_parent" ON "_ikhtilaf_topics_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_ikhtilaf_topics_v_rels_order_idx" ON "_ikhtilaf_topics_v_rels" USING btree ("order");
  CREATE INDEX "_ikhtilaf_topics_v_rels_parent_idx" ON "_ikhtilaf_topics_v_rels" USING btree ("parent_id");
  CREATE INDEX "_ikhtilaf_topics_v_rels_path_idx" ON "_ikhtilaf_topics_v_rels" USING btree ("path");
  CREATE INDEX "_ikhtilaf_topics_v_rels_ikhtilaf_topics_id_idx" ON "_ikhtilaf_topics_v_rels" USING btree ("ikhtilaf_topics_id");
  CREATE INDEX "_ikhtilaf_topics_v_rels_people_id_idx" ON "_ikhtilaf_topics_v_rels" USING btree ("people_id");
  CREATE INDEX "_ikhtilaf_topics_v_rels_users_id_idx" ON "_ikhtilaf_topics_v_rels" USING btree ("users_id");
  CREATE INDEX "questions_references_order_idx" ON "questions_references" USING btree ("_order");
  CREATE INDEX "questions_references_parent_id_idx" ON "questions_references" USING btree ("_parent_id");
  CREATE INDEX "questions_approvals_order_idx" ON "questions_approvals" USING btree ("_order");
  CREATE INDEX "questions_approvals_parent_id_idx" ON "questions_approvals" USING btree ("_parent_id");
  CREATE INDEX "questions_approvals_reviewer_idx" ON "questions_approvals" USING btree ("reviewer_id");
  CREATE INDEX "questions_category_idx" ON "questions" USING btree ("category_id");
  CREATE INDEX "questions_asked_by_idx" ON "questions" USING btree ("asked_by_id");
  CREATE INDEX "questions_answered_by_idx" ON "questions" USING btree ("answered_by_id");
  CREATE UNIQUE INDEX "questions_slug_idx" ON "questions" USING btree ("slug");
  CREATE INDEX "questions_moderation_idx" ON "questions" USING btree ("moderation");
  CREATE INDEX "questions_assigned_to_idx" ON "questions" USING btree ("assigned_to_id");
  CREATE INDEX "questions_published_at_idx" ON "questions" USING btree ("published_at");
  CREATE INDEX "questions_review_status_idx" ON "questions" USING btree ("review_status");
  CREATE INDEX "questions_created_by_idx" ON "questions" USING btree ("created_by_id");
  CREATE INDEX "questions_published_by_idx" ON "questions" USING btree ("published_by_id");
  CREATE INDEX "questions_meta_meta_image_idx" ON "questions" USING btree ("meta_image_id");
  CREATE INDEX "questions_updated_at_idx" ON "questions" USING btree ("updated_at");
  CREATE INDEX "questions_created_at_idx" ON "questions" USING btree ("created_at");
  CREATE INDEX "questions__status_idx" ON "questions" USING btree ("_status");
  CREATE INDEX "questions_search_tsv_idx" ON "questions" USING gin ("search_tsv");
  CREATE INDEX "questions_title_trgm_idx" ON "questions" USING gin ("title" gin_trgm_ops);
  CREATE INDEX "questions_rels_order_idx" ON "questions_rels" USING btree ("order");
  CREATE INDEX "questions_rels_parent_idx" ON "questions_rels" USING btree ("parent_id");
  CREATE INDEX "questions_rels_path_idx" ON "questions_rels" USING btree ("path");
  CREATE INDEX "questions_rels_questions_id_idx" ON "questions_rels" USING btree ("questions_id");
  CREATE INDEX "questions_rels_people_id_idx" ON "questions_rels" USING btree ("people_id");
  CREATE INDEX "questions_rels_users_id_idx" ON "questions_rels" USING btree ("users_id");
  CREATE INDEX "_questions_v_version_references_order_idx" ON "_questions_v_version_references" USING btree ("_order");
  CREATE INDEX "_questions_v_version_references_parent_id_idx" ON "_questions_v_version_references" USING btree ("_parent_id");
  CREATE INDEX "_questions_v_version_approvals_order_idx" ON "_questions_v_version_approvals" USING btree ("_order");
  CREATE INDEX "_questions_v_version_approvals_parent_id_idx" ON "_questions_v_version_approvals" USING btree ("_parent_id");
  CREATE INDEX "_questions_v_version_approvals_reviewer_idx" ON "_questions_v_version_approvals" USING btree ("reviewer_id");
  CREATE INDEX "_questions_v_parent_idx" ON "_questions_v" USING btree ("parent_id");
  CREATE INDEX "_questions_v_version_version_category_idx" ON "_questions_v" USING btree ("version_category_id");
  CREATE INDEX "_questions_v_version_version_asked_by_idx" ON "_questions_v" USING btree ("version_asked_by_id");
  CREATE INDEX "_questions_v_version_version_answered_by_idx" ON "_questions_v" USING btree ("version_answered_by_id");
  CREATE INDEX "_questions_v_version_version_slug_idx" ON "_questions_v" USING btree ("version_slug");
  CREATE INDEX "_questions_v_version_version_moderation_idx" ON "_questions_v" USING btree ("version_moderation");
  CREATE INDEX "_questions_v_version_version_assigned_to_idx" ON "_questions_v" USING btree ("version_assigned_to_id");
  CREATE INDEX "_questions_v_version_version_published_at_idx" ON "_questions_v" USING btree ("version_published_at");
  CREATE INDEX "_questions_v_version_version_review_status_idx" ON "_questions_v" USING btree ("version_review_status");
  CREATE INDEX "_questions_v_version_version_created_by_idx" ON "_questions_v" USING btree ("version_created_by_id");
  CREATE INDEX "_questions_v_version_version_published_by_idx" ON "_questions_v" USING btree ("version_published_by_id");
  CREATE INDEX "_questions_v_version_meta_version_meta_image_idx" ON "_questions_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_questions_v_version_version_updated_at_idx" ON "_questions_v" USING btree ("version_updated_at");
  CREATE INDEX "_questions_v_version_version_created_at_idx" ON "_questions_v" USING btree ("version_created_at");
  CREATE INDEX "_questions_v_version_version__status_idx" ON "_questions_v" USING btree ("version__status");
  CREATE INDEX "_questions_v_created_at_idx" ON "_questions_v" USING btree ("created_at");
  CREATE INDEX "_questions_v_updated_at_idx" ON "_questions_v" USING btree ("updated_at");
  CREATE INDEX "_questions_v_latest_idx" ON "_questions_v" USING btree ("latest");
  CREATE INDEX "_questions_v_autosave_idx" ON "_questions_v" USING btree ("autosave");
  CREATE INDEX "_questions_v_rels_order_idx" ON "_questions_v_rels" USING btree ("order");
  CREATE INDEX "_questions_v_rels_parent_idx" ON "_questions_v_rels" USING btree ("parent_id");
  CREATE INDEX "_questions_v_rels_path_idx" ON "_questions_v_rels" USING btree ("path");
  CREATE INDEX "_questions_v_rels_questions_id_idx" ON "_questions_v_rels" USING btree ("questions_id");
  CREATE INDEX "_questions_v_rels_people_id_idx" ON "_questions_v_rels" USING btree ("people_id");
  CREATE INDEX "_questions_v_rels_users_id_idx" ON "_questions_v_rels" USING btree ("users_id");
  CREATE UNIQUE INDEX "series_slug_idx" ON "series" USING btree ("slug");
  CREATE INDEX "series_author_idx" ON "series" USING btree ("author_id");
  CREATE INDEX "series_updated_at_idx" ON "series" USING btree ("updated_at");
  CREATE INDEX "series_created_at_idx" ON "series" USING btree ("created_at");
  CREATE INDEX "categories_used_for_order_idx" ON "categories_used_for" USING btree ("order");
  CREATE INDEX "categories_used_for_parent_idx" ON "categories_used_for" USING btree ("parent_id");
  CREATE INDEX "categories_used_for_value_idx" ON "categories_used_for" USING btree ("value");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE INDEX "people_kinds_order_idx" ON "people_kinds" USING btree ("order");
  CREATE INDEX "people_kinds_parent_idx" ON "people_kinds" USING btree ("parent_id");
  CREATE INDEX "people_kinds_value_idx" ON "people_kinds" USING btree ("value");
  CREATE INDEX "people_education_order_idx" ON "people_education" USING btree ("_order");
  CREATE INDEX "people_education_parent_id_idx" ON "people_education" USING btree ("_parent_id");
  CREATE INDEX "people_role_notes_order_idx" ON "people_role_notes" USING btree ("_order");
  CREATE INDEX "people_role_notes_parent_id_idx" ON "people_role_notes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "people_slug_idx" ON "people" USING btree ("slug");
  CREATE INDEX "people_active_idx" ON "people" USING btree ("active");
  CREATE INDEX "people_photo_idx" ON "people" USING btree ("photo_id");
  CREATE INDEX "people_user_idx" ON "people" USING btree ("user_id");
  CREATE INDEX "people_meta_meta_image_idx" ON "people" USING btree ("meta_image_id");
  CREATE INDEX "people_updated_at_idx" ON "people" USING btree ("updated_at");
  CREATE INDEX "people_created_at_idx" ON "people" USING btree ("created_at");
  CREATE INDEX "people_search_tsv_idx" ON "people" USING gin ("search_tsv");
  CREATE INDEX "people_name_trgm_idx" ON "people" USING gin ("name" gin_trgm_ops);
  CREATE INDEX "people_texts_order_parent" ON "people_texts" USING btree ("order","parent_id");
  CREATE INDEX "courses_modules_order_idx" ON "courses_modules" USING btree ("_order");
  CREATE INDEX "courses_modules_parent_id_idx" ON "courses_modules" USING btree ("_parent_id");
  CREATE INDEX "courses_journey_stage_idx" ON "courses" USING btree ("journey_stage");
  CREATE INDEX "courses_instructor_idx" ON "courses" USING btree ("instructor_id");
  CREATE UNIQUE INDEX "courses_slug_idx" ON "courses" USING btree ("slug");
  CREATE INDEX "courses_level_idx" ON "courses" USING btree ("level");
  CREATE INDEX "courses_status_idx" ON "courses" USING btree ("status");
  CREATE INDEX "courses_meta_meta_image_idx" ON "courses" USING btree ("meta_image_id");
  CREATE INDEX "courses_updated_at_idx" ON "courses" USING btree ("updated_at");
  CREATE INDEX "courses_created_at_idx" ON "courses" USING btree ("created_at");
  CREATE INDEX "courses_search_tsv_idx" ON "courses" USING gin ("search_tsv");
  CREATE INDEX "courses_title_trgm_idx" ON "courses" USING gin ("title" gin_trgm_ops);
  CREATE INDEX "courses_rels_order_idx" ON "courses_rels" USING btree ("order");
  CREATE INDEX "courses_rels_parent_idx" ON "courses_rels" USING btree ("parent_id");
  CREATE INDEX "courses_rels_path_idx" ON "courses_rels" USING btree ("path");
  CREATE INDEX "courses_rels_people_id_idx" ON "courses_rels" USING btree ("people_id");
  CREATE INDEX "_courses_v_version_modules_order_idx" ON "_courses_v_version_modules" USING btree ("_order");
  CREATE INDEX "_courses_v_version_modules_parent_id_idx" ON "_courses_v_version_modules" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_parent_idx" ON "_courses_v" USING btree ("parent_id");
  CREATE INDEX "_courses_v_version_version_journey_stage_idx" ON "_courses_v" USING btree ("version_journey_stage");
  CREATE INDEX "_courses_v_version_version_instructor_idx" ON "_courses_v" USING btree ("version_instructor_id");
  CREATE INDEX "_courses_v_version_version_slug_idx" ON "_courses_v" USING btree ("version_slug");
  CREATE INDEX "_courses_v_version_version_level_idx" ON "_courses_v" USING btree ("version_level");
  CREATE INDEX "_courses_v_version_version_status_idx" ON "_courses_v" USING btree ("version_status");
  CREATE INDEX "_courses_v_version_meta_version_meta_image_idx" ON "_courses_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_courses_v_version_version_updated_at_idx" ON "_courses_v" USING btree ("version_updated_at");
  CREATE INDEX "_courses_v_version_version_created_at_idx" ON "_courses_v" USING btree ("version_created_at");
  CREATE INDEX "_courses_v_created_at_idx" ON "_courses_v" USING btree ("created_at");
  CREATE INDEX "_courses_v_updated_at_idx" ON "_courses_v" USING btree ("updated_at");
  CREATE INDEX "_courses_v_rels_order_idx" ON "_courses_v_rels" USING btree ("order");
  CREATE INDEX "_courses_v_rels_parent_idx" ON "_courses_v_rels" USING btree ("parent_id");
  CREATE INDEX "_courses_v_rels_path_idx" ON "_courses_v_rels" USING btree ("path");
  CREATE INDEX "_courses_v_rels_people_id_idx" ON "_courses_v_rels" USING btree ("people_id");
  CREATE INDEX "lessons_quiz_options_order_idx" ON "lessons_quiz_options" USING btree ("_order");
  CREATE INDEX "lessons_quiz_options_parent_id_idx" ON "lessons_quiz_options" USING btree ("_parent_id");
  CREATE INDEX "lessons_quiz_order_idx" ON "lessons_quiz" USING btree ("_order");
  CREATE INDEX "lessons_quiz_parent_id_idx" ON "lessons_quiz" USING btree ("_parent_id");
  CREATE INDEX "lessons_course_idx" ON "lessons" USING btree ("course_id");
  CREATE INDEX "lessons_order_idx" ON "lessons" USING btree ("order");
  CREATE INDEX "lessons_media_media_audio_idx" ON "lessons" USING btree ("media_audio_id");
  CREATE INDEX "lessons_slug_idx" ON "lessons" USING btree ("slug");
  CREATE INDEX "lessons_status_idx" ON "lessons" USING btree ("status");
  CREATE INDEX "lessons_updated_at_idx" ON "lessons" USING btree ("updated_at");
  CREATE INDEX "lessons_created_at_idx" ON "lessons" USING btree ("created_at");
  CREATE UNIQUE INDEX "course_slug_idx" ON "lessons" USING btree ("course_id","slug");
  CREATE INDEX "_lessons_v_version_quiz_options_order_idx" ON "_lessons_v_version_quiz_options" USING btree ("_order");
  CREATE INDEX "_lessons_v_version_quiz_options_parent_id_idx" ON "_lessons_v_version_quiz_options" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_version_quiz_order_idx" ON "_lessons_v_version_quiz" USING btree ("_order");
  CREATE INDEX "_lessons_v_version_quiz_parent_id_idx" ON "_lessons_v_version_quiz" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_parent_idx" ON "_lessons_v" USING btree ("parent_id");
  CREATE INDEX "_lessons_v_version_version_course_idx" ON "_lessons_v" USING btree ("version_course_id");
  CREATE INDEX "_lessons_v_version_version_order_idx" ON "_lessons_v" USING btree ("version_order");
  CREATE INDEX "_lessons_v_version_media_version_media_audio_idx" ON "_lessons_v" USING btree ("version_media_audio_id");
  CREATE INDEX "_lessons_v_version_version_slug_idx" ON "_lessons_v" USING btree ("version_slug");
  CREATE INDEX "_lessons_v_version_version_status_idx" ON "_lessons_v" USING btree ("version_status");
  CREATE INDEX "_lessons_v_version_version_updated_at_idx" ON "_lessons_v" USING btree ("version_updated_at");
  CREATE INDEX "_lessons_v_version_version_created_at_idx" ON "_lessons_v" USING btree ("version_created_at");
  CREATE INDEX "_lessons_v_created_at_idx" ON "_lessons_v" USING btree ("created_at");
  CREATE INDEX "_lessons_v_updated_at_idx" ON "_lessons_v" USING btree ("updated_at");
  CREATE INDEX "version_course_version_slug_idx" ON "_lessons_v" USING btree ("version_course_id","version_slug");
  CREATE INDEX "events_agenda_order_idx" ON "events_agenda" USING btree ("_order");
  CREATE INDEX "events_agenda_parent_id_idx" ON "events_agenda" USING btree ("_parent_id");
  CREATE INDEX "events_speaker_notes_order_idx" ON "events_speaker_notes" USING btree ("_order");
  CREATE INDEX "events_speaker_notes_parent_id_idx" ON "events_speaker_notes" USING btree ("_parent_id");
  CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");
  CREATE INDEX "events_mode_idx" ON "events" USING btree ("mode");
  CREATE INDEX "events_district_idx" ON "events" USING btree ("district");
  CREATE INDEX "events_category_idx" ON "events" USING btree ("category_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_circle_idx" ON "events" USING btree ("circle_id");
  CREATE INDEX "events_status_idx" ON "events" USING btree ("status");
  CREATE INDEX "events_meta_meta_image_idx" ON "events" USING btree ("meta_image_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "events_search_tsv_idx" ON "events" USING gin ("search_tsv");
  CREATE INDEX "events_title_trgm_idx" ON "events" USING gin ("title" gin_trgm_ops);
  CREATE INDEX "events_rels_order_idx" ON "events_rels" USING btree ("order");
  CREATE INDEX "events_rels_parent_idx" ON "events_rels" USING btree ("parent_id");
  CREATE INDEX "events_rels_path_idx" ON "events_rels" USING btree ("path");
  CREATE INDEX "events_rels_people_id_idx" ON "events_rels" USING btree ("people_id");
  CREATE INDEX "_events_v_version_agenda_order_idx" ON "_events_v_version_agenda" USING btree ("_order");
  CREATE INDEX "_events_v_version_agenda_parent_id_idx" ON "_events_v_version_agenda" USING btree ("_parent_id");
  CREATE INDEX "_events_v_version_speaker_notes_order_idx" ON "_events_v_version_speaker_notes" USING btree ("_order");
  CREATE INDEX "_events_v_version_speaker_notes_parent_id_idx" ON "_events_v_version_speaker_notes" USING btree ("_parent_id");
  CREATE INDEX "_events_v_parent_idx" ON "_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version_starts_at_idx" ON "_events_v" USING btree ("version_starts_at");
  CREATE INDEX "_events_v_version_version_mode_idx" ON "_events_v" USING btree ("version_mode");
  CREATE INDEX "_events_v_version_version_district_idx" ON "_events_v" USING btree ("version_district");
  CREATE INDEX "_events_v_version_version_category_idx" ON "_events_v" USING btree ("version_category_id");
  CREATE INDEX "_events_v_version_version_slug_idx" ON "_events_v" USING btree ("version_slug");
  CREATE INDEX "_events_v_version_version_circle_idx" ON "_events_v" USING btree ("version_circle_id");
  CREATE INDEX "_events_v_version_version_status_idx" ON "_events_v" USING btree ("version_status");
  CREATE INDEX "_events_v_version_meta_version_meta_image_idx" ON "_events_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_created_at_idx" ON "_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_rels_order_idx" ON "_events_v_rels" USING btree ("order");
  CREATE INDEX "_events_v_rels_parent_idx" ON "_events_v_rels" USING btree ("parent_id");
  CREATE INDEX "_events_v_rels_path_idx" ON "_events_v_rels" USING btree ("path");
  CREATE INDEX "_events_v_rels_people_id_idx" ON "_events_v_rels" USING btree ("people_id");
  CREATE INDEX "event_registrations_event_idx" ON "event_registrations" USING btree ("event_id");
  CREATE INDEX "event_registrations_user_idx" ON "event_registrations" USING btree ("user_id");
  CREATE UNIQUE INDEX "event_registrations_code_idx" ON "event_registrations" USING btree ("code");
  CREATE INDEX "event_registrations_phone_idx" ON "event_registrations" USING btree ("phone");
  CREATE INDEX "event_registrations_status_idx" ON "event_registrations" USING btree ("status");
  CREATE INDEX "event_registrations_updated_at_idx" ON "event_registrations" USING btree ("updated_at");
  CREATE INDEX "event_registrations_created_at_idx" ON "event_registrations" USING btree ("created_at");
  CREATE INDEX "event_phone_idx" ON "event_registrations" USING btree ("event_id","phone");
  CREATE INDEX "circles_format_order_idx" ON "circles_format" USING btree ("_order");
  CREATE INDEX "circles_format_parent_id_idx" ON "circles_format" USING btree ("_parent_id");
  CREATE INDEX "circles_rules_order_idx" ON "circles_rules" USING btree ("_order");
  CREATE INDEX "circles_rules_parent_id_idx" ON "circles_rules" USING btree ("_parent_id");
  CREATE INDEX "circles_team_order_idx" ON "circles_team" USING btree ("_order");
  CREATE INDEX "circles_team_parent_id_idx" ON "circles_team" USING btree ("_parent_id");
  CREATE INDEX "circles_team_user_idx" ON "circles_team" USING btree ("user_id");
  CREATE INDEX "circles_district_idx" ON "circles" USING btree ("district");
  CREATE INDEX "circles_type_idx" ON "circles" USING btree ("type");
  CREATE UNIQUE INDEX "circles_slug_idx" ON "circles" USING btree ("slug");
  CREATE INDEX "circles_coordinator_idx" ON "circles" USING btree ("coordinator_id");
  CREATE INDEX "circles_status_idx" ON "circles" USING btree ("status");
  CREATE INDEX "circles_meta_meta_image_idx" ON "circles" USING btree ("meta_image_id");
  CREATE INDEX "circles_updated_at_idx" ON "circles" USING btree ("updated_at");
  CREATE INDEX "circles_created_at_idx" ON "circles" USING btree ("created_at");
  CREATE INDEX "circle_meetups_circle_idx" ON "circle_meetups" USING btree ("circle_id");
  CREATE INDEX "circle_meetups_starts_at_idx" ON "circle_meetups" USING btree ("starts_at");
  CREATE INDEX "circle_meetups_updated_at_idx" ON "circle_meetups" USING btree ("updated_at");
  CREATE INDEX "circle_meetups_created_at_idx" ON "circle_meetups" USING btree ("created_at");
  CREATE INDEX "circle_memberships_circle_idx" ON "circle_memberships" USING btree ("circle_id");
  CREATE INDEX "circle_memberships_user_idx" ON "circle_memberships" USING btree ("user_id");
  CREATE INDEX "circle_memberships_status_idx" ON "circle_memberships" USING btree ("status");
  CREATE INDEX "circle_memberships_updated_at_idx" ON "circle_memberships" USING btree ("updated_at");
  CREATE INDEX "circle_memberships_created_at_idx" ON "circle_memberships" USING btree ("created_at");
  CREATE UNIQUE INDEX "circle_user_idx" ON "circle_memberships" USING btree ("circle_id","user_id");
  CREATE INDEX "meetup_rsvps_meetup_idx" ON "meetup_rsvps" USING btree ("meetup_id");
  CREATE INDEX "meetup_rsvps_user_idx" ON "meetup_rsvps" USING btree ("user_id");
  CREATE INDEX "meetup_rsvps_updated_at_idx" ON "meetup_rsvps" USING btree ("updated_at");
  CREATE INDEX "meetup_rsvps_created_at_idx" ON "meetup_rsvps" USING btree ("created_at");
  CREATE UNIQUE INDEX "meetup_user_idx" ON "meetup_rsvps" USING btree ("meetup_id","user_id");
  CREATE INDEX "videos_chapters_order_idx" ON "videos_chapters" USING btree ("_order");
  CREATE INDEX "videos_chapters_parent_id_idx" ON "videos_chapters" USING btree ("_parent_id");
  CREATE INDEX "videos_references_order_idx" ON "videos_references" USING btree ("_order");
  CREATE INDEX "videos_references_parent_id_idx" ON "videos_references" USING btree ("_parent_id");
  CREATE INDEX "videos_youtube_id_idx" ON "videos" USING btree ("youtube_id");
  CREATE INDEX "videos_speaker_idx" ON "videos" USING btree ("speaker_id");
  CREATE INDEX "videos_category_idx" ON "videos" USING btree ("category_id");
  CREATE INDEX "videos_playlist_idx" ON "videos" USING btree ("playlist_id");
  CREATE UNIQUE INDEX "videos_slug_idx" ON "videos" USING btree ("slug");
  CREATE INDEX "videos_level_idx" ON "videos" USING btree ("level");
  CREATE INDEX "videos_published_at_idx" ON "videos" USING btree ("published_at");
  CREATE INDEX "videos_status_idx" ON "videos" USING btree ("status");
  CREATE INDEX "videos_meta_meta_image_idx" ON "videos" USING btree ("meta_image_id");
  CREATE INDEX "videos_updated_at_idx" ON "videos" USING btree ("updated_at");
  CREATE INDEX "videos_created_at_idx" ON "videos" USING btree ("created_at");
  CREATE INDEX "videos_search_tsv_idx" ON "videos" USING gin ("search_tsv");
  CREATE INDEX "videos_title_trgm_idx" ON "videos" USING gin ("title" gin_trgm_ops);
  CREATE INDEX "videos_rels_order_idx" ON "videos_rels" USING btree ("order");
  CREATE INDEX "videos_rels_parent_idx" ON "videos_rels" USING btree ("parent_id");
  CREATE INDEX "videos_rels_path_idx" ON "videos_rels" USING btree ("path");
  CREATE INDEX "videos_rels_articles_id_idx" ON "videos_rels" USING btree ("articles_id");
  CREATE INDEX "_videos_v_version_chapters_order_idx" ON "_videos_v_version_chapters" USING btree ("_order");
  CREATE INDEX "_videos_v_version_chapters_parent_id_idx" ON "_videos_v_version_chapters" USING btree ("_parent_id");
  CREATE INDEX "_videos_v_version_references_order_idx" ON "_videos_v_version_references" USING btree ("_order");
  CREATE INDEX "_videos_v_version_references_parent_id_idx" ON "_videos_v_version_references" USING btree ("_parent_id");
  CREATE INDEX "_videos_v_parent_idx" ON "_videos_v" USING btree ("parent_id");
  CREATE INDEX "_videos_v_version_version_youtube_id_idx" ON "_videos_v" USING btree ("version_youtube_id");
  CREATE INDEX "_videos_v_version_version_speaker_idx" ON "_videos_v" USING btree ("version_speaker_id");
  CREATE INDEX "_videos_v_version_version_category_idx" ON "_videos_v" USING btree ("version_category_id");
  CREATE INDEX "_videos_v_version_version_playlist_idx" ON "_videos_v" USING btree ("version_playlist_id");
  CREATE INDEX "_videos_v_version_version_slug_idx" ON "_videos_v" USING btree ("version_slug");
  CREATE INDEX "_videos_v_version_version_level_idx" ON "_videos_v" USING btree ("version_level");
  CREATE INDEX "_videos_v_version_version_published_at_idx" ON "_videos_v" USING btree ("version_published_at");
  CREATE INDEX "_videos_v_version_version_status_idx" ON "_videos_v" USING btree ("version_status");
  CREATE INDEX "_videos_v_version_meta_version_meta_image_idx" ON "_videos_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_videos_v_version_version_updated_at_idx" ON "_videos_v" USING btree ("version_updated_at");
  CREATE INDEX "_videos_v_version_version_created_at_idx" ON "_videos_v" USING btree ("version_created_at");
  CREATE INDEX "_videos_v_created_at_idx" ON "_videos_v" USING btree ("created_at");
  CREATE INDEX "_videos_v_updated_at_idx" ON "_videos_v" USING btree ("updated_at");
  CREATE INDEX "_videos_v_rels_order_idx" ON "_videos_v_rels" USING btree ("order");
  CREATE INDEX "_videos_v_rels_parent_idx" ON "_videos_v_rels" USING btree ("parent_id");
  CREATE INDEX "_videos_v_rels_path_idx" ON "_videos_v_rels" USING btree ("path");
  CREATE INDEX "_videos_v_rels_articles_id_idx" ON "_videos_v_rels" USING btree ("articles_id");
  CREATE UNIQUE INDEX "playlists_slug_idx" ON "playlists" USING btree ("slug");
  CREATE INDEX "playlists_level_idx" ON "playlists" USING btree ("level");
  CREATE INDEX "playlists_updated_at_idx" ON "playlists" USING btree ("updated_at");
  CREATE INDEX "playlists_created_at_idx" ON "playlists" USING btree ("created_at");
  CREATE UNIQUE INDEX "surahs_number_idx" ON "surahs" USING btree ("number");
  CREATE INDEX "surahs_name_latin_idx" ON "surahs" USING btree ("name_latin");
  CREATE INDEX "surahs_updated_at_idx" ON "surahs" USING btree ("updated_at");
  CREATE INDEX "surahs_created_at_idx" ON "surahs" USING btree ("created_at");
  CREATE INDEX "ayahs_surah_idx" ON "ayahs" USING btree ("surah");
  CREATE INDEX "ayahs_juz_idx" ON "ayahs" USING btree ("juz");
  CREATE UNIQUE INDEX "ayahs_key_idx" ON "ayahs" USING btree ("key");
  CREATE INDEX "ayahs_sort_key_idx" ON "ayahs" USING btree ("sort_key");
  CREATE INDEX "ayahs_updated_at_idx" ON "ayahs" USING btree ("updated_at");
  CREATE INDEX "ayahs_created_at_idx" ON "ayahs" USING btree ("created_at");
  CREATE INDEX "ayahs_search_tsv_idx" ON "ayahs" USING gin ("search_tsv");
  CREATE INDEX "ayahs_translation_trgm_idx" ON "ayahs" USING gin ("translation" gin_trgm_ops);
  CREATE UNIQUE INDEX "hadith_collections_slug_idx" ON "hadith_collections" USING btree ("slug");
  CREATE INDEX "hadith_collections_updated_at_idx" ON "hadith_collections" USING btree ("updated_at");
  CREATE INDEX "hadith_collections_created_at_idx" ON "hadith_collections" USING btree ("created_at");
  CREATE INDEX "hadiths_book_idx" ON "hadiths" USING btree ("book_id");
  CREATE INDEX "hadiths_number_idx" ON "hadiths" USING btree ("number");
  CREATE UNIQUE INDEX "hadiths_key_idx" ON "hadiths" USING btree ("key");
  CREATE INDEX "hadiths_grade_idx" ON "hadiths" USING btree ("grade");
  CREATE INDEX "hadiths_updated_at_idx" ON "hadiths" USING btree ("updated_at");
  CREATE INDEX "hadiths_created_at_idx" ON "hadiths" USING btree ("created_at");
  CREATE INDEX "book_number_idx" ON "hadiths" USING btree ("book_id","number");
  CREATE INDEX "hadiths_search_tsv_idx" ON "hadiths" USING gin ("search_tsv");
  CREATE INDEX "daily_reminders_kind_idx" ON "daily_reminders" USING btree ("kind");
  CREATE INDEX "daily_reminders_ayah_idx" ON "daily_reminders" USING btree ("ayah_id");
  CREATE INDEX "daily_reminders_ayah_to_idx" ON "daily_reminders" USING btree ("ayah_to_id");
  CREATE INDEX "daily_reminders_hadith_idx" ON "daily_reminders" USING btree ("hadith_id");
  CREATE INDEX "daily_reminders_date_idx" ON "daily_reminders" USING btree ("date");
  CREATE INDEX "daily_reminders_active_idx" ON "daily_reminders" USING btree ("active");
  CREATE INDEX "daily_reminders_updated_at_idx" ON "daily_reminders" USING btree ("updated_at");
  CREATE INDEX "daily_reminders_created_at_idx" ON "daily_reminders" USING btree ("created_at");
  CREATE UNIQUE INDEX "forum_categories_slug_idx" ON "forum_categories" USING btree ("slug");
  CREATE INDEX "forum_categories_updated_at_idx" ON "forum_categories" USING btree ("updated_at");
  CREATE INDEX "forum_categories_created_at_idx" ON "forum_categories" USING btree ("created_at");
  CREATE INDEX "forum_threads_slug_idx" ON "forum_threads" USING btree ("slug");
  CREATE INDEX "forum_threads_category_idx" ON "forum_threads" USING btree ("category_id");
  CREATE INDEX "forum_threads_author_idx" ON "forum_threads" USING btree ("author_id");
  CREATE INDEX "forum_threads_status_idx" ON "forum_threads" USING btree ("status");
  CREATE INDEX "forum_threads_pinned_idx" ON "forum_threads" USING btree ("pinned");
  CREATE INDEX "forum_threads_helpful_post_idx" ON "forum_threads" USING btree ("helpful_post_id");
  CREATE INDEX "forum_threads_mod_note_mod_note_by_idx" ON "forum_threads" USING btree ("mod_note_by_id");
  CREATE INDEX "forum_threads_reply_count_idx" ON "forum_threads" USING btree ("reply_count");
  CREATE INDEX "forum_threads_report_count_idx" ON "forum_threads" USING btree ("report_count");
  CREATE INDEX "forum_threads_last_activity_at_idx" ON "forum_threads" USING btree ("last_activity_at");
  CREATE INDEX "forum_threads_last_reply_by_idx" ON "forum_threads" USING btree ("last_reply_by_id");
  CREATE INDEX "forum_threads_deleted_at_idx" ON "forum_threads" USING btree ("deleted_at");
  CREATE INDEX "forum_threads_deleted_by_idx" ON "forum_threads" USING btree ("deleted_by_id");
  CREATE INDEX "forum_threads_updated_at_idx" ON "forum_threads" USING btree ("updated_at");
  CREATE INDEX "forum_threads_created_at_idx" ON "forum_threads" USING btree ("created_at");
  CREATE INDEX "forum_threads_texts_order_parent" ON "forum_threads_texts" USING btree ("order","parent_id");
  CREATE INDEX "forum_posts_thread_idx" ON "forum_posts" USING btree ("thread_id");
  CREATE INDEX "forum_posts_parent_idx" ON "forum_posts" USING btree ("parent_id");
  CREATE INDEX "forum_posts_author_idx" ON "forum_posts" USING btree ("author_id");
  CREATE INDEX "forum_posts_status_idx" ON "forum_posts" USING btree ("status");
  CREATE INDEX "forum_posts_report_count_idx" ON "forum_posts" USING btree ("report_count");
  CREATE INDEX "forum_posts_deleted_at_idx" ON "forum_posts" USING btree ("deleted_at");
  CREATE INDEX "forum_posts_deleted_by_idx" ON "forum_posts" USING btree ("deleted_by_id");
  CREATE INDEX "forum_posts_updated_at_idx" ON "forum_posts" USING btree ("updated_at");
  CREATE INDEX "forum_posts_created_at_idx" ON "forum_posts" USING btree ("created_at");
  CREATE INDEX "forum_posts_texts_order_parent" ON "forum_posts_texts" USING btree ("order","parent_id");
  CREATE INDEX "forum_reactions_post_idx" ON "forum_reactions" USING btree ("post_id");
  CREATE INDEX "forum_reactions_thread_idx" ON "forum_reactions" USING btree ("thread_id");
  CREATE INDEX "forum_reactions_user_idx" ON "forum_reactions" USING btree ("user_id");
  CREATE INDEX "forum_reactions_updated_at_idx" ON "forum_reactions" USING btree ("updated_at");
  CREATE INDEX "forum_reactions_created_at_idx" ON "forum_reactions" USING btree ("created_at");
  CREATE UNIQUE INDEX "post_user_idx" ON "forum_reactions" USING btree ("post_id","user_id");
  CREATE INDEX "reports_target_type_idx" ON "reports" USING btree ("target_type");
  CREATE INDEX "reports_thread_idx" ON "reports" USING btree ("thread_id");
  CREATE INDEX "reports_post_idx" ON "reports" USING btree ("post_id");
  CREATE INDEX "reports_reporter_idx" ON "reports" USING btree ("reporter_id");
  CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");
  CREATE INDEX "reports_resolved_by_idx" ON "reports" USING btree ("resolved_by_id");
  CREATE INDEX "reports_updated_at_idx" ON "reports" USING btree ("updated_at");
  CREATE INDEX "reports_created_at_idx" ON "reports" USING btree ("created_at");
  CREATE INDEX "enrollments_user_idx" ON "enrollments" USING btree ("user_id");
  CREATE INDEX "enrollments_course_idx" ON "enrollments" USING btree ("course_id");
  CREATE INDEX "enrollments_last_lesson_idx" ON "enrollments" USING btree ("last_lesson_id");
  CREATE INDEX "enrollments_last_activity_at_idx" ON "enrollments" USING btree ("last_activity_at");
  CREATE INDEX "enrollments_completed_at_idx" ON "enrollments" USING btree ("completed_at");
  CREATE INDEX "enrollments_updated_at_idx" ON "enrollments" USING btree ("updated_at");
  CREATE INDEX "enrollments_created_at_idx" ON "enrollments" USING btree ("created_at");
  CREATE UNIQUE INDEX "user_course_idx" ON "enrollments" USING btree ("user_id","course_id");
  CREATE INDEX "lesson_progress_user_idx" ON "lesson_progress" USING btree ("user_id");
  CREATE INDEX "lesson_progress_lesson_idx" ON "lesson_progress" USING btree ("lesson_id");
  CREATE INDEX "lesson_progress_course_idx" ON "lesson_progress" USING btree ("course_id");
  CREATE INDEX "lesson_progress_updated_at_idx" ON "lesson_progress" USING btree ("updated_at");
  CREATE INDEX "lesson_progress_created_at_idx" ON "lesson_progress" USING btree ("created_at");
  CREATE UNIQUE INDEX "user_lesson_idx" ON "lesson_progress" USING btree ("user_id","lesson_id");
  CREATE INDEX "bookmarks_user_idx" ON "bookmarks" USING btree ("user_id");
  CREATE INDEX "bookmarks_target_key_idx" ON "bookmarks" USING btree ("target_key");
  CREATE INDEX "bookmarks_updated_at_idx" ON "bookmarks" USING btree ("updated_at");
  CREATE INDEX "bookmarks_created_at_idx" ON "bookmarks" USING btree ("created_at");
  CREATE UNIQUE INDEX "user_targetKey_idx" ON "bookmarks" USING btree ("user_id","target_key");
  CREATE INDEX "bookmarks_rels_order_idx" ON "bookmarks_rels" USING btree ("order");
  CREATE INDEX "bookmarks_rels_parent_idx" ON "bookmarks_rels" USING btree ("parent_id");
  CREATE INDEX "bookmarks_rels_path_idx" ON "bookmarks_rels" USING btree ("path");
  CREATE INDEX "bookmarks_rels_articles_id_idx" ON "bookmarks_rels" USING btree ("articles_id");
  CREATE INDEX "bookmarks_rels_ikhtilaf_topics_id_idx" ON "bookmarks_rels" USING btree ("ikhtilaf_topics_id");
  CREATE INDEX "bookmarks_rels_videos_id_idx" ON "bookmarks_rels" USING btree ("videos_id");
  CREATE INDEX "bookmarks_rels_questions_id_idx" ON "bookmarks_rels" USING btree ("questions_id");
  CREATE INDEX "bookmarks_rels_ayahs_id_idx" ON "bookmarks_rels" USING btree ("ayahs_id");
  CREATE INDEX "bookmarks_rels_hadiths_id_idx" ON "bookmarks_rels" USING btree ("hadiths_id");
  CREATE INDEX "notifications_recipient_idx" ON "notifications" USING btree ("recipient_id");
  CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read");
  CREATE INDEX "notifications_updated_at_idx" ON "notifications" USING btree ("updated_at");
  CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");
  CREATE INDEX "recipient_read_idx" ON "notifications" USING btree ("recipient_id","read");
  CREATE INDEX "answer_votes_question_idx" ON "answer_votes" USING btree ("question_id");
  CREATE INDEX "answer_votes_voter_key_idx" ON "answer_votes" USING btree ("voter_key");
  CREATE INDEX "answer_votes_updated_at_idx" ON "answer_votes" USING btree ("updated_at");
  CREATE INDEX "answer_votes_created_at_idx" ON "answer_votes" USING btree ("created_at");
  CREATE UNIQUE INDEX "question_voterKey_idx" ON "answer_votes" USING btree ("question_id","voter_key");
  CREATE UNIQUE INDEX "newsletter_subscribers_email_idx" ON "newsletter_subscribers" USING btree ("email");
  CREATE INDEX "newsletter_subscribers_status_idx" ON "newsletter_subscribers" USING btree ("status");
  CREATE INDEX "newsletter_subscribers_user_idx" ON "newsletter_subscribers" USING btree ("user_id");
  CREATE INDEX "newsletter_subscribers_unsubscribe_token_idx" ON "newsletter_subscribers" USING btree ("unsubscribe_token");
  CREATE INDEX "newsletter_subscribers_updated_at_idx" ON "newsletter_subscribers" USING btree ("updated_at");
  CREATE INDEX "newsletter_subscribers_created_at_idx" ON "newsletter_subscribers" USING btree ("created_at");
  CREATE INDEX "volunteers_interests_order_idx" ON "volunteers_interests" USING btree ("order");
  CREATE INDEX "volunteers_interests_parent_idx" ON "volunteers_interests" USING btree ("parent_id");
  CREATE INDEX "volunteers_district_idx" ON "volunteers" USING btree ("district");
  CREATE INDEX "volunteers_user_idx" ON "volunteers" USING btree ("user_id");
  CREATE INDEX "volunteers_status_idx" ON "volunteers" USING btree ("status");
  CREATE INDEX "volunteers_updated_at_idx" ON "volunteers" USING btree ("updated_at");
  CREATE INDEX "volunteers_created_at_idx" ON "volunteers" USING btree ("created_at");
  CREATE INDEX "contact_messages_user_idx" ON "contact_messages" USING btree ("user_id");
  CREATE INDEX "contact_messages_status_idx" ON "contact_messages" USING btree ("status");
  CREATE INDEX "contact_messages_updated_at_idx" ON "contact_messages" USING btree ("updated_at");
  CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages" USING btree ("created_at");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_status_idx" ON "pages" USING btree ("status");
  CREATE INDEX "pages_meta_meta_image_idx" ON "pages" USING btree ("meta_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_status_idx" ON "_pages_v" USING btree ("version_status");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");
  CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");
  CREATE INDEX "audit_logs_target_collection_idx" ON "audit_logs" USING btree ("target_collection");
  CREATE INDEX "audit_logs_target_id_idx" ON "audit_logs" USING btree ("target_id");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  CREATE UNIQUE INDEX "rate_limits_key_idx" ON "rate_limits" USING btree ("key");
  CREATE INDEX "rate_limits_reset_at_idx" ON "rate_limits" USING btree ("reset_at");
  CREATE INDEX "rate_limits_updated_at_idx" ON "rate_limits" USING btree ("updated_at");
  CREATE INDEX "rate_limits_created_at_idx" ON "rate_limits" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("sessions_id");
  CREATE INDEX "payload_locked_documents_rels_accounts_id_idx" ON "payload_locked_documents_rels" USING btree ("accounts_id");
  CREATE INDEX "payload_locked_documents_rels_verifications_id_idx" ON "payload_locked_documents_rels" USING btree ("verifications_id");
  CREATE INDEX "payload_locked_documents_rels_rate_limit_id_idx" ON "payload_locked_documents_rels" USING btree ("rate_limit_id");
  CREATE INDEX "payload_locked_documents_rels_admin_invitations_id_idx" ON "payload_locked_documents_rels" USING btree ("admin_invitations_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_ikhtilaf_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("ikhtilaf_topics_id");
  CREATE INDEX "payload_locked_documents_rels_questions_id_idx" ON "payload_locked_documents_rels" USING btree ("questions_id");
  CREATE INDEX "payload_locked_documents_rels_series_id_idx" ON "payload_locked_documents_rels" USING btree ("series_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_people_id_idx" ON "payload_locked_documents_rels" USING btree ("people_id");
  CREATE INDEX "payload_locked_documents_rels_courses_id_idx" ON "payload_locked_documents_rels" USING btree ("courses_id");
  CREATE INDEX "payload_locked_documents_rels_lessons_id_idx" ON "payload_locked_documents_rels" USING btree ("lessons_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_event_registrations_id_idx" ON "payload_locked_documents_rels" USING btree ("event_registrations_id");
  CREATE INDEX "payload_locked_documents_rels_circles_id_idx" ON "payload_locked_documents_rels" USING btree ("circles_id");
  CREATE INDEX "payload_locked_documents_rels_circle_meetups_id_idx" ON "payload_locked_documents_rels" USING btree ("circle_meetups_id");
  CREATE INDEX "payload_locked_documents_rels_circle_memberships_id_idx" ON "payload_locked_documents_rels" USING btree ("circle_memberships_id");
  CREATE INDEX "payload_locked_documents_rels_meetup_rsvps_id_idx" ON "payload_locked_documents_rels" USING btree ("meetup_rsvps_id");
  CREATE INDEX "payload_locked_documents_rels_videos_id_idx" ON "payload_locked_documents_rels" USING btree ("videos_id");
  CREATE INDEX "payload_locked_documents_rels_playlists_id_idx" ON "payload_locked_documents_rels" USING btree ("playlists_id");
  CREATE INDEX "payload_locked_documents_rels_surahs_id_idx" ON "payload_locked_documents_rels" USING btree ("surahs_id");
  CREATE INDEX "payload_locked_documents_rels_ayahs_id_idx" ON "payload_locked_documents_rels" USING btree ("ayahs_id");
  CREATE INDEX "payload_locked_documents_rels_hadith_collections_id_idx" ON "payload_locked_documents_rels" USING btree ("hadith_collections_id");
  CREATE INDEX "payload_locked_documents_rels_hadiths_id_idx" ON "payload_locked_documents_rels" USING btree ("hadiths_id");
  CREATE INDEX "payload_locked_documents_rels_daily_reminders_id_idx" ON "payload_locked_documents_rels" USING btree ("daily_reminders_id");
  CREATE INDEX "payload_locked_documents_rels_forum_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("forum_categories_id");
  CREATE INDEX "payload_locked_documents_rels_forum_threads_id_idx" ON "payload_locked_documents_rels" USING btree ("forum_threads_id");
  CREATE INDEX "payload_locked_documents_rels_forum_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("forum_posts_id");
  CREATE INDEX "payload_locked_documents_rels_forum_reactions_id_idx" ON "payload_locked_documents_rels" USING btree ("forum_reactions_id");
  CREATE INDEX "payload_locked_documents_rels_reports_id_idx" ON "payload_locked_documents_rels" USING btree ("reports_id");
  CREATE INDEX "payload_locked_documents_rels_enrollments_id_idx" ON "payload_locked_documents_rels" USING btree ("enrollments_id");
  CREATE INDEX "payload_locked_documents_rels_lesson_progress_id_idx" ON "payload_locked_documents_rels" USING btree ("lesson_progress_id");
  CREATE INDEX "payload_locked_documents_rels_bookmarks_id_idx" ON "payload_locked_documents_rels" USING btree ("bookmarks_id");
  CREATE INDEX "payload_locked_documents_rels_notifications_id_idx" ON "payload_locked_documents_rels" USING btree ("notifications_id");
  CREATE INDEX "payload_locked_documents_rels_answer_votes_id_idx" ON "payload_locked_documents_rels" USING btree ("answer_votes_id");
  CREATE INDEX "payload_locked_documents_rels_newsletter_subscribers_id_idx" ON "payload_locked_documents_rels" USING btree ("newsletter_subscribers_id");
  CREATE INDEX "payload_locked_documents_rels_volunteers_id_idx" ON "payload_locked_documents_rels" USING btree ("volunteers_id");
  CREATE INDEX "payload_locked_documents_rels_contact_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_messages_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");
  CREATE INDEX "payload_locked_documents_rels_rate_limits_id_idx" ON "payload_locked_documents_rels" USING btree ("rate_limits_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_og_image_idx" ON "site_settings" USING btree ("og_image_id");
  CREATE INDEX "home_page_pledges_order_idx" ON "home_page_pledges" USING btree ("_order");
  CREATE INDEX "home_page_pledges_parent_id_idx" ON "home_page_pledges" USING btree ("_parent_id");
  CREATE INDEX "home_page_journey_steps_order_idx" ON "home_page_journey_steps" USING btree ("_order");
  CREATE INDEX "home_page_journey_steps_parent_id_idx" ON "home_page_journey_steps" USING btree ("_parent_id");
  CREATE INDEX "home_page_values_order_idx" ON "home_page_values" USING btree ("_order");
  CREATE INDEX "home_page_values_parent_id_idx" ON "home_page_values" USING btree ("_parent_id");
  CREATE INDEX "home_page_ikhtilaf_points_order_idx" ON "home_page_ikhtilaf_points" USING btree ("_order");
  CREATE INDEX "home_page_ikhtilaf_points_parent_id_idx" ON "home_page_ikhtilaf_points" USING btree ("_parent_id");
  CREATE INDEX "home_page_featured_ikhtilaf_idx" ON "home_page" USING btree ("featured_ikhtilaf_id");
  CREATE INDEX "_home_page_v_version_pledges_order_idx" ON "_home_page_v_version_pledges" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_pledges_parent_id_idx" ON "_home_page_v_version_pledges" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_journey_steps_order_idx" ON "_home_page_v_version_journey_steps" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_journey_steps_parent_id_idx" ON "_home_page_v_version_journey_steps" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_values_order_idx" ON "_home_page_v_version_values" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_values_parent_id_idx" ON "_home_page_v_version_values" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_ikhtilaf_points_order_idx" ON "_home_page_v_version_ikhtilaf_points" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_ikhtilaf_points_parent_id_idx" ON "_home_page_v_version_ikhtilaf_points" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_version_featured_ikhtilaf_idx" ON "_home_page_v" USING btree ("version_featured_ikhtilaf_id");
  CREATE INDEX "_home_page_v_created_at_idx" ON "_home_page_v" USING btree ("created_at");
  CREATE INDEX "_home_page_v_updated_at_idx" ON "_home_page_v" USING btree ("updated_at");
  CREATE INDEX "about_page_adab_rules_order_idx" ON "about_page_adab_rules" USING btree ("_order");
  CREATE INDEX "about_page_adab_rules_parent_id_idx" ON "about_page_adab_rules" USING btree ("_parent_id");
  CREATE INDEX "_about_page_v_version_adab_rules_order_idx" ON "_about_page_v_version_adab_rules" USING btree ("_order");
  CREATE INDEX "_about_page_v_version_adab_rules_parent_id_idx" ON "_about_page_v_version_adab_rules" USING btree ("_parent_id");
  CREATE INDEX "_about_page_v_created_at_idx" ON "_about_page_v" USING btree ("created_at");
  CREATE INDEX "_about_page_v_updated_at_idx" ON "_about_page_v" USING btree ("updated_at");
  CREATE INDEX "adab_policy_enforcement_order_idx" ON "adab_policy_enforcement" USING btree ("_order");
  CREATE INDEX "adab_policy_enforcement_parent_id_idx" ON "adab_policy_enforcement" USING btree ("_parent_id");
  CREATE INDEX "_adab_policy_v_version_enforcement_order_idx" ON "_adab_policy_v_version_enforcement" USING btree ("_order");
  CREATE INDEX "_adab_policy_v_version_enforcement_parent_id_idx" ON "_adab_policy_v_version_enforcement" USING btree ("_parent_id");
  CREATE INDEX "_adab_policy_v_created_at_idx" ON "_adab_policy_v" USING btree ("created_at");
  CREATE INDEX "_adab_policy_v_updated_at_idx" ON "_adab_policy_v" USING btree ("updated_at");
  CREATE INDEX "moderation_settings_texts_order_parent" ON "moderation_settings_texts" USING btree ("order","parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_role" CASCADE;
  DROP TABLE "users_interests" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "_users_v_version_role" CASCADE;
  DROP TABLE "_users_v_version_interests" CASCADE;
  DROP TABLE "_users_v" CASCADE;
  DROP TABLE "sessions" CASCADE;
  DROP TABLE "accounts" CASCADE;
  DROP TABLE "verifications" CASCADE;
  DROP TABLE "rate_limit" CASCADE;
  DROP TABLE "admin_invitations" CASCADE;
  DROP TABLE "articles_references" CASCADE;
  DROP TABLE "articles_approvals" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "articles_rels" CASCADE;
  DROP TABLE "_articles_v_version_references" CASCADE;
  DROP TABLE "_articles_v_version_approvals" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "_articles_v_rels" CASCADE;
  DROP TABLE "ikhtilaf_topics_consensus" CASCADE;
  DROP TABLE "ikhtilaf_topics_opinions" CASCADE;
  DROP TABLE "ikhtilaf_topics_conduct" CASCADE;
  DROP TABLE "ikhtilaf_topics_references" CASCADE;
  DROP TABLE "ikhtilaf_topics_approvals" CASCADE;
  DROP TABLE "ikhtilaf_topics" CASCADE;
  DROP TABLE "ikhtilaf_topics_texts" CASCADE;
  DROP TABLE "ikhtilaf_topics_rels" CASCADE;
  DROP TABLE "_ikhtilaf_topics_v_version_consensus" CASCADE;
  DROP TABLE "_ikhtilaf_topics_v_version_opinions" CASCADE;
  DROP TABLE "_ikhtilaf_topics_v_version_conduct" CASCADE;
  DROP TABLE "_ikhtilaf_topics_v_version_references" CASCADE;
  DROP TABLE "_ikhtilaf_topics_v_version_approvals" CASCADE;
  DROP TABLE "_ikhtilaf_topics_v" CASCADE;
  DROP TABLE "_ikhtilaf_topics_v_texts" CASCADE;
  DROP TABLE "_ikhtilaf_topics_v_rels" CASCADE;
  DROP TABLE "questions_references" CASCADE;
  DROP TABLE "questions_approvals" CASCADE;
  DROP TABLE "questions" CASCADE;
  DROP TABLE "questions_rels" CASCADE;
  DROP TABLE "_questions_v_version_references" CASCADE;
  DROP TABLE "_questions_v_version_approvals" CASCADE;
  DROP TABLE "_questions_v" CASCADE;
  DROP TABLE "_questions_v_rels" CASCADE;
  DROP TABLE "series" CASCADE;
  DROP TABLE "categories_used_for" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "people_kinds" CASCADE;
  DROP TABLE "people_education" CASCADE;
  DROP TABLE "people_role_notes" CASCADE;
  DROP TABLE "people" CASCADE;
  DROP TABLE "people_texts" CASCADE;
  DROP TABLE "courses_modules" CASCADE;
  DROP TABLE "courses" CASCADE;
  DROP TABLE "courses_rels" CASCADE;
  DROP TABLE "_courses_v_version_modules" CASCADE;
  DROP TABLE "_courses_v" CASCADE;
  DROP TABLE "_courses_v_rels" CASCADE;
  DROP TABLE "lessons_quiz_options" CASCADE;
  DROP TABLE "lessons_quiz" CASCADE;
  DROP TABLE "lessons" CASCADE;
  DROP TABLE "_lessons_v_version_quiz_options" CASCADE;
  DROP TABLE "_lessons_v_version_quiz" CASCADE;
  DROP TABLE "_lessons_v" CASCADE;
  DROP TABLE "events_agenda" CASCADE;
  DROP TABLE "events_speaker_notes" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "events_rels" CASCADE;
  DROP TABLE "_events_v_version_agenda" CASCADE;
  DROP TABLE "_events_v_version_speaker_notes" CASCADE;
  DROP TABLE "_events_v" CASCADE;
  DROP TABLE "_events_v_rels" CASCADE;
  DROP TABLE "event_registrations" CASCADE;
  DROP TABLE "circles_format" CASCADE;
  DROP TABLE "circles_rules" CASCADE;
  DROP TABLE "circles_team" CASCADE;
  DROP TABLE "circles" CASCADE;
  DROP TABLE "circle_meetups" CASCADE;
  DROP TABLE "circle_memberships" CASCADE;
  DROP TABLE "meetup_rsvps" CASCADE;
  DROP TABLE "videos_chapters" CASCADE;
  DROP TABLE "videos_references" CASCADE;
  DROP TABLE "videos" CASCADE;
  DROP TABLE "videos_rels" CASCADE;
  DROP TABLE "_videos_v_version_chapters" CASCADE;
  DROP TABLE "_videos_v_version_references" CASCADE;
  DROP TABLE "_videos_v" CASCADE;
  DROP TABLE "_videos_v_rels" CASCADE;
  DROP TABLE "playlists" CASCADE;
  DROP TABLE "surahs" CASCADE;
  DROP TABLE "ayahs" CASCADE;
  DROP TABLE "hadith_collections" CASCADE;
  DROP TABLE "hadiths" CASCADE;
  DROP TABLE "daily_reminders" CASCADE;
  DROP TABLE "forum_categories" CASCADE;
  DROP TABLE "forum_threads" CASCADE;
  DROP TABLE "forum_threads_texts" CASCADE;
  DROP TABLE "forum_posts" CASCADE;
  DROP TABLE "forum_posts_texts" CASCADE;
  DROP TABLE "forum_reactions" CASCADE;
  DROP TABLE "reports" CASCADE;
  DROP TABLE "enrollments" CASCADE;
  DROP TABLE "lesson_progress" CASCADE;
  DROP TABLE "bookmarks" CASCADE;
  DROP TABLE "bookmarks_rels" CASCADE;
  DROP TABLE "notifications" CASCADE;
  DROP TABLE "answer_votes" CASCADE;
  DROP TABLE "newsletter_subscribers" CASCADE;
  DROP TABLE "volunteers_interests" CASCADE;
  DROP TABLE "volunteers" CASCADE;
  DROP TABLE "contact_messages" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  DROP TABLE "rate_limits" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "home_page_pledges" CASCADE;
  DROP TABLE "home_page_journey_steps" CASCADE;
  DROP TABLE "home_page_values" CASCADE;
  DROP TABLE "home_page_ikhtilaf_points" CASCADE;
  DROP TABLE "home_page" CASCADE;
  DROP TABLE "_home_page_v_version_pledges" CASCADE;
  DROP TABLE "_home_page_v_version_journey_steps" CASCADE;
  DROP TABLE "_home_page_v_version_values" CASCADE;
  DROP TABLE "_home_page_v_version_ikhtilaf_points" CASCADE;
  DROP TABLE "_home_page_v" CASCADE;
  DROP TABLE "about_page_adab_rules" CASCADE;
  DROP TABLE "about_page" CASCADE;
  DROP TABLE "_about_page_v_version_adab_rules" CASCADE;
  DROP TABLE "_about_page_v" CASCADE;
  DROP TABLE "adab_policy_enforcement" CASCADE;
  DROP TABLE "adab_policy" CASCADE;
  DROP TABLE "_adab_policy_v_version_enforcement" CASCADE;
  DROP TABLE "_adab_policy_v" CASCADE;
  DROP TABLE "moderation_settings" CASCADE;
  DROP TABLE "moderation_settings_texts" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_interests";
  DROP TYPE "public"."enum_users_journey_stage";
  DROP TYPE "public"."enum_users_avatar_color";
  DROP TYPE "public"."enum_users_district";
  DROP TYPE "public"."enum__users_v_version_role";
  DROP TYPE "public"."enum__users_v_version_interests";
  DROP TYPE "public"."enum__users_v_version_journey_stage";
  DROP TYPE "public"."enum__users_v_version_avatar_color";
  DROP TYPE "public"."enum__users_v_version_district";
  DROP TYPE "public"."enum_admin_invitations_role";
  DROP TYPE "public"."enum_articles_references_type";
  DROP TYPE "public"."enum_articles_approvals_decision";
  DROP TYPE "public"."enum_articles_level";
  DROP TYPE "public"."enum_articles_tint";
  DROP TYPE "public"."enum_articles_review_status";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum__articles_v_version_references_type";
  DROP TYPE "public"."enum__articles_v_version_approvals_decision";
  DROP TYPE "public"."enum__articles_v_version_level";
  DROP TYPE "public"."enum__articles_v_version_tint";
  DROP TYPE "public"."enum__articles_v_version_review_status";
  DROP TYPE "public"."enum__articles_v_version_status";
  DROP TYPE "public"."enum_ikhtilaf_topics_opinions_evidence_kind";
  DROP TYPE "public"."enum_ikhtilaf_topics_opinions_evidence_grade";
  DROP TYPE "public"."enum_ikhtilaf_topics_references_type";
  DROP TYPE "public"."enum_ikhtilaf_topics_approvals_decision";
  DROP TYPE "public"."enum_ikhtilaf_topics_level";
  DROP TYPE "public"."enum_ikhtilaf_topics_review_status";
  DROP TYPE "public"."enum_ikhtilaf_topics_status";
  DROP TYPE "public"."enum__ikhtilaf_topics_v_version_opinions_evidence_kind";
  DROP TYPE "public"."enum__ikhtilaf_topics_v_version_opinions_evidence_grade";
  DROP TYPE "public"."enum__ikhtilaf_topics_v_version_references_type";
  DROP TYPE "public"."enum__ikhtilaf_topics_v_version_approvals_decision";
  DROP TYPE "public"."enum__ikhtilaf_topics_v_version_level";
  DROP TYPE "public"."enum__ikhtilaf_topics_v_version_review_status";
  DROP TYPE "public"."enum__ikhtilaf_topics_v_version_status";
  DROP TYPE "public"."enum_questions_references_type";
  DROP TYPE "public"."enum_questions_approvals_decision";
  DROP TYPE "public"."enum_questions_asker_district";
  DROP TYPE "public"."enum_questions_moderation";
  DROP TYPE "public"."enum_questions_review_status";
  DROP TYPE "public"."enum_questions_status";
  DROP TYPE "public"."enum__questions_v_version_references_type";
  DROP TYPE "public"."enum__questions_v_version_approvals_decision";
  DROP TYPE "public"."enum__questions_v_version_asker_district";
  DROP TYPE "public"."enum__questions_v_version_moderation";
  DROP TYPE "public"."enum__questions_v_version_review_status";
  DROP TYPE "public"."enum__questions_v_version_status";
  DROP TYPE "public"."enum_categories_used_for";
  DROP TYPE "public"."enum_categories_icon";
  DROP TYPE "public"."enum_people_kinds";
  DROP TYPE "public"."enum_people_role_notes_role";
  DROP TYPE "public"."enum_people_avatar_tone";
  DROP TYPE "public"."enum_courses_journey_stage";
  DROP TYPE "public"."enum_courses_level";
  DROP TYPE "public"."enum_courses_tint";
  DROP TYPE "public"."enum_courses_status";
  DROP TYPE "public"."enum__courses_v_version_journey_stage";
  DROP TYPE "public"."enum__courses_v_version_level";
  DROP TYPE "public"."enum__courses_v_version_tint";
  DROP TYPE "public"."enum__courses_v_version_status";
  DROP TYPE "public"."enum_lessons_media_kind";
  DROP TYPE "public"."enum_lessons_status";
  DROP TYPE "public"."enum__lessons_v_version_media_kind";
  DROP TYPE "public"."enum__lessons_v_version_status";
  DROP TYPE "public"."enum_events_mode";
  DROP TYPE "public"."enum_events_district";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum__events_v_version_mode";
  DROP TYPE "public"."enum__events_v_version_district";
  DROP TYPE "public"."enum__events_v_version_status";
  DROP TYPE "public"."enum_event_registrations_seating";
  DROP TYPE "public"."enum_event_registrations_status";
  DROP TYPE "public"."enum_circles_district";
  DROP TYPE "public"."enum_circles_type";
  DROP TYPE "public"."enum_circles_frequency";
  DROP TYPE "public"."enum_circles_member_unit";
  DROP TYPE "public"."enum_circles_status";
  DROP TYPE "public"."enum_circle_memberships_status";
  DROP TYPE "public"."enum_videos_references_type";
  DROP TYPE "public"."enum_videos_level";
  DROP TYPE "public"."enum_videos_tint";
  DROP TYPE "public"."enum_videos_status";
  DROP TYPE "public"."enum__videos_v_version_references_type";
  DROP TYPE "public"."enum__videos_v_version_level";
  DROP TYPE "public"."enum__videos_v_version_tint";
  DROP TYPE "public"."enum__videos_v_version_status";
  DROP TYPE "public"."enum_playlists_level";
  DROP TYPE "public"."enum_playlists_tint";
  DROP TYPE "public"."enum_surahs_revelation";
  DROP TYPE "public"."enum_hadiths_grade";
  DROP TYPE "public"."enum_daily_reminders_kind";
  DROP TYPE "public"."enum_daily_reminders_custom_grade";
  DROP TYPE "public"."enum_forum_threads_status";
  DROP TYPE "public"."enum_forum_posts_status";
  DROP TYPE "public"."enum_reports_target_type";
  DROP TYPE "public"."enum_reports_reason";
  DROP TYPE "public"."enum_reports_status";
  DROP TYPE "public"."enum_notifications_kind";
  DROP TYPE "public"."enum_answer_votes_value";
  DROP TYPE "public"."enum_newsletter_subscribers_status";
  DROP TYPE "public"."enum_volunteers_interests";
  DROP TYPE "public"."enum_volunteers_district";
  DROP TYPE "public"."enum_volunteers_status";
  DROP TYPE "public"."enum_contact_messages_topic";
  DROP TYPE "public"."enum_contact_messages_status";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_audit_logs_action";
  DROP TYPE "public"."enum_home_page_journey_steps_stage";
  DROP TYPE "public"."enum_home_page_values_icon";
  DROP TYPE "public"."enum__home_page_v_version_journey_steps_stage";
  DROP TYPE "public"."enum__home_page_v_version_values_icon";
  DROP TYPE "public"."enum_about_page_adab_rules_icon";
  DROP TYPE "public"."enum_about_page_adab_rules_tone";
  DROP TYPE "public"."enum__about_page_v_version_adab_rules_icon";
  DROP TYPE "public"."enum__about_page_v_version_adab_rules_tone";`)
}
