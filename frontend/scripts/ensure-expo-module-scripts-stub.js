// `expo-blur` y `expo-video` (versión 57.x actual, sin patch más nuevo
// disponible) traen empaquetado su tsconfig.json de DESARROLLO, el que usan
// dentro del monorepo de Expo — y ese archivo extiende
// "expo-module-scripts/tsconfig.base", un paquete que solo existe ahí
// adentro, nunca en el node_modules de una app consumidora. Es un bug de
// empaquetado ya reportado (github.com/expo/expo/issues/37645), no algo que
// nuestro código controle.
//
// Nuestro propio proyecto nunca usa esos archivos (nuestro tsconfig.json
// raíz ya excluye node_modules por completo, `tsc`/el build de Expo nunca
// los tocan) — el único síntoma real es que el editor los detecta como
// "proyectos" TypeScript sueltos y los marca en rojo en la pestaña
// Problems, porque no puede resolver ese `extends`.
//
// Este script crea un stub mínimo y válido de `expo-module-scripts` (solo
// el `tsconfig.base.json` que ese `extends` necesita, nada de su toolchain
// real de jest/eslint/etc.) para que la resolución tenga éxito. Se corre
// automáticamente en cada `npm install` (ver "postinstall" en package.json)
// porque node_modules se reconstruye desde cero y este archivo no persiste
// solo. No afecta el build ni el bundle de la app en absoluto: nada del
// código fuente importa este paquete, solo lo lee este único archivo de
// configuración cuando el editor abre esos tsconfig.json ajenos.
const fs = require('fs');
const path = require('path');

const stubDir = path.join(__dirname, '..', 'node_modules', 'expo-module-scripts');

if (fs.existsSync(stubDir)) {
  // Ya existe (p. ej. alguien instaló el paquete real como devDependency) —
  // no pisar nada.
  process.exit(0);
}

fs.mkdirSync(stubDir, { recursive: true });

fs.writeFileSync(
  path.join(stubDir, 'package.json'),
  JSON.stringify(
    {
      name: 'expo-module-scripts',
      version: '0.0.0-stub',
      description:
        'Stub local generado por scripts/ensure-expo-module-scripts-stub.js — ver ese archivo para el motivo.',
      private: true,
    },
    null,
    2
  ) + '\n'
);

fs.writeFileSync(
  path.join(stubDir, 'tsconfig.base.json'),
  JSON.stringify(
    {
      compilerOptions: {
        skipLibCheck: true,
      },
    },
    null,
    2
  ) + '\n'
);
