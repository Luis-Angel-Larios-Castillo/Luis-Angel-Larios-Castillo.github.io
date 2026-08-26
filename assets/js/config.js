/* ============================================================
   CONFIGURACIÓN DE LA LANDING
   ============================================================ */

const CONFIG = {

  /**
   * Dirección de la API: la ruta que devuelve TODO el contenido.
   *
   * En tu despliegue de Render la API está montada en la raíz del
   * dominio, así que la URL termina en '/' y no en '/api/'.
   *
   * Para desarrollo local, con
   *     php -S localhost:8090 -t web api/enrutador-dev.php
   * cámbialo a '/api/'.
   *
   * Si lo dejas vacío, la página funciona igual usando solo el
   * respaldo local (assets/js/respaldo.js).
   */
  api: 'https://web-personal-backend-ado8.onrender.com/',

  /**
   * Cuánto esperar a la API antes de rendirse, en milisegundos.
   *
   * El plan gratuito de Render duerme el servicio tras ~15 minutos
   * sin uso, y despertarlo tarda cerca de 50 segundos. Por eso la
   * página NO espera: pinta de inmediato con el respaldo y cambia
   * el contenido cuando la API responde, aunque tarde.
   */
  timeout: 60000,

  /**
   * Guardar la última respuesta en el navegador.
   * Así una segunda visita muestra contenido actualizado al instante,
   * sin esperar a que Render despierte.
   */
  usarCache: true,

  /** Cuánto vale la copia guardada antes de considerarla vieja (ms). */
  cacheDuracion: 24 * 60 * 60 * 1000,   // 24 horas

  /**
   * Dónde se manda el formulario de contacto.
   *
   *   ''         → se deriva de `api`: la ruta /contacto de la misma API.
   *   'mailto'   → no se manda a ningún servidor; abre el correo del
   *                visitante con el mensaje ya redactado.
   *   una URL    → se manda ahí.
   *
   * Se usa la forma con parámetro (?ruta=contacto) porque las rutas
   * limpias dependen de mod_rewrite, y en el despliegue actual de la
   * API no está activo.
   *
   * Si la petición falla —API dormida, sin conexión, error del
   * servidor— la página cae sola al correo del visitante, así que el
   * mensaje nunca se pierde por culpa del servidor.
   */
  apiContacto: '',

  /** Cuánto esperar al enviar el formulario, en milisegundos. */
  timeoutContacto: 20000,
};
