# Portafolio · Landing

Página del portafolio. Se alimenta de una API externa y se despliega en GitHub Pages.

El contenido **no se edita aquí**: vive en el repositorio del backend.

```
Repo del backend           Este repo
api/datos/*.json    ──▶    la Action consulta la API  ──▶  GitHub Pages
       │                          │
       └──▶ API en Render ────────┘
```

## Estructura

```
├─ index.html
├─ assets/
│  ├─ css/styles.css
│  ├─ js/config.js         → ⭐ dirección de la API
│  ├─ js/respaldo.js       → copia local (generada, no editar)
│  ├─ js/app.js
│  ├─ cv.pdf
│  └─ img/
│     ├─ proyectos/        → capturas de los proyectos
│     ├─ empresas/         → logos de las empresas
│     └─ tecnologias/      → logos de las tecnologías
├─ herramientas/
│  └─ generar-respaldo.js  → regenera el respaldo desde la API
└─ .github/workflows/pages.yml
```

## Configuración

Todo lo ajustable está en `assets/js/config.js`:

```js
api: 'https://web-personal-backend-ado8.onrender.com/',
```

Si lo dejas vacío, la página funciona igual usando solo el respaldo local.

## Las imágenes

Los archivos viven **aquí**, en `assets/img/`; las rutas que apuntan a ellos viven en el JSON del backend, igual que `cv`. Son rutas relativas a esta página, no URLs de la API:

| Dónde se ve | Campo en el backend | Carpeta |
|---|---|---|
| Tarjeta y detalle de proyecto | `proyectos[].imagen` | `assets/img/proyectos/` |
| Timeline de experiencia | `experiencia[].logo` | `assets/img/empresas/` |
| Barras de habilidades | `habilidades[].items[].logo` | `assets/img/tecnologias/` |

Los tres campos son opcionales. Vacíos, cada sección cae en lo que ya hacía: el proyecto muestra su degradado con las iniciales, y la empresa o la tecnología quedan solo con su nombre.

Para añadir una: copia el archivo a la carpeta que toque y escribe su ruta en el JSON del backend.

Los logos se pintan sobre una base blanca redondeada. Vienen recortados sobre blanco, y sin esa base se verían como manchas claras en el tema oscuro; así se leen igual en los dos temas.

En la tarjeta la captura se recorta por abajo (`object-position: top`), porque lo que identifica una pantalla suele estar arriba. En el detalle se muestra entera, con el degradado del proyecto de fondo.

### Peso

Las capturas están a 900 px de ancho y los logos a 128 px de lado. Si añades más, redúcelas antes: una captura de 1350 px o un logo de 2300 px no se ven mejor a este tamaño, solo tardan más en cargar. Todas van con `loading="lazy"`.

## Contacto

Los datos que se ven en la sección (correo, redes, ubicación) los define la API en `perfil.contacto`, así que se cambian editando `api/datos/perfil.json` en el repositorio del backend. Cada entrada es:

```json
{ "etiqueta": "GitHub", "valor": "github.com/tuusuario", "icono": "GH", "url": "https://github.com/tuusuario" }
```

Sin `url` el dato se pinta como texto, no como enlace: sirve para cosas como la ubicación. Si la API no trae `perfil.contacto` —porque aún no la has desplegado— la página arma la lista con `email`, `telefono` y `redes`, que es como funcionaba antes.

### El formulario

Se manda a `POST /?ruta=contacto` y el backend guarda el mensaje en su archivo `mensajes.json`. La dirección sale sola de `api`; se puede cambiar en `config.js`:

```js
apiContacto: '',          // '' → deriva de `api`
                          // 'mailto' → abre el correo del visitante, sin servidor
                          // una URL → se manda ahí
```

Si el envío falla —API dormida, sin conexión, error del servidor— la página abre el cliente de correo del visitante con el mensaje ya redactado, así que no se pierde. Solo se muestra el error tal cual cuando el problema es del propio mensaje: datos inválidos o demasiados envíos seguidos.

El formulario lleva un campo oculto contra bots. No lo quites: el backend descarta los envíos que lo traigan lleno.

> Los mensajes se guardan en el disco del servicio, que en el plan gratuito de Render es efímero: se borra en cada despliegue y cada vez que el servicio despierta. El README del backend explica cómo conservarlos.

## Cómo aguanta que la API falle

La landing **nunca espera** a la API para pintar:

1. Muestra de inmediato lo mejor que tenga en local: la caché del navegador de una visita anterior, o el respaldo del repositorio.
2. En segundo plano pide a la API.
3. Si responde algo distinto, actualiza la pantalla y guarda la caché.

Esto importa porque el plan gratuito de Render duerme el servicio tras ~15 minutos sin uso, y despertarlo tarda cerca de un minuto. Sin esta estrategia, cada visitante que llegara "en frío" vería una página vacía todo ese rato.

| Situación | Qué ve el visitante |
|---|---|
| API responde | Contenido de la API |
| API caída, sin caché | Contenido del respaldo, portafolio completo |
| API caída, con caché | Lo último que devolvió la API |

## El respaldo

`assets/js/respaldo.js` es una copia del contenido de la API. Se genera, no se edita a mano:

```bash
node herramientas/generar-respaldo.js
```

Toma la URL de `config.js`, o puedes pasar otra:

```bash
node herramientas/generar-respaldo.js https://otra-api.onrender.com/
```

**Nunca sobrescribe el respaldo con algo peor de lo que ya hay.** Si la API no responde, devuelve datos incompletos o cero proyectos, conserva el archivo actual y termina sin error. Publicar un respaldo vacío dejaría el portafolio en blanco justo cuando la API está caída, que es cuando más se necesita.

Reintenta 3 veces con 90 segundos de espera cada una, porque el servicio puede estar despertando.

## Despliegue

1. Settings → Pages → **Source: GitHub Actions**.
2. Push a `main`.

La Action regenera el respaldo desde la API, comprueba que tenga contenido usable y publica. Si la API está dormida, se publica con el respaldo anterior y el despliegue no falla.

Para apuntar a otra API sin tocar el código, define la variable `API_URL` en Settings → Secrets and variables → Actions → **Variables**.

### Cuando cambies el contenido

El contenido se edita en el repositorio del backend. Después, para que la landing refleje el cambio en su respaldo, lanza el despliegue a mano: pestaña **Actions** → *Desplegar landing en GitHub Pages* → **Run workflow**.

No es urgente: la landing ya muestra lo que devuelve la API en vivo. El respaldo solo importa cuando la API no responde. Aun así hay un `cron` semanal que lo refresca solo los lunes.

## Probar en local

```bash
php -S localhost:8093 .
```

Cualquier servidor estático sirve; también `npx serve .`.
