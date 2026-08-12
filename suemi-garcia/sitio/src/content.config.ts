import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const propiedades = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/propiedades' }),
  schema: z.object({
    titulo: z.string(),
    resumen: z.string(),
    precio: z.number(),
    moneda: z.enum(['MXN', 'USD']).default('MXN'),
    tipo: z.enum(['departamento', 'penthouse', 'casa', 'lote']),
    zona: z.enum(['playa-del-carmen', 'cancun', 'tulum']),
    ubicacion: z.string(),
    m2: z.number(),
    recamaras: z.number().optional(),
    banos: z.number().optional(),
    imagen: z.string(),
    destacada: z.boolean().default(false),
    ejemplo: z.boolean().default(false),
    estatus: z.enum(['venta', 'preventa', 'entrega-inmediata', 'oportunidad']).default('venta'),
    frenteAlMar: z.boolean().default(false),
    /** Unidades disponibles (urgencia verificable). Omitir si no se sabe. */
    unidades: z.number().optional(),
    /** Nota de rendimiento/renta estimada, ej. "8–12% anual estimado en renta" */
    roiEstimado: z.string().optional(),
    caracteristicas: z.array(z.string()).default([]),
    formasPago: z.array(z.string()).default([]),
    /** Versión EN de la ficha (para /en/). Si falta, la ficha no aparece en inglés. */
    tituloEn: z.string().optional(),
    resumenEn: z.string().optional(),
    parrafosEn: z.array(z.string()).default([]),
    caracteristicasEn: z.array(z.string()).default([]),
    formasPagoEn: z.array(z.string()).default([]),
    roiEstimadoEn: z.string().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    titulo: z.string(),
    descripcion: z.string(),
    fecha: z.coerce.date(),
    imagen: z.string().optional(),
  }),
});

export const collections = { propiedades, blog };
