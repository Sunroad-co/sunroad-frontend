/**
 * SWR key utilities to avoid stringly-typed keys
 */

export const swrKeys = {
  dashboardSnapshot: (userId: string) => ['dashboardSnapshot', userId] as const,
  userProfile: (userId: string) => ['user-profile', userId] as const,
}

