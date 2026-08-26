/* ============================================================
   LANDING DEL PORTAFOLIO
   Se alimenta de la API; usa el respaldo local si no responde.
   El contenido se edita en api/datos/*.json, no aquí.
   ============================================================ */

const { createApp, ref, reactive, computed, onMounted, onBeforeUnmount, watch } = Vue;

const CLAVE_CACHE = 'portafolio-cache';

createApp({
  setup() {

    /* ============================================================
       ORIGEN DE LOS DATOS

       La página no espera a la API para pintar. El orden es:

         1. Pinta ya con lo mejor que tenga en local
            (caché del navegador, o el respaldo del repositorio).
         2. En segundo plano pide a la API.
         3. Si responde algo distinto, actualiza en vivo.

       Esto importa porque el plan gratuito de Render duerme el
       servicio tras ~15 min sin uso y despertarlo tarda cerca de
       un minuto. Sin esta estrategia, cada visitante que llegue
       "en frío" vería una pantalla vacía todo ese tiempo.
    ============================================================ */

    const cargarLocal = () => {
      if (CONFIG.usarCache) {
        try {
          const guardado = JSON.parse(localStorage.getItem(CLAVE_CACHE) || 'null');
          if (guardado && guardado.datos && Date.now() - guardado.fecha < CONFIG.cacheDuracion) {
            return { datos: guardado.datos, origen: 'cache' };
          }
        } catch (e) {
          // Caché corrupta: se ignora y se sigue con el respaldo.
        }
      }
      return { datos: RESPALDO, origen: 'respaldo' };
    };

    const inicial   = cargarLocal();
    const contenido = reactive(estructura(inicial.datos));
    const origen    = ref(inicial.origen);   // 'respaldo' | 'cache' | 'api'
    const errorApi  = ref('');

    /** Normaliza para que nunca falte una clave y la vista no reviente. */
    function estructura(d) {
      return {
        perfil: Object.assign({
          nombre: '', roles: [], disponibilidad: '', resumen: '', foto: '',
          fondoHero: '', cv: '', bio: [], datos: [], estadisticas: [],
          redes: [], email: '', telefono: '',
        }, d && d.perfil ? d.perfil : {}),
        proyectos:   Array.isArray(d?.proyectos)   ? d.proyectos   : [],
        habilidades: Array.isArray(d?.habilidades) ? d.habilidades : [],
        experiencia: Array.isArray(d?.experiencia) ? d.experiencia : [],
        educacion:   Array.isArray(d?.educacion)   ? d.educacion   : [],
      };
    }

    function aplicar(datos, nuevoOrigen) {
      Object.assign(contenido, estructura(datos));
      origen.value = nuevoOrigen;
      document.title = (contenido.perfil.nombre || 'Portafolio') + ' | Portafolio';
      reiniciarRoles();
    }

    async function consultarApi() {
      if (!CONFIG.api) return;   // sin API configurada, se queda con lo local

      const control = new AbortController();
      const reloj = setTimeout(() => control.abort(), CONFIG.timeout);

      try {
        const r = await fetch(CONFIG.api, { signal: control.signal, headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error('La API respondió ' + r.status);

        const j = await r.json();
        if (!j || j.ok === false || !j.datos) throw new Error(j?.error || 'Respuesta inesperada.');

        aplicar(j.datos, 'api');
        errorApi.value = '';

        if (CONFIG.usarCache) {
          try {
            localStorage.setItem(CLAVE_CACHE, JSON.stringify({ fecha: Date.now(), datos: j.datos }));
          } catch (e) {
            // Sin espacio o en modo privado: no es grave, seguimos.
          }
        }
      } catch (e) {
        // Nunca se rompe la página: ya hay contenido en pantalla.
        errorApi.value = e.name === 'AbortError'
          ? 'La API tardó demasiado en responder.'
          : e.message;
        console.warn('[portafolio] Usando contenido local:', errorApi.value);
      } finally {
        clearTimeout(reloj);
      }
    }

    /* ---------- Atajos a las secciones ---------- */
    const perfil      = computed(() => contenido.perfil);
    const proyectos   = computed(() => contenido.proyectos);
    const habilidades = computed(() => contenido.habilidades);
    const experiencia = computed(() => contenido.experiencia);
    const educacion   = computed(() => contenido.educacion);

    const anioActual = new Date().getFullYear();

    const secciones = [
      { id: 'inicio',      nombre: 'Inicio' },
      { id: 'sobre-mi',    nombre: 'Sobre mí' },
      { id: 'proyectos',   nombre: 'Proyectos' },
      { id: 'habilidades', nombre: 'Habilidades' },
      { id: 'experiencia', nombre: 'Experiencia' },
      { id: 'contacto',    nombre: 'Contacto' },
    ];

    // Iniciales sin acentos: un monograma se lee mejor como "LA" que "LÁ".
    const iniciales = computed(() =>
      (perfil.value.nombre || '?')
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .split(' ').filter(Boolean).slice(0, 2)
        .map(p => p[0].toUpperCase()).join('')
    );

    /* ---------- Tema ---------- */
    const tema = ref(document.documentElement.getAttribute('data-tema') || 'dark');

    const alternarTema = () => {
      tema.value = tema.value === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-tema', tema.value);
      localStorage.setItem('tema-portafolio', tema.value);
    };

    /* ---------- Navegación ---------- */
    const scrolled      = ref(false);
    const menuAbierto   = ref(false);
    const seccionActiva = ref('inicio');

    const irA = (id) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      menuAbierto.value = false;
    };

    const alHacerScroll = () => {
      scrolled.value = window.scrollY > 60;
      const y = window.scrollY + window.innerHeight / 3;
      for (let i = secciones.length - 1; i >= 0; i--) {
        const el = document.getElementById(secciones[i].id);
        if (el && el.offsetTop <= y) {
          seccionActiva.value = secciones[i].id;
          break;
        }
      }
    };

    /* ---------- Efecto de escritura ---------- */
    const rolActual = ref('');
    let tempTexto = null;

    const escribirRoles = () => {
      const roles = perfil.value.roles;
      if (!roles || !roles.length) { rolActual.value = ''; return; }

      let iRol = 0, iChar = 0, borrando = false;

      const paso = () => {
        const texto = roles[iRol % roles.length] || '';
        if (!borrando) {
          iChar++;
          rolActual.value = texto.slice(0, iChar);
          if (iChar >= texto.length) {
            borrando = true;
            tempTexto = setTimeout(paso, 1800);
            return;
          }
        } else {
          iChar--;
          rolActual.value = texto.slice(0, iChar);
          if (iChar <= 0) { borrando = false; iRol++; }
        }
        tempTexto = setTimeout(paso, borrando ? 40 : 80);
      };
      paso();
    };

    // Si la API trae otros roles, el efecto se reinicia con los nuevos.
    const reiniciarRoles = () => {
      clearTimeout(tempTexto);
      rolActual.value = '';
      escribirRoles();
    };

    /* ---------- Filtro de proyectos ---------- */
    const filtro = ref('todos');

    const tecnologias = computed(() => {
      const conteo = {};
      proyectos.value.forEach(p => {
        (p.tecnologias || []).forEach(t => { conteo[t] = (conteo[t] || 0) + 1; });
      });
      return Object.keys(conteo)
        .map(nombre => ({ nombre, total: conteo[nombre] }))
        .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre));
    });

    const proyectosFiltrados = computed(() => {
      const lista = filtro.value === 'todos'
        ? proyectos.value.slice()
        : proyectos.value.filter(p => (p.tecnologias || []).includes(filtro.value));
      return lista.sort((a, b) => (b.destacado - a.destacado) || ((b.anio || 0) - (a.anio || 0)));
    });

    // Si el filtro activo desaparece al llegar datos nuevos, se vuelve a "todos".
    watch(tecnologias, (lista) => {
      if (filtro.value !== 'todos' && !lista.some(t => t.nombre === filtro.value)) {
        filtro.value = 'todos';
      }
    });

    /* ---------- Modal ---------- */
    const proyectoActivo = ref(null);
    const abrirProyecto = (p) => { proyectoActivo.value = p; };

    watch(proyectoActivo, (v) => { document.body.style.overflow = v ? 'hidden' : ''; });

    const alPresionarTecla = (e) => {
      if (e.key === 'Escape') { proyectoActivo.value = null; menuAbierto.value = false; }
    };

    /* ---------- Contacto ---------- */

    /**
     * Los datos de contacto los define la API en perfil.contacto, así
     * que se cambian editando el JSON del backend, sin tocar esta página.
     *
     * Si ese campo no viene —una API vieja, o el respaldo generado antes
     * de añadirlo— se arma la lista con email, teléfono y redes, que es
     * como funcionaba antes. Así la sección nunca sale vacía.
     */
    const contactoDirecto = computed(() => {
      const p = perfil.value;

      const deLaApi = (p.contacto || []).filter(c => c && c.valor);
      if (deLaApi.length) {
        return deLaApi.map(c => ({
          etiqueta: c.etiqueta || '',
          valor:    c.valor,
          icono:    c.icono || '·',
          url:      c.url || '',
        }));
      }

      const items = [];
      if (p.email) items.push({ etiqueta: 'Email', valor: p.email, icono: '@', url: 'mailto:' + p.email });
      if (p.telefono) {
        items.push({ etiqueta: 'Teléfono', valor: p.telefono, icono: 'Tel',
                     url: 'tel:' + p.telefono.replace(/\s/g, '') });
      }
      (p.redes || []).filter(r => r.nombre !== 'Email').forEach(r => items.push({
        etiqueta: r.nombre,
        valor: (r.url || '').replace(/^https?:\/\/(www\.)?/, ''),
        icono: r.icono,
        url: r.url,
      }));
      return items;
    });

    // sitioWeb es la trampa anti-spam: está oculta por CSS, así que una
    // persona nunca la llena y un bot que rellena todo, sí.
    const formulario = reactive({ nombre: '', email: '', mensaje: '', sitioWeb: '' });
    const avisoForm  = ref('');
    const avisoOk    = ref(false);
    const enviando   = ref(false);

    const formularioValido = computed(() =>
      formulario.nombre.length > 1 &&
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formulario.email) &&
      formulario.mensaje.length > 9
    );

    /** A dónde se manda el formulario. Cadena vacía = usar el correo. */
    const urlContacto = () => {
      const elegida = (CONFIG.apiContacto || '').trim();
      if (elegida === 'mailto') return '';
      if (elegida) return elegida;
      if (!CONFIG.api) return '';
      return CONFIG.api.replace(/\/+$/, '') + '/?ruta=contacto';
    };

    /** Abre el correo del visitante con el mensaje ya redactado. */
    const abrirCorreo = () => {
      const destino = perfil.value.email;
      if (!destino) {
        avisoOk.value = false;
        avisoForm.value = 'No se pudo enviar el mensaje. Inténtalo más tarde.';
        return;
      }
      const asunto = encodeURIComponent('Contacto desde el portafolio - ' + formulario.nombre);
      const cuerpo = encodeURIComponent(
        formulario.mensaje + '\n\n---\n' + formulario.nombre + '\n' + formulario.email
      );
      window.location.href = 'mailto:' + destino + '?subject=' + asunto + '&body=' + cuerpo;
      avisoOk.value = true;
      avisoForm.value = 'Se abrió tu cliente de correo para enviar el mensaje.';
      limpiarFormulario();
    };

    const limpiarFormulario = () => {
      formulario.nombre = formulario.email = formulario.mensaje = '';
    };

    /**
     * Manda el mensaje a la API, que lo guarda en su archivo de mensajes.
     *
     * Si algo falla se cae al correo del visitante en lugar de dar un
     * error y punto: Render duerme el servicio del plan gratuito, y sería
     * absurdo perder un mensaje porque el servidor estaba despertando.
     */
    const enviarMensaje = async () => {
      if (enviando.value) return;

      if (!formularioValido.value) {
        avisoOk.value = false;
        avisoForm.value = 'Revisa los campos antes de enviar.';
        return;
      }

      const destino = urlContacto();
      if (!destino) {
        abrirCorreo();
        return;
      }

      enviando.value = true;
      avisoForm.value = '';

      const control = new AbortController();
      const reloj = setTimeout(() => control.abort(), CONFIG.timeoutContacto || 20000);

      try {
        const r = await fetch(destino, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre:    formulario.nombre,
            email:     formulario.email,
            mensaje:   formulario.mensaje,
            sitio_web: formulario.sitioWeb,
          }),
          signal: control.signal,
        });

        const cuerpo = await r.json().catch(() => ({}));

        // 422 y 429 hablan del mensaje en sí: datos inválidos o demasiados
        // envíos seguidos. Reenviarlo por correo no lo arreglaría, así que
        // se muestra el motivo tal cual.
        //
        // Cualquier otro fallo (ruta mal configurada, API caída, permisos)
        // es problema del servidor, no del visitante: ahí sí se cae al
        // correo, que es lo que salva el mensaje.
        if (r.status === 422 || r.status === 429) {
          avisoOk.value = false;
          avisoForm.value = cuerpo.error || 'Revisa los campos antes de enviar.';
          return;
        }
        if (!r.ok || cuerpo.ok === false) {
          throw new Error(cuerpo.error || 'La API respondió ' + r.status);
        }

        avisoOk.value = true;
        avisoForm.value = cuerpo.mensaje || 'Mensaje recibido. Gracias por escribir.';
        limpiarFormulario();

      } catch (e) {
        console.warn('[contacto] no se pudo guardar en la API:', e.message);
        abrirCorreo();
      } finally {
        clearTimeout(reloj);
        enviando.value = false;
      }
    };

    /* ---------- Aparición al hacer scroll ---------- */
    const activarReveal = () => {
      const objetivos = document.querySelectorAll('.reveal');
      if (!('IntersectionObserver' in window)) {
        objetivos.forEach(el => el.classList.add('is-visible'));
        return;
      }
      const obs = new IntersectionObserver((entradas) => {
        entradas.forEach(en => {
          if (en.isIntersecting) { en.target.classList.add('is-visible'); obs.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      objetivos.forEach(el => obs.observe(el));
    };

    /* ---------- Arranque ---------- */
    onMounted(() => {
      document.title = (perfil.value.nombre || 'Portafolio') + ' | Portafolio';
      escribirRoles();
      activarReveal();
      alHacerScroll();
      window.addEventListener('scroll', alHacerScroll, { passive: true });
      window.addEventListener('keydown', alPresionarTecla);

      // Sin await: la página ya está pintada, esto solo la actualiza.
      consultarApi();
    });

    onBeforeUnmount(() => {
      clearTimeout(tempTexto);
      window.removeEventListener('scroll', alHacerScroll);
      window.removeEventListener('keydown', alPresionarTecla);
    });

    return {
      perfil, proyectos, habilidades, experiencia, educacion,
      secciones, anioActual, iniciales, origen, errorApi,
      tema, alternarTema,
      scrolled, menuAbierto, seccionActiva, irA,
      rolActual,
      filtro, tecnologias, proyectosFiltrados,
      proyectoActivo, abrirProyecto,
      contactoDirecto, formulario, formularioValido, avisoForm, avisoOk, enviando, enviarMensaje,
    };
  },
}).mount('#app');
