export const RECIPE_SELECT = `
  *,
  profile:profiles(id, username, avatar_url),
  images:recipe_images(*),
  handwriting_font:handwriting_fonts(*)
` as const
