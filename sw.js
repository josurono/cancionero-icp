/* ============================================================================
   sw.js — Service Worker · SOLO para movil.html (https://)
   ----------------------------------------------------------------------------
   Regla del proyecto: file:// → SIN service worker. https:// → CON service
   worker. index.html (proyección) corre local con doble clic y NUNCA registra
   esto; si lo hiciera, fallaría. movil.html está hospedado y sí lo usa: es lo
   que hace que el celular abra las letras sin señal.

   ─── SUBIR LA VERSIÓN EN CADA PUBLICACIÓN ───
   El bug número uno de las PWA es quedar pegado a una versión vieja cacheada.
   Cambiá CACHE en cada publicación (icp-v1 → icp-v2 → …). Al detectarlo, la
   página muestra "hay una versión nueva" y el usuario toca para actualizar.

   Estrategias:
     · datos/*.js  → NETWORK-FIRST. Una errata corregida tiene que llegar el
                     domingo siguiente, no dentro de un mes. Si no hay señal,
                     cae al cache.
     · el resto    → CACHE-FIRST. Es la app; cambia solo cuando sube CACHE.
   ========================================================================== */

const CACHE = 'icp-v9';

/* La app. No se precachea index.html: la proyección no se usa desde el celular. */
const APP = [
  './',                       // la raíz publicada redirige a movil.html
  './movil.html',
  './lib/nucleo.js',
  './manifest.webmanifest',
  './assets/icono.svg',
  './assets/icono-192.png',
  './assets/icono-512.png',
  './assets/icono-maskable-512.png'
];

const DATOS = [
  './datos/cancionero.js'
  // ,'./datos/himnario.js'   <- descomentar cuando exista el himnario
];

/* ── Instalación ──────────────────────────────────────────────────────────
   Se cachea de a uno y no con addAll(): addAll falla ENTERO si un solo
   archivo no está, y entonces no se instala nada. Un asset ausente no puede
   dejar sin service worker a toda la app. */
self.addEventListener('install', function(ev){
  ev.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(APP.concat(DATOS).map(function(u){
        return c.add(u).catch(function(e){
          console.warn('[sw] no se pudo precachear', u, e);
        });
      }));
    })
  );
});

/* ── Activación: limpiar caches viejos ──────────────────────────────────── */
self.addEventListener('activate', function(ev){
  ev.waitUntil(
    caches.keys().then(function(claves){
      return Promise.all(claves.map(function(k){
        return (k === CACHE) ? null : caches.delete(k);
      }));
    }).then(function(){
      return self.clients.claim();
    })
  );
});

function esDato(url){
  return url.pathname.indexOf('/datos/') !== -1;
}

self.addEventListener('fetch', function(ev){
  const req = ev.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch(e){ return; }
  if (url.origin !== self.location.origin) return;

  /* ── datos/*.js → red primero, cache de respaldo ──
     OJO con el 'no-store': un fetch() común puede resolverse contra el cache
     HTTP del navegador y devolver la versión vieja SIN tocar la red. Eso
     convierte a este "network-first" en cache-first disfrazado, que es
     exactamente el bug que se quiere evitar. Verificado: sin esto, una
     corrección publicada no llegaba. */
  if (esDato(url)){
    ev.respondWith(
      fetch(new Request(req.url, { cache:'no-store', credentials:'same-origin' })).then(function(res){
        if (res && res.ok){
          const copia = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copia); });
        }
        return res;
      }).catch(function(){
        return caches.match(req).then(function(m){
          return m || new Response('/* sin conexión y sin copia guardada */',
                                   { status: 503, headers: { 'Content-Type':'text/javascript' } });
        });
      })
    );
    return;
  }

  /* ── el resto → cache primero ── */
  ev.respondWith(
    caches.match(req).then(function(m){
      if (m) return m;
      return fetch(req).then(function(res){
        if (res && res.ok && res.type === 'basic'){
          const copia = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copia); });
        }
        return res;
      }).catch(function(){
        /* Navegación sin señal y sin copia: al menos devolver la app. */
        if (req.mode === 'navigate') return caches.match('./movil.html');
        return new Response('', { status: 503 });
      });
    })
  );
});

/* ── La página pide activar la versión nueva ──────────────────────────── */
self.addEventListener('message', function(ev){
  if (ev.data && ev.data.tipo === 'ACTUALIZAR') self.skipWaiting();
});
