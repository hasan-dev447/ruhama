import * as migration_20261005_041117_initial from './20261005_041117_initial'
import * as migration_20261005_090223_contact_invite_topic from './20261005_090223_contact_invite_topic'
import * as migration_20261005_094231_forum_author_optional from './20261005_094231_forum_author_optional'
import * as migration_20261005_170847_site_settings_auth_toggle from './20261005_170847_site_settings_auth_toggle'
import * as migration_20261006_000000_supabase_lockdown from './20261006_000000_supabase_lockdown'
import * as migration_20261006_154718_integrations from './20261006_154718_integrations'
import * as migration_20261006_162720_media_folders from './20261006_162720_media_folders'
import * as migration_20261006_180808_profiles from './20261006_180808_profiles'
import * as migration_20261007_041905_user_contacts from './20261007_041905_user_contacts'
import * as migration_20261007_053931_contacts_index from './20261007_053931_contacts_index'
import * as migration_20261007_093052_home_cta_links from './20261007_093052_home_cta_links'
import * as migration_20261007_095114_home_sections from './20261007_095114_home_sections'
import * as migration_20261007_100901_daily_schedule_switch from './20261007_100901_daily_schedule_switch'
import * as migration_20261007_112018_event_recaps from './20261007_112018_event_recaps'
import * as migration_20261007_114246_youtube_connections from './20261007_114246_youtube_connections'
import * as migration_20261007_123717_about_shura_featured from './20261007_123717_about_shura_featured'
import * as migration_20261007_124619_event_max_guests from './20261007_124619_event_max_guests'
import * as migration_20261007_131251_scripture_labels from './20261007_131251_scripture_labels'
import * as migration_20261007_134049_media_alt_optional from './20261007_134049_media_alt_optional'
import * as migration_20261007_135029_media_sizes_gallery from './20261007_135029_media_sizes_gallery'
import * as migration_20261008_153958_collection_rules from './20261008_153958_collection_rules'
import * as migration_20261008_165833_public_profiles from './20261008_165833_public_profiles'
import * as migration_20261009_155913_role_permissions from './20261009_155913_role_permissions'

export const migrations = [
  {
    up: migration_20261005_041117_initial.up,
    down: migration_20261005_041117_initial.down,
    name: '20261005_041117_initial',
  },
  {
    up: migration_20261005_090223_contact_invite_topic.up,
    down: migration_20261005_090223_contact_invite_topic.down,
    name: '20261005_090223_contact_invite_topic',
  },
  {
    up: migration_20261005_094231_forum_author_optional.up,
    down: migration_20261005_094231_forum_author_optional.down,
    name: '20261005_094231_forum_author_optional',
  },
  {
    up: migration_20261005_170847_site_settings_auth_toggle.up,
    down: migration_20261005_170847_site_settings_auth_toggle.down,
    name: '20261005_170847_site_settings_auth_toggle',
  },
  {
    up: migration_20261006_000000_supabase_lockdown.up,
    down: migration_20261006_000000_supabase_lockdown.down,
    name: '20261006_000000_supabase_lockdown',
  },
  {
    up: migration_20261006_154718_integrations.up,
    down: migration_20261006_154718_integrations.down,
    name: '20261006_154718_integrations',
  },
  {
    up: migration_20261006_162720_media_folders.up,
    down: migration_20261006_162720_media_folders.down,
    name: '20261006_162720_media_folders',
  },
  {
    up: migration_20261006_180808_profiles.up,
    down: migration_20261006_180808_profiles.down,
    name: '20261006_180808_profiles',
  },
  {
    up: migration_20261007_041905_user_contacts.up,
    down: migration_20261007_041905_user_contacts.down,
    name: '20261007_041905_user_contacts',
  },
  {
    up: migration_20261007_053931_contacts_index.up,
    down: migration_20261007_053931_contacts_index.down,
    name: '20261007_053931_contacts_index',
  },
  {
    up: migration_20261007_093052_home_cta_links.up,
    down: migration_20261007_093052_home_cta_links.down,
    name: '20261007_093052_home_cta_links',
  },
  {
    up: migration_20261007_095114_home_sections.up,
    down: migration_20261007_095114_home_sections.down,
    name: '20261007_095114_home_sections',
  },
  {
    up: migration_20261007_100901_daily_schedule_switch.up,
    down: migration_20261007_100901_daily_schedule_switch.down,
    name: '20261007_100901_daily_schedule_switch',
  },
  {
    up: migration_20261007_112018_event_recaps.up,
    down: migration_20261007_112018_event_recaps.down,
    name: '20261007_112018_event_recaps',
  },
  {
    up: migration_20261007_114246_youtube_connections.up,
    down: migration_20261007_114246_youtube_connections.down,
    name: '20261007_114246_youtube_connections',
  },
  {
    up: migration_20261007_123717_about_shura_featured.up,
    down: migration_20261007_123717_about_shura_featured.down,
    name: '20261007_123717_about_shura_featured',
  },
  {
    up: migration_20261007_124619_event_max_guests.up,
    down: migration_20261007_124619_event_max_guests.down,
    name: '20261007_124619_event_max_guests',
  },
  {
    up: migration_20261007_131251_scripture_labels.up,
    down: migration_20261007_131251_scripture_labels.down,
    name: '20261007_131251_scripture_labels',
  },
  {
    up: migration_20261007_134049_media_alt_optional.up,
    down: migration_20261007_134049_media_alt_optional.down,
    name: '20261007_134049_media_alt_optional',
  },
  {
    up: migration_20261007_135029_media_sizes_gallery.up,
    down: migration_20261007_135029_media_sizes_gallery.down,
    name: '20261007_135029_media_sizes_gallery',
  },
  {
    up: migration_20261008_153958_collection_rules.up,
    down: migration_20261008_153958_collection_rules.down,
    name: '20261008_153958_collection_rules',
  },
  {
    up: migration_20261008_165833_public_profiles.up,
    down: migration_20261008_165833_public_profiles.down,
    name: '20261008_165833_public_profiles',
  },
  {
    up: migration_20261009_155913_role_permissions.up,
    down: migration_20261009_155913_role_permissions.down,
    name: '20261009_155913_role_permissions',
  },
]
