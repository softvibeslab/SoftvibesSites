import siteContent from '../../public/data/site-content.json';

export type Locale = 'es' | 'en';
export type LocalizedText = Record<Locale, string>;

export interface Property {
  id: string;
  title: string;
  location: string;
  status: LocalizedText;
  summary: LocalizedText;
  image: string;
  link: string;
}

export interface SiteContent {
  brand: {
    name: string;
    descriptor: LocalizedText;
    partner: string;
  };
  contact: {
    instagram: string;
    whatsapp: string;
    email: string;
  };
  hero: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    summary: LocalizedText;
    primaryCta: LocalizedText;
    secondaryCta: LocalizedText;
  };
  about: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    body: LocalizedText;
    note: LocalizedText;
  };
  propertiesIntro: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    summary: LocalizedText;
  };
  properties: Property[];
  seo: {
    title: LocalizedText;
    description: LocalizedText;
  };
}

export const content = siteContent as SiteContent;

export function localize(value: LocalizedText, locale: Locale): string {
  return value[locale] || value.es;
}
