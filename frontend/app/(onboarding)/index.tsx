import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ReanimatedAnimated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { extractErrorMessage } from '../../src/api/errors';
import { fetchCategories } from '../../src/api/categories';
import { completeOnboarding } from '../../src/api/onboarding';
import { AuthActionButton } from '../../src/components/AuthActionButton';
import { createAuthFormStyles } from '../../src/components/authFormStyles';
import { CategoryChip } from '../../src/components/CategoryChip';
import { OnboardingProgressBar } from '../../src/components/OnboardingProgressBar';
import { useAmbientBackground } from '../../src/hooks/useAmbientBackground';
import { useAuthStore } from '../../src/store/authStore';
import { useTheme, type Theme } from '../../src/theme/ThemeProvider';
import type { Category } from '../../src/types/category';

const TOTAL_STEPS = 4;

type Step = 1 | 2 | 3 | 4;

function toggleId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((existing) => existing !== id) : [...list, id];
}

export default function OnboardingScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const formStyles = useMemo(() => createAuthFormStyles(theme), [theme]);

  // Sin imagen relevante (formulario por pasos) — fondo ambiental de
  // escritorio cae al color sólido del theme.
  useAmbientBackground(null);

  const [step, setStep] = useState<Step>(1);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [artistTypeIds, setArtistTypeIds] = useState<number[]>([]);
  const [interestIds, setInterestIds] = useState<number[]>([]);
  const [bio, setBio] = useState('');

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setUser = useAuthStore((state) => state.setUser);
  const fadeAnim = useSharedValue(1);

  const loadCategories = useCallback((): void => {
    setCategoriesLoading(true);
    setCategoriesError(null);

    fetchCategories()
      .then(setCategories)
      .catch((error: unknown) => setCategoriesError(extractErrorMessage(error)))
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const goToStep = (next: Step): void => {
    fadeAnim.value = withTiming(0, { duration: 150 }, (finished) => {
      if (finished) {
        fadeAnim.value = withTiming(1, { duration: 150 });
      }
    });
    setTimeout(() => setStep(next), 150);
  };

  const handleFinish = (): void => {
    setSubmitError(null);
    setIsSubmitting(true);

    completeOnboarding({
      category_ids: artistTypeIds,
      interest_ids: interestIds,
      bio: bio.trim().length > 0 ? bio.trim() : null,
    })
      .then((user) => {
        setUser(user);
        // El layout raíz detecta onboarding_completed = true y redirige a (tabs).
      })
      .catch((error: unknown) => setSubmitError(extractErrorMessage(error)))
      .finally(() => setIsSubmitting(false));
  };

  const renderCategoryPicker = (
    selectedIds: number[],
    onToggle: (id: number) => void
  ): React.JSX.Element => {
    if (categoriesLoading) {
      return <ActivityIndicator size="small" color={theme.colors.accentPrimary} style={styles.categoriesLoading} />;
    }

    if (categoriesError) {
      return (
        <View style={styles.categoriesError}>
          <Text style={formStyles.error}>{categoriesError}</Text>
          <Pressable onPress={loadCategories}>
            <Text style={formStyles.link}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.chipGrid}>
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.name}
            selected={selectedIds.includes(category.id)}
            onPress={() => onToggle(category.id)}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.progressWrapper}>
        <OnboardingProgressBar step={step} totalSteps={TOTAL_STEPS} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ReanimatedAnimated.View style={fadeStyle}>
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={formStyles.title}>Bienvenido a ARTIVA</Text>
              <Text style={formStyles.subtitle}>
                En menos de 2 minutos configuramos tu perfil para mostrarte contenido y
                colaboraciones relevantes.
              </Text>
              <AuthActionButton label="Continuar" onPress={() => goToStep(2)} />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={formStyles.title}>¿Qué tipo de artista eres?</Text>
              <Text style={formStyles.subtitle}>Elige una o más disciplinas.</Text>
              {renderCategoryPicker(artistTypeIds, (id) =>
                setArtistTypeIds((prev) => toggleId(prev, id))
              )}
              <AuthActionButton
                label="Continuar"
                disabled={artistTypeIds.length === 0}
                onPress={() => goToStep(3)}
              />
              <Pressable onPress={() => goToStep(1)}>
                <Text style={formStyles.link}>Atrás</Text>
              </Pressable>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={formStyles.title}>¿Qué quieres descubrir?</Text>
              <Text style={formStyles.subtitle}>
                Elige los temas que te gustaría ver en tu feed (opcional).
              </Text>
              {renderCategoryPicker(interestIds, (id) =>
                setInterestIds((prev) => toggleId(prev, id))
              )}
              <AuthActionButton label="Continuar" onPress={() => goToStep(4)} />
              <Pressable onPress={() => goToStep(2)}>
                <Text style={formStyles.link}>Atrás</Text>
              </Pressable>
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={formStyles.title}>Cuéntanos sobre ti</Text>
              <Text style={formStyles.subtitle}>Una bio corta (opcional).</Text>
              <TextInput
                style={[formStyles.input, styles.bioInput]}
                placeholder="Ej: Fotógrafa callejera basada en Lima."
                placeholderTextColor={formStyles.placeholderColor}
                value={bio}
                onChangeText={setBio}
                multiline
                maxLength={500}
                editable={!isSubmitting}
              />

              {submitError && <Text style={formStyles.error}>{submitError}</Text>}

              <AuthActionButton
                label="Finalizar"
                isLoading={isSubmitting}
                onPress={handleFinish}
              />
              <Pressable onPress={() => goToStep(3)} disabled={isSubmitting}>
                <Text style={formStyles.link}>Atrás</Text>
              </Pressable>
            </View>
          )}
        </ReanimatedAnimated.View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    progressWrapper: {
      paddingHorizontal: 24,
      paddingTop: 16,
    },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    stepContent: {
      gap: 12,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    categoriesLoading: {
      marginVertical: 16,
    },
    categoriesError: {
      gap: 8,
      marginVertical: 8,
    },
    bioInput: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
  });
}
