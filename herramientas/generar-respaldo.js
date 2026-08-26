#!/usr/bin/env node
/**
 * Genera assets/js/respaldo.js consultando la API.
 *
 * El respaldo es la copia que la landing usa para pintar de inmediato
 * y como red de seguridad cuando la API no responde: servicio dormido,
 * sin conexión, o un fallo del servidor.
 *
 * Como el backend vive en otro repositorio, aquí no hay archivos JSON
 * que leer: se le piden a la API desplegada.
 *
 * Uso:
 *     node herramientas/generar-respaldo.js
 *     node herramientas/generar-respaldo.js https://otra-api.onrender.com/
 *
 * La URL sale, por orden: del argumento, de la variable de entorno
 * API_URL, o de la que esté en assets/js/config.js.
 *
 * SEGURIDAD: si la API no responde, NO se toca el respaldo existente.
 * Publicar un respaldo vacío dejaría el portafolio en blanco justo
 * cuando la API está caída, que es cuando más se necesita.
 */

const fs = require('fs');
const path = require('path');

const RAIZ    = path.join(__dirname, '..');
const CONFIG  = path.join(RAIZ, 'assets', 'js', 'config.js');
const DESTINO = path.join(RAIZ, 'assets', 'js', 'respaldo.js');

const RECURSOS = ['perfil', 'proyectos', 'habilidades', 'experiencia', 'educacion'];

/* El servicio gratuito de Render duerme tras ~15 min sin uso y tarda
   cerca de un minuto en despertar, así que hay que ser paciente. */
const ESPERA_MS  = 90000;
const REINTENTOS = 3;

/** Saca la URL de config.js sin ejecutarlo. */
function urlDeConfig() {
  try {
    const texto = fs.readFileSync(CONFIG, 'utf8');
    const m = texto.match(/api\s*:\s*['"]([^'"]+)['"]/);
    return m ? m[1] : '';
  } catch (e) {
    return '';
  }
}

const url = process.argv[2] || process.env.API_URL || urlDeConfig();

if (!url) {
  console.error('No hay URL de la API.');
  console.error('Pásala como argumento, en API_URL, o ponla en assets/js/config.js');
  process.exit(1);
}

const espera = (ms) => new Promise(r => setTimeout(r, ms));

async function pedir(intento) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), ESPERA_MS);

  try {
    const t0 = Date.now();
    const r = await fetch(url, {
      signal: control.signal,
      headers: { Accept: 'application/json' },
    });

    if (!r.ok) throw new Error(`la API respondió ${r.status}`);

    const j = await r.json();
    if (!j || j.ok === false) throw new Error(j?.error || 'respuesta con ok:false');
    if (!j.datos) throw new Error('la respuesta no trae el campo "datos"');

    console.log(`  respuesta en ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    return j.datos;
  } finally {
    clearTimeout(reloj);
  }
}

(async () => {
  console.log(`Consultando ${url}`);

  let datos = null;
  for (let i = 1; i <= REINTENTOS; i++) {
    try {
      datos = await pedir(i);
      break;
    } catch (e) {
      const motivo = e.name === 'AbortError' ? `sin respuesta en ${ESPERA_MS / 1000}s` : e.message;
      console.warn(`  intento ${i}/${REINTENTOS} falló: ${motivo}`);
      if (i < REINTENTOS) {
        console.log('  reintentando en 5s (puede estar despertando)…');
        await espera(5000);
      }
    }
  }

  if (!datos) {
    console.error('\nNo se pudo obtener el contenido de la API.');
    if (fs.existsSync(DESTINO)) {
      console.error('Se conserva el respaldo actual sin cambios. La landing sigue funcionando.');
      process.exit(0);           // no rompe el despliegue
    }
    console.error('Y tampoco existe un respaldo previo. Revisa la URL de la API.');
    process.exit(1);
  }

  // Validación mínima: mejor conservar el respaldo viejo que escribir uno inservible.
  const faltantes = RECURSOS.filter(r => datos[r] === undefined);
  if (faltantes.length) {
    console.error(`\nLa API no devolvió: ${faltantes.join(', ')}`);
    console.error('No se sobrescribe el respaldo con datos incompletos.');
    process.exit(fs.existsSync(DESTINO) ? 0 : 1);
  }

  if (!Array.isArray(datos.proyectos) || datos.proyectos.length === 0) {
    console.error('\nLa API devolvió cero proyectos. Parece un error, no se sobrescribe.');
    process.exit(fs.existsSync(DESTINO) ? 0 : 1);
  }

  for (const r of RECURSOS) {
    const v = datos[r];
    console.log(`  ok    ${r.padEnd(14)} ${Array.isArray(v) ? v.length + ' elementos' : 'objeto'}`);
  }

  const fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const contenido = `/* ============================================================
   RESPALDO LOCAL — GENERADO AUTOMÁTICAMENTE, NO EDITAR A MANO.

   Copia del contenido que sirve la API. La landing lo usa para
   pintar de inmediato y como red de seguridad si la API no
   responde (servicio dormido, sin conexión, error del servidor).

   El contenido real se edita en el repositorio del backend.
   Para regenerar este archivo:
       node herramientas/generar-respaldo.js

   Origen:    ${url}
   Generado:  ${fecha}
   ============================================================ */

const RESPALDO = ${JSON.stringify(datos, null, 2)};
`;

  fs.writeFileSync(DESTINO, contenido, 'utf8');

  const kb = (Buffer.byteLength(contenido) / 1024).toFixed(1);
  console.log(`\nEscrito: ${path.relative(RAIZ, DESTINO)} (${kb} KB)`);
})();
