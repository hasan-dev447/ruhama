import { describe, expect, it } from 'vitest'

import {
  abilityFor,
  cleanRolePermissions,
  entersAdmin,
  levelFor,
  MENUS,
  permissionEditProblem,
  roleAssignProblem,
  roleLevel,
  rolesWithAbility,
  rolesWithLevel,
  type PermissionMatrix,
} from '@/lib/permissions'

const none: PermissionMatrix = {}

describe('role permission defaults (today’s behaviour)', () => {
  it('gives super admin everything and keeps members out of the admin panel', () => {
    for (const m of MENUS) expect(roleLevel(none, 'super_admin', m.slug)).toBe('full')
    expect(entersAdmin(none, ['member'])).toBe(false)
    expect(entersAdmin(none, ['scholar', 'speaker'])).toBe(false)
    expect(entersAdmin(none, ['author'])).toBe(true)
  })

  it('matches the old fixed access', () => {
    expect(roleLevel(none, 'author', 'articles')).toBe('own')
    expect(roleLevel(none, 'reviewer', 'articles')).toBe('own')
    expect(roleLevel(none, 'editor', 'articles')).toBe('full')
    expect(roleLevel(none, 'moderator', 'articles')).toBe('none')
    expect(roleLevel(none, 'moderator', 'questions')).toBe('edit')
    expect(roleLevel(none, 'author', 'tags')).toBe('add')
    expect(roleLevel(none, 'shura', 'users')).toBe('edit')
    expect(roleLevel(none, 'shura', 'audit-logs')).toBe('view')
    expect(roleLevel(none, 'editor', 'home-page')).toBe('edit')
    expect(roleLevel(none, 'editor', 'site-settings')).toBe('none')
    expect(abilityFor(none, ['moderator'], 'forum.moderate')).toBe(true)
    expect(abilityFor(none, ['moderator'], 'questions.answer')).toBe(false)
    expect(abilityFor(none, ['reviewer'], 'review:articles')).toBe(true)
    expect(abilityFor(none, ['reviewer'], 'publish:articles')).toBe(false)
  })

  it('takes reviewers and publishers from the menu’s saved rules until changed here', () => {
    const fallback = {
      articles: {
        reviewerRoles: ['super_admin', 'shura'] as const,
        publisherRoles: ['super_admin'] as const,
      },
    } as never
    expect(abilityFor(none, ['reviewer'], 'review:articles', fallback)).toBe(false)
    expect(abilityFor(none, ['shura'], 'publish:articles', fallback)).toBe(false)
    expect(rolesWithAbility(none, 'publish:articles', fallback)).toEqual(['super_admin'])
  })
})

describe('combining roles and saved changes', () => {
  it('uses the highest level of all the person’s roles', () => {
    const m: PermissionMatrix = { author: { menus: { videos: 'none' } } }
    expect(levelFor(m, ['author'], 'videos')).toBe('none')
    expect(levelFor(m, ['author', 'editor'], 'videos')).toBe('full')
  })

  it('ignores a level the menu does not offer', () => {
    const m = { author: { menus: { 'audit-logs': 'full' } } } as unknown as PermissionMatrix
    expect(roleLevel(m, 'author', 'audit-logs')).toBe('none')
  })

  it('stores only real changes', () => {
    const clean = cleanRolePermissions('author', {
      menus: { articles: 'own', videos: 'view', bogus: 'full', tags: 'everything' },
      abilities: { 'questions.answer': true, 'forum.moderate': true, nope: true },
    })
    expect(clean).toEqual({ menus: { videos: 'view' }, abilities: { 'forum.moderate': true } })
  })

  it('lists roles at a level, super admin always first', () => {
    expect(rolesWithLevel(none, 'people', 'edit')).toEqual(['super_admin', 'shura', 'editor'])
  })
})

describe('who may change permissions', () => {
  const next = (menus: Record<string, string>, abilities: Record<string, boolean> = {}) =>
    ({ menus, abilities }) as never

  it('never lets anyone edit super admin', () => {
    expect(
      permissionEditProblem({
        matrix: none,
        actorRoles: ['super_admin'],
        role: 'super_admin',
        next: next({}),
      }),
    ).toBeTruthy()
  })

  it('lets super admin limit শূরা, but not শূরা itself', () => {
    expect(
      permissionEditProblem({
        matrix: none,
        actorRoles: ['super_admin'],
        role: 'shura',
        next: next({ integrations: 'none' }),
      }),
    ).toBeNull()
    expect(
      permissionEditProblem({ matrix: none, actorRoles: ['shura'], role: 'shura', next: next({}) }),
    ).toMatch(/সুপার অ্যাডমিন/)
  })

  it('stops শূরা without "roles.manage"', () => {
    const m: PermissionMatrix = { shura: { abilities: { 'roles.manage': false } } }
    expect(
      permissionEditProblem({
        matrix: m,
        actorRoles: ['shura'],
        role: 'author',
        next: next({ videos: 'view' }),
      }),
    ).toMatch(/অনুমতি আপনার নেই/)
  })

  it('never grants more than the editor has', () => {
    const m: PermissionMatrix = { shura: { menus: { integrations: 'none' } } }
    expect(
      permissionEditProblem({
        matrix: m,
        actorRoles: ['shura'],
        role: 'editor',
        next: next({ integrations: 'edit' }),
      }),
    ).toMatch(/বেশি দিতে পারবেন না/)
    // taking away is always fine
    expect(
      permissionEditProblem({
        matrix: m,
        actorRoles: ['shura'],
        role: 'editor',
        next: next({ articles: 'view' }),
      }),
    ).toBeNull()
    // an ability they lack cannot be handed out
    const m2: PermissionMatrix = { shura: { abilities: { 'forum.moderate': false } } }
    expect(
      permissionEditProblem({
        matrix: m2,
        actorRoles: ['shura'],
        role: 'author',
        next: next({}, { 'forum.moderate': true }),
      }),
    ).toMatch(/নিজের নেই/)
  })
})

describe('who may give or take roles', () => {
  const base = {
    matrix: none,
    actorId: 1,
    targetId: 2,
    targetRoles: ['member'] as never,
    add: true,
  }

  it('lets super admin do anything but remove their own super admin role', () => {
    expect(roleAssignProblem({ ...base, actorRoles: ['super_admin'], role: 'shura' })).toBeNull()
    expect(
      roleAssignProblem({
        ...base,
        actorRoles: ['super_admin'],
        targetId: 1,
        role: 'super_admin',
        add: false,
      }),
    ).toBeTruthy()
  })

  it('keeps শূরা away from super admin and শূরা', () => {
    expect(roleAssignProblem({ ...base, actorRoles: ['shura'], role: 'author' })).toBeNull()
    expect(roleAssignProblem({ ...base, actorRoles: ['shura'], role: 'shura' })).toBeTruthy()
    expect(roleAssignProblem({ ...base, actorRoles: ['shura'], role: 'super_admin' })).toBeTruthy()
    expect(
      roleAssignProblem({ ...base, actorRoles: ['shura'], targetRoles: ['shura'], role: 'author' }),
    ).toBeTruthy()
    expect(
      roleAssignProblem({ ...base, actorRoles: ['shura'], targetId: 1, role: 'author' }),
    ).toBeTruthy()
  })

  it('needs "users.roles"', () => {
    expect(roleAssignProblem({ ...base, actorRoles: ['editor'], role: 'author' })).toBeTruthy()
    const m: PermissionMatrix = { editor: { abilities: { 'users.roles': true } } }
    expect(
      roleAssignProblem({ ...base, matrix: m, actorRoles: ['editor'], role: 'author' }),
    ).toBeNull()
  })
})
