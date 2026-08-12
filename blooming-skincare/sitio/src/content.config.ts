import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const servicios = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/servicios' }),
  schema: z.object({
    titulo: z.string(),
    resumen: z.string(),
    /** Precio "desde" en MXN. 0 = se cotiza en valoración. */
    precio: z.number(),
    /** Precio anterior, para mostrar promoción vigente. */
    precioAntes: z.number().optional(),
    categoria: z.enum(['facial', 'laser', 'corporal', 'inyectable', 'bienestar']),
    /** Duración aproximada de la sesión, ej. "60 min" */
    duracion: z.string().optional(),
    /** Sesiones sugeridas, ej. "6 sesiones" */
    sesiones: z.string().optional(),
    imagen: z.string(),
    destacado: z.boolean().default(false),
    /** Marca los favoritos de las clientas */
    favorito: z.boolean().default(false),
    beneficios: z.array(z.string()).default([]),
    paraQuien: z.string().optional(),
    galeria: z.array(z.string()).default([]),
    /** Versión EN */
    tituloEn: z.string().optional(),
    resumenEn: z.string().optional(),
    parrafosEn: z.array(z.string()).default([]),
    beneficiosEn: z.array(z.string()).default([]),
    paraQuienEn: z.string().optional(),
  }),
});

export const collections = { servicios };
