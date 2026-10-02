const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// IP de LAN fija (reserva DHCP en el router) del backend local de ARTIVA en desarrollo.
// Debe coincidir con el host de EXPO_PUBLIC_API_URL en frontend/.env y frontend/eas.json.
// Android 9+ (API 28+) bloquea tráfico HTTP sin cifrar por defecto en builds release/preview
// (el manifest de debug ya trae usesCleartextTraffic="true" propio, generado por RN/Expo,
// así que esto solo hace falta para preview/production). Si la IP cambia, actualizar aquí también.
const DEV_BACKEND_HOST = '192.168.18.120';
const CONFIG_FILE_NAME = 'network_security_config.xml';

function withNetworkSecurityConfigFile(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      fs.mkdirSync(xmlDir, { recursive: true });

      const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generado por plugins/withDevBackendCleartext.js — NO editar a mano, se regenera en cada
     "expo prebuild". Permite HTTP sin cifrar únicamente hacia el backend local de desarrollo
     (${DEV_BACKEND_HOST}); todo el resto del tráfico sigue bloqueado por la network security
     config base de Android (solo HTTPS). -->
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">${DEV_BACKEND_HOST}</domain>
    </domain-config>
</network-security-config>
`;

      fs.writeFileSync(path.join(xmlDir, CONFIG_FILE_NAME), xmlContent);

      return config;
    },
  ]);
}

function withNetworkSecurityConfigManifest(config) {
  return withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    return config;
  });
}

/**
 * Permite tráfico HTTP (cleartext) exclusivamente hacia la IP del backend local de desarrollo,
 * para que los builds "preview"/release de EAS puedan hablar con `php artisan serve` en LAN
 * sin necesitar HTTPS. No afecta ningún otro dominio ni habilita cleartext globalmente.
 */
module.exports = function withDevBackendCleartext(config) {
  config = withNetworkSecurityConfigFile(config);
  config = withNetworkSecurityConfigManifest(config);
  return config;
};
