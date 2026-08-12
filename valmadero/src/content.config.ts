import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const propiedades = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/propiedades' }),
  schema: z.object({
    titulo: z.string(),
    resumen: z.string(),
    precio: z.number().nonnegative(),
    moneda: z.enum(['MXN', 'USD', 'EUR']).default('MXN'),
    tipo: z.string(),
    zona: z.string(),
    ubicacion: z.string(),
    m2: z.number().positive().optional(),
    recamaras: z.number().nonnegative().optional(),
    banos: z.number().nonnegative().optional(),
    imagen: z.string(),
    destacada: z.boolean().default(false),
    demostracion: z.boolean().default(false),
    estatus: z.enum(['venta', 'preventa', 'entrega-inmediata', 'reservada']).default('venta'),
    caracteristicas: z.array(z.string()).default([]),
    formasPago: z.array(z.string()).default([]),
    fuente: z.url().optional(),
    fechaFuente: z.coerce.date().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    titulo: z.string(),
    descripcion: z.string(),
    fecha: z.coerce.date(),
    imagen: z.string().optional(),
    borrador: z.boolean().default(false),
  }),
});

export const collections = { propiedades, blog };
