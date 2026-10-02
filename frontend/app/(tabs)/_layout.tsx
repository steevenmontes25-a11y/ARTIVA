import { Tabs } from 'expo-router';

/**
 * La navegación entre estas 5 pantallas ya no pasa por la tab bar inferior
 * (ver <RadialMenu /> montado en cada una) — este Tabs navigator se
 * mantiene solo como contenedor (evita que cambiar de pantalla acumule
 * historial de Stack sin límite, y preserva el estado de cada una al
 * volver) pero sin tab bar ni header visibles. El guard de auth para
 * Crear/Colaborar/Perfil que antes vivía en tabPress ahora vive en
 * <RadialMenu /> mismo, ya que es la única forma de llegar a esos tabs.
 *
 * backBehavior="initialRoute": "atrás" desde cualquier tab (Descubrir,
 * Crear, Colaborar, Perfil) vuelve DIRECTO a Inicio en un solo paso — el
 * default de React Navigation ("history") en cambio va tab por tab en
 * orden de visita, que puede ser un camino más largo que "directo a
 * Inicio" si el usuario saltó entre varios tabs antes de presionar atrás.
 */
export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="create" />
      <Tabs.Screen name="collaborate" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
