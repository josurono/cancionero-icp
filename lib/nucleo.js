/* ============================================================================
   lib/nucleo.js — LÓGICA COMPARTIDA entre index.html (proyección) y
   movil.html (lectura). Una sola implementación: si estuviera embebida en las
   dos vistas, divergirían y un bug de acentos se arreglaría en una sola.

   Script clásico, sin módulos ni fetch: se carga con <script src="..."> y
   funciona igual en file:// (proyección) y en https:// (móvil).

   Contiene:
     · normalizar()  — sin acentos, sin mayúsculas
     · repartir()    — reparto de líneas sin huérfanas
     · compilar()    — bloques → deck plano de diapositivas
     · Catalogo      — colecciones + búsqueda + determinismo entre colecciones
   ========================================================================== */

var NUCLEO = (function(){
'use strict';

const VERSION = '2.0';

/* ────────────────────────────────────────────────────────────────────────
   ORDEN ENTRE COLECCIONES — protege la memoria muscular del operador
   Se define por PREFIJO, a propósito: no depende del orden de los <script>,
   ni de qué archivo parseó primero, ni de la posición en el array. Si el 15
   existe en las dos colecciones, Enter proyecta el Cancionero. Siempre, en
   cualquier máquina. Un número menor gana.
   ──────────────────────────────────────────────────────────────────────── */
const PRIORIDAD = { c: 1, h: 2 };

function prioridad(prefijo){
  const p = PRIORIDAD[String(prefijo || '').toLowerCase()];
  return (p === undefined) ? 99 : p;
}

/* ────────────────────────────────────────────────────────────────────────
   NORMALIZACIÓN
   Se aplica a la consulta Y al contenido, con la misma función, para que no
   puedan divergir. Nadie va a escribir "cuán" con tilde en vivo.
   ──────────────────────────────────────────────────────────────────────── */
/* Rango de marcas combinantes que genera NFD (U+0300 a U+036F).
   Se arma con fromCharCode a proposito: un caracter combinante suelto escrito
   literal en el fuente es INVISIBLE en cualquier editor y se rompe con solo
   reencodear el archivo. Asi esta linea queda en ASCII puro y se entiende. */
var RE_DIACRITICOS = new RegExp(
  '[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36F) + ']', 'g'
);

function normalizar(s){
  return String(s === null || s === undefined ? '' : s)
    .normalize('NFD')
    .replace(RE_DIACRITICOS, '')
    .toLowerCase()
    .trim();
}

/* ────────────────────────────────────────────────────────────────────────
   REPARTO DE LÍNEAS — nunca huérfanas
   5→3+2, 6→3+3, 7→4+3, 10→4+3+3. Determinista: no mira la pantalla.
   ──────────────────────────────────────────────────────────────────────── */
function repartir(n, max){
  if (n <= 0) return [];
  if (n <= max) return [n];
  const k = Math.ceil(n / max);
  const base = Math.floor(n / k);
  const resto = n % k;
  const out = [];
  for (let i = 0; i < k; i++) out.push(base + (i < resto ? 1 : 0));
  return out;                                  // las más llenas primero
}

/* ────────────────────────────────────────────────────────────────────────
   COMPILADOR: bloques → deck plano
   La vista móvil NO usa esto (muestra el bloque entero), pero vive acá
   porque el reparto tiene que ser el mismo si algún día se sincronizan.
   ──────────────────────────────────────────────────────────────────────── */
function lineasLimpias(bloque){
  return (bloque.lineas || [])
    .map(function(l){ return String(l).trim(); })
    .filter(function(l){ return l !== ''; });
}

function compilar(item, col, maxLineas){
  const max = maxLineas || 4;
  const clave = col.prefijo + item.numero;
  const deck = [];
  (item.bloques || []).forEach(function(bloque, bi){
    const lineas = lineasLimpias(bloque);
    if (!lineas.length) return;                // bloque vacío: se ignora
    const trozos = repartir(lineas.length, max);
    let off = 0;
    trozos.forEach(function(cant, si){
      deck.push({
        slideId   : clave + ':' + bi + ':' + si,
        cancion   : clave,
        titulo    : item.titulo || '(sin título)',
        numero    : item.numero,
        coleccion : col.coleccion,
        tipoBloque: bloque.tipo || 'estrofa',
        lineas    : lineas.slice(off, off + cant),
        parte     : si + 1,
        partes    : trozos.length,
        inicioCancion : (bi === 0 && si === 0)
      });
      off += cant;
    });
  });
  return deck;
}

/* ────────────────────────────────────────────────────────────────────────
   BLOQUES PARA LEER — movil.html y herramientas/pdf.html
   Los datos traen los coros EXPANDIDOS en orden de ejecución, porque la
   proyección los necesita así. Para leer se colapsan: el coro se imprime una
   vez y cada repetición queda como "al coro", igual que un cancionero de
   papel. Vive acá y no en las vistas para que el celular y el PDF no puedan
   divergir.
   Devuelve [{clase, etiqueta, lineas}] con clase: estrofa | coro | alcoro | otro
   ──────────────────────────────────────────────────────────────────────── */
function paraLectura(item){
  const bloques = (item && item.bloques) ? item.bloques : [];

  const distintos = [];
  bloques.forEach(function(b){
    if ((b.tipo || '') !== 'coro') return;
    const f = lineasLimpias(b).join('\n');
    if (f && distintos.indexOf(f) === -1) distintos.push(f);
  });
  const varios = distintos.length > 1;

  const vistos = {};
  const salida = [];
  let nEstrofa = 0;

  bloques.forEach(function(b){
    const lineas = lineasLimpias(b);
    if (!lineas.length) return;                 // bloque vacío: se ignora
    const tipo = b.tipo || 'estrofa';

    if (tipo === 'coro'){
      const f = lineas.join('\n');
      const n = distintos.indexOf(f) + 1;
      if (vistos[f]){
        salida.push({ clase:'alcoro', etiqueta: varios ? ('al coro ' + n) : 'al coro', lineas: [] });
      } else {
        vistos[f] = true;
        salida.push({ clase:'coro', etiqueta: varios ? ('Coro ' + n) : 'Coro', lineas: lineas });
      }
      return;
    }
    if (tipo === 'estrofa'){
      nEstrofa++;
      salida.push({ clase:'estrofa', etiqueta:'Estrofa ' + nEstrofa, lineas: lineas });
    } else {
      salida.push({ clase:'otro',
                    etiqueta: tipo.charAt(0).toUpperCase() + tipo.slice(1),
                    lineas: lineas });
    }
  });
  return salida;
}

/* ────────────────────────────────────────────────────────────────────────
   ÍNDICE DE BÚSQUEDA POR ÍTEM
   No hay índice global ni librería: con ~300 ítems el scan lineal es
   instantáneo. Lo único que se cachea es el texto normalizado de cada ítem,
   para no rehacer el NFD en cada tecla.
   ──────────────────────────────────────────────────────────────────────── */
function buscable(item){
  if (item.__buscable) return item.__buscable;
  const lineas = [];
  (item.bloques || []).forEach(function(b){
    lineasLimpias(b).forEach(function(l){ lineas.push(l); });
  });
  const b = {
    titulo     : normalizar(item.titulo),
    lineas     : lineas,
    lineasNorm : lineas.map(normalizar)
  };
  b.todo = b.titulo + ' \n ' + b.lineasNorm.join(' \n ');
  try {
    Object.defineProperty(item, '__buscable', { value: b, enumerable: false });
  } catch(e){ item.__buscable = b; }
  return b;
}

/* ────────────────────────────────────────────────────────────────────────
   CATÁLOGO
   ──────────────────────────────────────────────────────────────────────── */
function Catalogo(){
  this.colecciones = [];
  this.avisos = [];          // colecciones que no cargaron (carga defensiva)
}

/* Devuelve true si la colección era válida y quedó registrada. */
Catalogo.prototype.agregar = function(nombre, archivo, col){
  if (!col || !Array.isArray(col.items) || !col.prefijo){
    this.avisos.push({ nombre: nombre, archivo: archivo, motivo: 'danado' });
    return false;
  }
  col.__prioridad = prioridad(col.prefijo);
  this.colecciones.push(col);
  this.colecciones.sort(function(a,b){ return a.__prioridad - b.__prioridad; });
  return true;
};

Catalogo.prototype.registrarFallo = function(nombre, archivo){
  this.avisos.push({ nombre: nombre, archivo: archivo, motivo: 'falta' });
};

/* Nombres de las colecciones que sí cargaron — para decirle al operador
   sobre qué está buscando cuando alguna falló. */
Catalogo.prototype.nombres = function(){
  return this.colecciones.map(function(c){ return c.coleccion; });
};

Catalogo.prototype.vacio = function(){ return this.colecciones.length === 0; };

Catalogo.prototype.porPrefijo = function(pref){
  const p = normalizar(pref);
  for (let i = 0; i < this.colecciones.length; i++){
    if (normalizar(this.colecciones[i].prefijo) === p) return this.colecciones[i];
  }
  return null;
};

function itemPorNumero(col, num){
  for (let i = 0; i < col.items.length; i++){
    if (String(col.items[i].numero) === String(num)) return col.items[i];
  }
  return null;
}

/* Todas las colecciones que tienen ese número, YA ORDENADAS por prioridad.
   Acá vive el determinismo c15/h15. */
Catalogo.prototype.porNumero = function(num){
  const out = [];
  this.colecciones.forEach(function(col){
    const it = itemPorNumero(col, num);
    if (it) out.push(resultado(col, it));
  });
  return out;
};

/* Búsqueda por código exacto: "c15". La usa la API de consola y el Enter. */
Catalogo.prototype.porCodigo = function(clave){
  const m = String(clave || '').trim().match(/^([a-zA-Zñ]+)\s*(\d+)$/);
  if (!m) return null;
  const col = this.porPrefijo(m[1]);
  if (!col) return null;
  const it = itemPorNumero(col, m[2]);
  return it ? resultado(col, it) : null;
};

function resultado(col, item, contexto){
  return {
    clave     : col.prefijo + item.numero,
    numero    : item.numero,
    titulo    : item.titulo || '(sin título)',
    coleccion : col.coleccion,
    prefijo   : col.prefijo,
    item      : item,
    col       : col,
    contexto  : contexto || null
  };
}

/* Agrupa una lista plana de resultados por colección, respetando el orden
   de prioridad. Devuelve {grupos, planos} donde `planos` está en el MISMO
   orden visual que los grupos: así ↑/↓ y lo que se ve no se desincronizan. */
function agrupar(lista){
  const porCol = [];
  lista.forEach(function(r){
    let g = null;
    for (let i = 0; i < porCol.length; i++){
      if (porCol[i].prefijo === r.prefijo){ g = porCol[i]; break; }
    }
    if (!g){
      g = { coleccion: r.coleccion, prefijo: r.prefijo,
            orden: prioridad(r.prefijo), resultados: [] };
      porCol.push(g);
    }
    g.resultados.push(r);
  });
  porCol.sort(function(a,b){ return a.orden - b.orden; });
  const planos = [];
  porCol.forEach(function(g){
    g.resultados.forEach(function(r){ planos.push(r); });
  });
  return { grupos: porCol, planos: planos };
}

/* ────────────────────────────────────────────────────────────────────────
   BUSCAR — el corazón de la Fase 2
   Devuelve siempre un objeto con forma estable. Nunca null, nunca vacío
   silencioso: si no hay resultados, viene `mensaje` con el motivo.
   ──────────────────────────────────────────────────────────────────────── */
Catalogo.prototype.buscar = function(consulta){
  const bruta = String(consulta || '').trim();
  const r = {
    consulta : bruta,
    tipo     : 'vacia',      // 'vacia' | 'codigo' | 'numero' | 'texto'
    grupos   : [],
    planos   : [],
    ambiguo  : false,        // el número existe en más de una colección
    eleccion : null,         // qué se proyecta con Enter (determinismo)
    alterna  : [],           // las otras colecciones con ese mismo número
    mensaje  : null
  };
  if (!bruta) return r;

  /* ── 1. Código directo: c15 · h300 · "c 15" ──────────────────────────── */
  let m = bruta.match(/^([a-zA-Zñ]+)\s*(\d+)$/);
  if (m){
    r.tipo = 'codigo';
    const col = this.porPrefijo(m[1]);
    const num = m[2];
    if (!col){
      const disp = this.colecciones.map(function(c){ return c.prefijo + num; }).join(' o ');
      r.mensaje = 'No existe la colección «' + m[1] + '».' +
                  (disp ? ' Probá ' + disp + '.' : '');
      return r;
    }
    const it = itemPorNumero(col, num);
    if (!it){
      r.mensaje = 'No existe ' + normalizar(m[1]) + num + ' en ' + col.coleccion + '.';
      return r;
    }
    /* El operador fue explícito: se respeta su elección aunque el número
       exista en la otra colección. Igual mostramos la alternativa, para que
       Tab tenga a dónde ir. */
    const pedido = resultado(col, it);
    const otros = this.porNumero(num).filter(function(x){ return x.prefijo !== col.prefijo; });
    const g = agrupar([pedido].concat(otros));
    r.grupos = g.grupos; r.planos = g.planos;
    r.eleccion = pedido;
    r.alterna = otros;
    return r;
  }

  /* ── 2. Número pelado: 15 → las dos colecciones, agrupadas ───────────── */
  if (/^\d+$/.test(bruta)){
    r.tipo = 'numero';
    const encontrados = this.porNumero(bruta);     // ya vienen por prioridad
    if (!encontrados.length){
      r.mensaje = 'No existe el número ' + bruta + ' en ' +
                  (this.colecciones.length === 1
                    ? 'el ' + this.colecciones[0].coleccion + '.'
                    : 'ninguna colección.');
      return r;
    }
    const g = agrupar(encontrados);
    r.grupos = g.grupos; r.planos = g.planos;
    r.eleccion = g.planos[0];                      // ← determinismo: prioridad, no azar
    r.ambiguo = encontrados.length > 1;
    r.alterna = encontrados.slice(1);
    return r;
  }

  /* ── 3. Texto libre: título Y letra ──────────────────────────────────── */
  r.tipo = 'texto';
  const toks = normalizar(bruta).split(/\s+/).filter(Boolean);
  if (!toks.length) return r;

  const hallados = [];
  this.colecciones.forEach(function(col){
    col.items.forEach(function(item){
      const b = buscable(item);
      /* Todas las palabras tienen que aparecer (AND): "cuan gran" encuentra
         "Cuán Grande", pero "cuan xyz" no encuentra nada. */
      for (let i = 0; i < toks.length; i++){
        if (b.todo.indexOf(toks[i]) === -1) return;
      }
      const enTitulo = toks.every(function(t){ return b.titulo.indexOf(t) !== -1; });
      let contexto = null;
      if (!enTitulo){
        for (let j = 0; j < b.lineasNorm.length; j++){
          if (b.lineasNorm[j].indexOf(toks[0]) !== -1){ contexto = b.lineas[j]; break; }
        }
      }
      const res = resultado(col, item, contexto);
      res.__puntaje = enTitulo ? 0 : 1;            // título antes que letra
      hallados.push(res);
    });
  });

  if (!hallados.length){
    r.mensaje = 'Sin resultados para «' + bruta + '».';
    return r;
  }

  hallados.sort(function(a,b){
    if (a.__puntaje !== b.__puntaje) return a.__puntaje - b.__puntaje;
    const pa = prioridad(a.prefijo), pb = prioridad(b.prefijo);
    if (pa !== pb) return pa - pb;
    return Number(a.numero) - Number(b.numero);
  });

  const g = agrupar(hallados);
  r.grupos = g.grupos; r.planos = g.planos;
  r.eleccion = g.planos[0];
  return r;
};

/* ──────────────────────────────────────────────────────────────────────── */
return {
  VERSION    : VERSION,
  PRIORIDAD  : PRIORIDAD,
  normalizar : normalizar,
  repartir   : repartir,
  compilar   : compilar,      // proyección: bloques → diapositivas
  paraLectura: paraLectura,   // lectura: coros colapsados con "al coro"
  buscable   : buscable,
  Catalogo   : Catalogo
};

})();
