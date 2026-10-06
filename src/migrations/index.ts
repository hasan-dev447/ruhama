import * as migration_20261005_041117_initial from './20261005_041117_initial'
import * as migration_20261005_090223_contact_invite_topic from './20261005_090223_contact_invite_topic'
import * as migration_20261005_094231_forum_author_optional from './20261005_094231_forum_author_optional'
import * as migration_20261005_170847_site_settings_auth_toggle from './20261005_170847_site_settings_auth_toggle'
import * as migration_20261006_000000_supabase_lockdown from './20261006_000000_supabase_lockdown'
import * as migration_20261006_154718_integrations from './20261006_154718_integrations'
import * as migration_20261006_162720_media_folders from './20261006_162720_media_folders'

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
]
