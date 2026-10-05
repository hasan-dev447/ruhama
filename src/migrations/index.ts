import * as migration_20261005_041117_initial from './20261005_041117_initial'
import * as migration_20261005_090223_contact_invite_topic from './20261005_090223_contact_invite_topic'
import * as migration_20261005_094231_forum_author_optional from './20261005_094231_forum_author_optional'
import * as migration_20261006_000000_supabase_lockdown from './20261006_000000_supabase_lockdown'

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
    up: migration_20261006_000000_supabase_lockdown.up,
    down: migration_20261006_000000_supabase_lockdown.down,
    name: '20261006_000000_supabase_lockdown',
  },
]
