import type { Endpoint } from 'payload'

import { bookmarkEndpoints } from './bookmarks'
import { circleEndpoints } from './circles'
import { contentEndpoints } from './content'
import { eventEndpoints } from './events'
import { forumEndpoints } from './forum'
import { learningEndpoints, questionEndpoints } from './learning'
import { notificationEndpoints } from './notifications'
import { openApiEndpoints } from './openapi'
import { outreachEndpoints } from './outreach'
import { peopleEndpoints } from './people'
import { reviewEndpoints } from './review'
import { rolesEndpoints } from './roles'
import { rulesEndpoints } from './rules'
import { scriptureEndpoints } from './scripture'
import { searchEndpoints } from './search'
import { youtubeEndpoints } from './youtube'

/** Versioned REST API for web and mobile clients, served at /api/v1/*. */
export const apiV1Endpoints: Endpoint[] = [
  ...contentEndpoints,
  ...reviewEndpoints,
  ...bookmarkEndpoints,
  ...learningEndpoints,
  ...questionEndpoints,
  ...eventEndpoints,
  ...circleEndpoints,
  ...outreachEndpoints,
  ...scriptureEndpoints,
  ...searchEndpoints,
  ...notificationEndpoints,
  ...openApiEndpoints,
  ...forumEndpoints,
  ...youtubeEndpoints,
  ...rulesEndpoints,
  ...rolesEndpoints,
  ...peopleEndpoints,
]
