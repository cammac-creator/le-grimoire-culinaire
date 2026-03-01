export const RECIPE_SELECT = `
  *,
  profile:profiles(id, username, avatar_url),
  images:recipe_images(*)
` as const
