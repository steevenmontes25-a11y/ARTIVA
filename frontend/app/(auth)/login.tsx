import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput } from 'react-native';
import { Link } from 'expo-router';

import { AuthActionButton } from '../../src/components/AuthActionButton';
import { createAuthFormStyles } from '../../src/components/authFormStyles';
import { useAmbientBackground } from '../../src/hooks/useAmbientBackground';
import { useAuthStore } from '../../src/store/authStore';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function LoginScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createAuthFormStyles(theme), [theme]);

  // Sin imagen relevante (formulario) — fondo ambiental de escritorio cae al
  // color sólido del theme.
  useAmbientBackground(null);

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const loginAction = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);

  const handleSubmit = (): void => {
    clearError();
    loginAction({ login: login.trim(), password }).catch(() => {
      // El error queda reflejado en el store; la UI ya lo muestra.
    });
  };

  const canSubmit = login.trim().length > 0 && password.length > 0 && !isLoading;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.subtitle}>Entra con tu email o tu username</Text>

        <TextInput
          style={styles.input}
          placeholder="Email o username"
          placeholderTextColor={styles.placeholderColor}
          autoCapitalize="none"
          autoCorrect={false}
          value={login}
          onChangeText={setLogin}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={styles.placeholderColor}
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <AuthActionButton label="Entrar" isLoading={isLoading} disabled={!canSubmit} onPress={handleSubmit} />

        <Link href="/(auth)/register" style={styles.link}>
          ¿No tienes cuenta? Regístrate
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
