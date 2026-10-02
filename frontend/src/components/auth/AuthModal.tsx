import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { AuthActionButton } from '../AuthActionButton';
import { createAuthFormStyles } from '../authFormStyles';
import { useAuthModalStore } from '../../store/authModalStore';
import { useAuthStore } from '../../store/authStore';
import { useTheme, type Theme } from '../../theme/ThemeProvider';

type Mode = 'login' | 'register';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Gate de login para invitados: en vez de un modal/bottom-sheet, un círculo
 * se expande desde el punto exacto donde se tocó (like/save/follow/etc, ver
 * useRequireAuth) hasta cubrir toda la pantalla, revelando el formulario de
 * login/registro debajo. Al cerrar (cancelar o loguearse con éxito), el
 * círculo se contrae en reversa hacia el mismo punto de origen.
 *
 * Implementación: MaskedView con un <Circle> de react-native-svg como
 * máscara, cuyo radio se anima con Reanimated (useAnimatedProps) — nunca se
 * desmonta (mismo criterio que el modal anterior: montado una sola vez en
 * el layout raíz), el radio en 0 es lo que lo hace invisible/no-interactivo.
 *
 * - Login exitoso: cierra el gate (colapsa) y reintenta la acción que lo
 *   disparó (ver useRequireAuth / authModalStore.resolveWithLoginSuccess).
 * - Registro exitoso: cierra sin reintentar nada — el layout raíz detecta
 *   `isAuthenticated && !onboarding_completed` y redirige a (onboarding)
 *   automáticamente (ver app/_layout.tsx), el flujo que corresponde a una
 *   cuenta recién creada.
 */
export function AuthModal(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const formStyles = useMemo(() => createAuthFormStyles(theme), [theme]);
  const { width, height } = useWindowDimensions();

  const [mode, setMode] = useState<Mode>('login');

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const isVisible = useAuthModalStore((state) => state.isVisible);
  const origin = useAuthModalStore((state) => state.origin);
  const closeModal = useAuthModalStore((state) => state.close);
  const resolveWithLoginSuccess = useAuthModalStore((state) => state.resolveWithLoginSuccess);

  const isLoading = useAuthStore((state) => state.isLoading);
  const serverError = useAuthStore((state) => state.error);
  const loginAction = useAuthStore((state) => state.login);
  const registerAction = useAuthStore((state) => state.register);
  const clearError = useAuthStore((state) => state.clearError);

  // En web, <WebFrame> puede centrar la app dentro de un contenedor angosto
  // (ver WebFrame.tsx) cuando la ventana del navegador es más ancha que un
  // celular — en ese caso este `root` NO ocupa toda la ventana, así que
  // `pageX/pageY` del toque original (relativos al documento completo) no
  // coinciden con el espacio local del SVG (relativo a este contenedor).
  // measureInWindow da la posición y tamaño REALES de este contenedor en
  // coordenadas de ventana — se usa para corregir el origen y el radio
  // máximo. En nativo (y en web a ancho de celular) offsetX/offsetY dan 0 y
  // measuredSize coincide con window, así que esto no cambia nada ahí.
  const rootRef = useRef<View>(null);
  const containerOffsetX = useSharedValue(0);
  const containerOffsetY = useSharedValue(0);
  const containerWidth = useSharedValue(width);
  const containerHeight = useSharedValue(height);

  const measureContainer = (): void => {
    rootRef.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
      containerOffsetX.value = x;
      containerOffsetY.value = y;
      containerWidth.value = measuredWidth || width;
      containerHeight.value = measuredHeight || height;
    });
  };

  const originX = origin?.x ?? width / 2;
  const originY = origin?.y ?? height / 2;

  const radius = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Por si la ventana cambió de tamaño mientras el gate estaba cerrado
      // sin disparar un onLayout nuevo (caso raro) — asegura una medición
      // fresca justo antes de animar.
      measureContainer();
    }

    // El radio objetivo se recalcula en el propio worklet de abajo a partir
    // del tamaño ya medido del contenedor — acá solo se dispara la
    // animación hacia "abierto"/"cerrado" (1 o 0), interpolada más abajo.
    radius.value = withTiming(isVisible ? 1 : 0, { duration: isVisible ? 450 : 300 });
    // measureContainer no entra a las deps: es estable entre renders (no
    // depende de nada que cambie) y solo se quiere disparar por isVisible.
  }, [isVisible, radius]);

  const circleAnimatedProps = useAnimatedProps(() => {
    const maxRadiusForContainer = Math.sqrt(
      containerWidth.value * containerWidth.value + containerHeight.value * containerHeight.value
    );

    return {
      r: radius.value * maxRadiusForContainer,
      cx: originX - containerOffsetX.value,
      cy: originY - containerOffsetY.value,
    };
  });

  const resetForms = (): void => {
    setLogin('');
    setPassword('');
    setName('');
    setUsername('');
    setEmail('');
    setRegisterPassword('');
    setPasswordConfirmation('');
    setFormError(null);
    clearError();
  };

  const handleClose = (): void => {
    resetForms();
    setMode('login');
    closeModal();
  };

  const handleSwitchMode = (nextMode: Mode): void => {
    setFormError(null);
    clearError();
    setMode(nextMode);
  };

  const handleLoginSubmit = (): void => {
    clearError();

    loginAction({ login: login.trim(), password })
      .then(() => {
        resetForms();
        resolveWithLoginSuccess();
      })
      .catch(() => {
        // El error queda reflejado en el store; la UI ya lo muestra.
      });
  };

  const handleRegisterSubmit = (): void => {
    setFormError(null);
    clearError();

    if (registerPassword.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (registerPassword !== passwordConfirmation) {
      setFormError('Las contraseñas no coinciden.');
      return;
    }

    registerAction({
      name: name.trim(),
      username: username.trim(),
      email: email.trim(),
      password: registerPassword,
      password_confirmation: passwordConfirmation,
    })
      .then(() => {
        // No reintentamos la acción pendiente: una cuenta recién creada va a
        // onboarding, no a completar el like/follow/etc. que abrió el gate.
        resetForms();
        closeModal();
      })
      .catch(() => {
        // El error queda reflejado en el store; la UI ya lo muestra.
      });
  };

  const error = formError ?? serverError;
  const canSubmitLogin = login.trim().length > 0 && password.length > 0 && !isLoading;
  const canSubmitRegister =
    name.trim().length > 0 &&
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    registerPassword.length > 0 &&
    passwordConfirmation.length > 0 &&
    !isLoading;

  return (
    <View ref={rootRef} style={styles.root} onLayout={measureContainer} pointerEvents={isVisible ? 'auto' : 'none'}>
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <Svg style={StyleSheet.absoluteFill}>
            <AnimatedCircle animatedProps={circleAnimatedProps} fill="white" />
          </Svg>
        }
      >
        <View style={[StyleSheet.absoluteFill, styles.formBackground]}>
          <Pressable style={styles.closeArea} onPress={handleClose} hitSlop={8}>
            <Text style={styles.closeLabel}>Cerrar ✕</Text>
          </Pressable>

          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
              {mode === 'login' ? (
                <>
                  <Text style={formStyles.title}>Inicia sesión</Text>
                  <Text style={formStyles.subtitle}>Necesitas una cuenta para continuar</Text>

                  <TextInput
                    style={formStyles.input}
                    placeholder="Email o username"
                    placeholderTextColor={formStyles.placeholderColor}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={login}
                    onChangeText={setLogin}
                    editable={!isLoading}
                  />
                  <TextInput
                    style={formStyles.input}
                    placeholder="Contraseña"
                    placeholderTextColor={formStyles.placeholderColor}
                    secureTextEntry
                    autoCapitalize="none"
                    value={password}
                    onChangeText={setPassword}
                    editable={!isLoading}
                  />

                  {error && <Text style={formStyles.error}>{error}</Text>}

                  <AuthActionButton
                    label="Entrar"
                    isLoading={isLoading}
                    disabled={!canSubmitLogin}
                    onPress={handleLoginSubmit}
                  />

                  <Pressable onPress={() => handleSwitchMode('register')}>
                    <Text style={formStyles.link}>¿No tienes cuenta? Regístrate</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={formStyles.title}>Crear cuenta</Text>
                  <Text style={formStyles.subtitle}>Únete a la comunidad de artistas de ARTIVA</Text>

                  <TextInput
                    style={formStyles.input}
                    placeholder="Nombre completo"
                    placeholderTextColor={formStyles.placeholderColor}
                    value={name}
                    onChangeText={setName}
                    editable={!isLoading}
                  />
                  <TextInput
                    style={formStyles.input}
                    placeholder="Username"
                    placeholderTextColor={formStyles.placeholderColor}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={username}
                    onChangeText={setUsername}
                    editable={!isLoading}
                  />
                  <TextInput
                    style={formStyles.input}
                    placeholder="Email"
                    placeholderTextColor={formStyles.placeholderColor}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    editable={!isLoading}
                  />
                  <TextInput
                    style={formStyles.input}
                    placeholder="Contraseña (mínimo 8 caracteres)"
                    placeholderTextColor={formStyles.placeholderColor}
                    secureTextEntry
                    autoCapitalize="none"
                    value={registerPassword}
                    onChangeText={setRegisterPassword}
                    editable={!isLoading}
                  />
                  <TextInput
                    style={formStyles.input}
                    placeholder="Confirmar contraseña"
                    placeholderTextColor={formStyles.placeholderColor}
                    secureTextEntry
                    autoCapitalize="none"
                    value={passwordConfirmation}
                    onChangeText={setPasswordConfirmation}
                    editable={!isLoading}
                  />

                  {error && <Text style={formStyles.error}>{error}</Text>}

                  <AuthActionButton
                    label="Crear cuenta"
                    isLoading={isLoading}
                    disabled={!canSubmitRegister}
                    onPress={handleRegisterSubmit}
                  />

                  <Pressable onPress={() => handleSwitchMode('login')}>
                    <Text style={formStyles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </MaskedView>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100,
      elevation: 100,
    },
    flex: {
      flex: 1,
    },
    formBackground: {
      backgroundColor: theme.colors.background,
    },
    closeArea: {
      alignSelf: 'flex-end',
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    closeLabel: {
      ...theme.typography.bodySmall,
      color: theme.colors.textSecondary,
    },
    formContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
  });
}
