-- Migration : isolation multi-utilisateur
-- Chaque utilisateur ne voit que ses propres recettes et données associées

-- 1. Recipes : propriétaire uniquement
DROP POLICY IF EXISTS "Recettes visibles par tous" ON recipes;
CREATE POLICY "L'utilisateur voit ses propres recettes"
  ON recipes FOR SELECT USING (auth.uid() = user_id);

-- 2. Recipe Images : images des recettes du propriétaire
DROP POLICY IF EXISTS "Images visibles par tous" ON recipe_images;
CREATE POLICY "L'utilisateur voit les images de ses recettes"
  ON recipe_images FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM recipes WHERE id = recipe_id));

-- 3. Likes : propres likes uniquement
DROP POLICY IF EXISTS "Likes visibles par tous" ON likes;
CREATE POLICY "L'utilisateur voit ses propres likes"
  ON likes FOR SELECT USING (auth.uid() = user_id);

-- 4. Comments : commentaires sur ses propres recettes
DROP POLICY IF EXISTS "Commentaires visibles par tous" ON comments;
CREATE POLICY "L'utilisateur voit les commentaires de ses recettes"
  ON comments FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM recipes WHERE id = recipe_id));

-- 5. Ratings : ratings sur ses propres recettes
DROP POLICY IF EXISTS "Ratings visibles par tous" ON ratings;
CREATE POLICY "L'utilisateur voit les ratings de ses recettes"
  ON ratings FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM recipes WHERE id = recipe_id));
