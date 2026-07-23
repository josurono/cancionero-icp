/* ============================================================================
   datos/himnario.js — ARTEFACTO GENERADO. No editar a mano.
   ----------------------------------------------------------------------------
   Segunda coleccion, numeracion propia. Ojo: el numero 15 existe en las dos
   colecciones a proposito — asi la Fase 2 puede probar el determinismo de
   c15 / h15 (§8 del spec).

   Textos de dominio publico.
   ========================================================================== */

const HIMNARIO = {
  coleccion: "Himnario",
  prefijo: "h",
  items: [

    {
      /* Mismo numero que el Cancionero 15: colision deliberada. */
      numero: 15,
      tipo: "cancion",
      titulo: "Santo, Santo, Santo",
      autor: "Reginald Heber (1826), trad. Juan B. Cabrera",
      tonalidad: "",
      referencia: "Apocalipsis 4:8",
      etiquetas: [],
      bloques: [
        { tipo: "estrofa", lineas: [
          "¡Santo! ¡Santo! ¡Santo! Señor omnipotente,",
          "siempre el labio mío loores te dará;",
          "¡Santo! ¡Santo! ¡Santo! te adoro reverente,",
          "Dios en tres Personas, bendita Trinidad."
        ]},
        { tipo: "estrofa", lineas: [
          "¡Santo! ¡Santo! ¡Santo! en numeroso coro,",
          "santos escogidos te adoran sin cesar,",
          "de alegría llenos y sus coronas de oro",
          "rinden ante el trono y el cristalino mar."
        ]},
        { tipo: "estrofa", lineas: [
          "¡Santo! ¡Santo! ¡Santo! por más que estés velado,",
          "e imposible sea tu gloria contemplar,",
          "santo tú eres solo y nada hay a tu lado",
          "en poder perfecto, pureza y caridad."
        ]}
      ]
    },

    {
      numero: 118,
      tipo: "cancion",
      titulo: "Roca De La Eternidad",
      autor: "Augustus Toplady (1763)",
      tonalidad: "",
      referencia: "",
      etiquetas: [],
      bloques: [
        { tipo: "estrofa", lineas: [
          "Roca de la eternidad,",
          "fuiste abierta tú por mí;",
          "sé mi escondedero fiel,",
          "sólo encuentro paz en ti."
        ]},
        { tipo: "coro", lineas: [
          "Rico, limpio manantial,",
          "en el cual lavado fui."
        ]},
        { tipo: "estrofa", lineas: [
          "Aunque sea siempre fiel,",
          "aunque llore sin cesar,",
          "del pecado no podré",
          "justificación lograr."
        ]},
        { tipo: "coro", lineas: [
          "Rico, limpio manantial,",
          "en el cual lavado fui."
        ]}
      ]
    },

    {
      numero: 300,
      tipo: "cancion",
      titulo: "Cariñoso Salvador",
      autor: "Charles Wesley (1740)",
      tonalidad: "",
      referencia: "",
      etiquetas: [],
      bloques: [
        { tipo: "estrofa", lineas: [
          "Cariñoso Salvador,",
          "huyo de la tempestad",
          "a tu seno protector,",
          "fiándome de tu bondad."
        ]},
        { tipo: "estrofa", lineas: [
          "Sálvame, Señor Jesús,",
          "de las olas del turbión;",
          "hasta el puerto de salud",
          "guía tú mi embarcación."
        ]}
      ]
    }

  ]
};
