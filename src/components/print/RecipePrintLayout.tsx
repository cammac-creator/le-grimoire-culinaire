import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Recipe } from '@/types'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    padding: 40,
    fontFamily: 'Helvetica',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#92400e',
  },
  coverSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#78716c',
    marginTop: 12,
  },
  tocTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 20,
    color: '#92400e',
  },
  tocItem: {
    fontSize: 12,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recipeTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 11,
    color: '#78716c',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#1c1917',
  },
  ingredient: {
    fontSize: 11,
    marginBottom: 3,
  },
  step: {
    fontSize: 11,
    marginBottom: 6,
  },
  stepNumber: {
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
  },
  meta: {
    fontSize: 10,
    color: '#78716c',
    marginBottom: 4,
  },
  separator: {
    borderBottom: 1,
    borderColor: '#e7e0d8',
    marginVertical: 12,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 20,
    right: 40,
    color: '#78716c',
  },
})

interface RecipePrintDocumentProps {
  recipes: Recipe[]
  title?: string
}

export function RecipePrintDocument({
  recipes,
  title = 'Le Grimoire Culinaire',
}: RecipePrintDocumentProps) {
  return (
    <Document>
      {/* Couverture */}
      <Page size="A4" style={styles.coverPage}>
        <View>
          <Text style={styles.coverTitle}>{title}</Text>
          <Text style={styles.coverSubtitle}>
            {recipes.length} recette{recipes.length > 1 ? 's' : ''}
          </Text>
        </View>
      </Page>

      {/* Table des matières */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.tocTitle}>Table des matières</Text>
        {recipes.map((recipe, i) => (
          <View key={recipe.id} style={styles.tocItem}>
            <Text>{recipe.title}</Text>
            <Text>{i + 3}</Text>
          </View>
        ))}
        <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
      </Page>

      {/* Pages des recettes */}
      {recipes.map((recipe) => (
        <Page key={recipe.id} size="A4" style={styles.page}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          {recipe.description && (
            <Text style={styles.recipeDescription}>{recipe.description}</Text>
          )}

          {/* Métadonnées */}
          <View style={{ flexDirection: 'row', gap: 20 }}>
            {recipe.prep_time && (
              <Text style={styles.meta}>Prép. : {recipe.prep_time} min</Text>
            )}
            {recipe.cook_time && (
              <Text style={styles.meta}>Cuisson : {recipe.cook_time} min</Text>
            )}
            {recipe.servings && (
              <Text style={styles.meta}>{recipe.servings} portions</Text>
            )}
          </View>

          <View style={styles.separator} />

          {/* Ingrédients */}
          <Text style={styles.sectionTitle}>Ingrédients</Text>
          {recipe.ingredients?.map((ing, i) => (
            <Text key={i} style={styles.ingredient}>
              • {ing.quantity} {ing.unit} {ing.name}
            </Text>
          ))}

          {/* Étapes */}
          <Text style={styles.sectionTitle}>Préparation</Text>
          {recipe.steps?.map((step, i) => (
            <Text key={i} style={styles.step}>
              <Text style={styles.stepNumber}>{step.number}. </Text>
              {step.text}
            </Text>
          ))}

          {/* Notes */}
          {recipe.tested_notes && (
            <>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.step}>{recipe.tested_notes}</Text>
            </>
          )}

          {recipe.author_name && (
            <Text style={styles.meta}>
              Source : {recipe.author_name}
            </Text>
          )}

          <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
        </Page>
      ))}
    </Document>
  )
}
