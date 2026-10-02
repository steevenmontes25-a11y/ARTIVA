import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput } from 'react-native';
import { Link } from 'expo-router';

import { AuthActionButton } from '../../src/components/AuthActionButton';
import { createAuthFormStyles } from '../../src/components/authFormStyles';
import { useAmbientBackground } from '../../src/hooks/useAmbientBackground';
import { useAuthStore } from '../../src/store/authStore';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function RegisterScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createAuthFormStyles(theme), [theme]);

  // Sin imagen relevante (formulario) — fondo ambiental de escritorio cae al
  // color sólido del theme.
  useAmbientBackground(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const isLoading = useAuthStore((state) => state.isLoading);
  const serverError = useAuthStore((state) => state.error);
  const registerAction = useAuthStore((state) => state.register);
  const clearError = useAuthStore((state) => state.clearError);

  const handleSubmit = (): void => {
    setFormError(null);
    clearError();

    if (password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== passwordConfirmation) {
      setFormError('Las contraseñas no coinciden.');
      return;
    }

    registerAction({
      name: name.trim(),
      username: username.trim(),
      email: email.trim(),
      password,
      password_confirmation: passwordConfirmation,
    }).catch(() => {
      // El error queda reflejado en el store; la UI ya lo muestra.
    });
  };

  const error = formError ?? serverError;
  const canSubmit =
    name.trim().length > 0 &&
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    passwordConfirmation.length > 0 &&
    !isLoading;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Únete a la comunidad de artistas de ARTIVA</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          placeholderTextColor={styles.placeholderColor}
          value={name}
          onChangeText={setName}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={styles.placeholderColor}
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={styles.placeholderColor}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña (mínimo 8 caracteres)"
          placeholderTextColor={styles.placeholderColor}
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          placeholderTextColor={styles.placeholderColor}
          secureTextEntry
          autoCapitalize="none"
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
          editable={!isLoading}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <AuthActionButton
          label="Crear cuenta"
          isLoading={isLoading}
          disabled={!canSubmit}
          onPress={handleSubmit}
        />

        <Link href="/(auth)/login" style={styles.link}>
          ¿Ya tienes cuenta? Inicia sesión
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
