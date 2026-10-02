module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-worklets/plugin es el plugin de Babel que necesita
    // react-native-reanimated 4.x (construido sobre react-native-worklets).
    // Debe ser el último de la lista — así lo exige su documentación.
    plugins: ['react-native-worklets/plugin'],
  };
};
