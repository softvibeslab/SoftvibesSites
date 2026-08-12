import type {
  ArtifactType,
  LinkStatus,
  ProjectStatus,
} from "@/domain/crm";

export interface ProjectSeed {
  readonly id: string;
  readonly tenantId: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly status: ProjectStatus;
  readonly niche: string | null;
  readonly city: string | null;
  readonly stack: readonly string[];
  readonly localPath: string;
  readonly artifacts: readonly ArtifactSeed[];
}

export interface ArtifactSeed {
  readonly id: string;
  readonly type: ArtifactType;
  readonly label: string;
  readonly localPath: string | null;
  readonly publicUrl: string | null;
  readonly linkStatus: LinkStatus;
  readonly isCanonical: boolean;
  readonly notes?: string;
}

function artifact(
  id: string,
  type: ArtifactType,
  label: string,
  localPath: string | null,
  publicUrl: string | null = null,
  isCanonical = false,
): ArtifactSeed {
  return {
    id,
    type,
    label,
    localPath,
    publicUrl,
    linkStatus: publicUrl === null ? "protected" : "declared",
    isCanonical,
  };
}

export const inventorySeed: readonly ProjectSeed[] = [
  {
    id: "atelier-noisette",
    tenantId: "atelier-noisette",
    slug: "atelier-noisette",
    name: "Atelier Noisette",
    description: "Landing preview and evidence-backed commercial analysis.",
    status: "review",
    niche: "Artisanal bakery",
    city: null,
    stack: ["HTML", "CSS", "JavaScript"],
    localPath: "atelier-noisette",
    artifacts: [
      artifact("atelier-landing", "landing", "Landing", "atelier-noisette/site/index.html", null, true),
      artifact("atelier-analysis", "analysis", "Analysis", "atelier-noisette/site/analisis/index.html"),
    ],
  },
  {
    id: "colegios-875",
    tenantId: "colegios-875",
    slug: "colegios-875",
    name: "Colegios 875",
    description: "Commercial site, analysis, proposal, and voice-agent configuration.",
    status: "review",
    niche: "Education",
    city: null,
    stack: ["HTML", "JavaScript", "Vapi"],
    localPath: "colegios-875",
    artifacts: [
      artifact("colegios-landing", "landing", "Landing", "colegios-875/index.html", null, true),
      artifact("colegios-analysis", "analysis", "Analysis", "colegios-875/analisis/index.html"),
      artifact("colegios-proposal", "proposal", "Commercial proposal", "propuesta-colegios875/index.html"),
      artifact("colegios-analysis-source", "analysis", "Original analysis", "analisis-colegios875/index.html"),
    ],
  },
  {
    id: "fabiola-mvp",
    tenantId: "fabiola-mvp",
    slug: "fabiola-mvp",
    name: "Fabiola · Mujer Montaña",
    description: "Conversion site, analysis, application journey, links, and PHP CMS.",
    status: "live",
    niche: "Psychology and coaching",
    city: null,
    stack: ["HTML", "JavaScript", "PHP"],
    localPath: "fabiola-mvp",
    artifacts: [
      artifact("fabiola-landing", "landing", "Landing", "fabiola-mvp/index.html", "https://coral-cassowary-633853.hostingersite.com/", true),
      artifact("fabiola-analysis", "analysis", "Analysis", "fabiola-mvp/analisis/index.html", "https://coral-cassowary-633853.hostingersite.com/analisis/"),
      artifact("fabiola-links", "links", "Links page", "fabiola-mvp/links/index.html", "https://coral-cassowary-633853.hostingersite.com/links/"),
      artifact("fabiola-cms", "cms", "CMS", "fabiola-mvp/admin/index.php", "https://coral-cassowary-633853.hostingersite.com/admin/"),
      artifact("fabiola-analysis-source", "analysis", "Original analysis workspace", "analisis-fabiola/index.html"),
    ],
  },
  {
    id: "vivemar",
    tenantId: "vivemar",
    slug: "vivemar",
    name: "Vive Mar Real Estate",
    description: "Astro real-estate site with analysis, listings, links, CMS, and alternate implementation.",
    status: "live",
    niche: "Real estate",
    city: "Riviera Maya",
    stack: ["Astro", "TypeScript", "PHP"],
    localPath: "vivemar",
    artifacts: [
      artifact("vivemar-landing", "landing", "Landing", "vivemar/src/pages/index.astro", "https://darkgreen-sparrow-923810.hostingersite.com/", true),
      artifact("vivemar-analysis", "analysis", "Analysis", "vivemar/public/analisis/index.html", "https://darkgreen-sparrow-923810.hostingersite.com/analisis/"),
      artifact("vivemar-links", "links", "Links page", "vivemar/src/pages/links.astro", "https://darkgreen-sparrow-923810.hostingersite.com/links/"),
      artifact("vivemar-cms", "cms", "CMS", "vivemar/public/admin/index.php", "https://darkgreen-sparrow-923810.hostingersite.com/admin/"),
      artifact("vivemar-alt", "variant", "Alternate implementation", "vivemar-alt/src/pages/index.astro"),
      artifact("vivemar-redirect", "redirect", "Domain redirect", "redirect-vivemar/index.html"),
      artifact("vivemar-analysis-source", "analysis", "Original analysis workspace", "analisis-vivemar/index.html"),
    ],
  },
  {
    id: "karla-duarte",
    tenantId: "karla-duarte",
    slug: "karla-duarte",
    name: "Dra. Karla Duarte",
    description: "Medical landing, analysis, links, and content-management preview.",
    status: "live",
    niche: "Medical services",
    city: "Cancún",
    stack: ["HTML", "JavaScript", "PHP"],
    localPath: "karla-duarte-cirujana",
    artifacts: [
      artifact("karla-landing", "landing", "Landing", "karla-duarte-cirujana/sitio/index.html", "https://darkviolet-stingray-426574.hostingersite.com/", true),
      artifact("karla-analysis", "analysis", "Analysis", "karla-duarte-cirujana/sitio/analisis/index.html", "https://darkviolet-stingray-426574.hostingersite.com/analisis/"),
      artifact("karla-links", "links", "Links page", "karla-duarte-cirujana/sitio/links/index.html", "https://darkviolet-stingray-426574.hostingersite.com/links/"),
      artifact("karla-cms", "cms", "CMS", "karla-duarte-cirujana/sitio/cms/index.html"),
    ],
  },
  {
    id: "ioushua-barragan",
    tenantId: "ioushua-barragan",
    slug: "ioushua-barragan",
    name: "Ieoushua Barragán",
    description: "Music site, analysis, content-driven build, and Node CMS.",
    status: "live",
    niche: "Music",
    city: null,
    stack: ["HTML", "JavaScript", "Node.js"],
    localPath: "MusicSites/ioushua-barragan",
    artifacts: [
      artifact("ioushua-landing", "landing", "Landing", "MusicSites/ioushua-barragan/index.html", "https://plum-hyena-228473.hostingersite.com/", true),
      artifact("ioushua-analysis", "analysis", "Analysis", "MusicSites/ioushua-barragan/analisis/index.html", "https://plum-hyena-228473.hostingersite.com/analisis/"),
      artifact("ioushua-cms", "cms", "CMS", "MusicSites/ioushua-barragan/cms/admin.html", "https://plum-hyena-228473.hostingersite.com/admin/"),
      artifact("ioushua-variant", "variant", "Alternate culture direction", "MusicSites/ioushua-barragan/alt-cultura/index.html"),
    ],
  },
  {
    id: "diana-yoga-life",
    tenantId: "diana-yoga-life",
    slug: "diana-yoga-life",
    name: "Diana Yoga Life",
    description: "Landing and audiovisual content preview.",
    status: "landing",
    niche: "Yoga and wellness",
    city: null,
    stack: ["HTML", "JavaScript"],
    localPath: "diana-yoga-life",
    artifacts: [
      artifact("diana-landing", "landing", "Landing", "diana-yoga-life/index.html", null, true),
    ],
  },
  {
    id: "smooth-group",
    tenantId: "smooth-group",
    slug: "smooth-group",
    name: "Smooth Group",
    description: "Commercial landing preview.",
    status: "landing",
    niche: "Business services",
    city: null,
    stack: ["HTML", "JavaScript"],
    localPath: "smooth-group",
    artifacts: [
      artifact("smooth-landing", "landing", "Landing", "smooth-group/index.html", null, true),
    ],
  },
  {
    id: "mystic-nails-art",
    tenantId: "mystic-nails-art",
    slug: "mystic-nails-art",
    name: "Mystic Nails Art",
    description: "Nail-art landing and interactive analysis.",
    status: "live",
    niche: "Beauty services",
    city: "Playa del Carmen",
    stack: ["HTML", "CSS", "JavaScript"],
    localPath: "mystic-nails-art",
    artifacts: [
      artifact("mystic-landing", "landing", "Landing", "mystic-nails-art/sitio/index.html", "https://dimgrey-wasp-300371.hostingersite.com/", true),
      artifact("mystic-analysis", "analysis", "Analysis", "mystic-nails-art/analisis/index.html", "https://dimgrey-wasp-300371.hostingersite.com/analisis/"),
    ],
  },
  {
    id: "mario-villanueva",
    tenantId: "mario-villanueva",
    slug: "mario-villanueva",
    name: "Mario Villanueva",
    description: "Personal-brand landing, analysis, structured version, and live delivery.",
    status: "live",
    niche: "Sales education",
    city: null,
    stack: ["HTML", "CSS", "JavaScript"],
    localPath: "mario-villanueva",
    artifacts: [
      artifact("mario-landing", "landing", "Landing", "mario-villanueva/sitio/index.html", "https://peachpuff-hippopotamus-402186.hostingersite.com/", true),
      artifact("mario-analysis", "analysis", "Analysis", "mario-villanueva/sitio/analisis/index.html", "https://peachpuff-hippopotamus-402186.hostingersite.com/analisis/"),
      artifact("mario-links", "links", "Links page", "mario-villanueva/version-estructurada/sitio/links/index.html", "https://peachpuff-hippopotamus-402186.hostingersite.com/links/"),
      artifact("mario-variant", "variant", "Structured multipage version", "mario-villanueva/version-estructurada/sitio/index.html"),
    ],
  },
  {
    id: "blooming-skincare",
    tenantId: "blooming-skincare",
    slug: "blooming-skincare",
    name: "Blooming Skincare",
    description: "Bilingual Astro landing, analysis, service catalog, links, and CMS.",
    status: "live",
    niche: "Beauty and skincare",
    city: "Playa del Carmen",
    stack: ["Astro", "TypeScript", "PHP"],
    localPath: "blooming-skincare",
    artifacts: [
      artifact("blooming-landing", "landing", "Landing", "blooming-skincare/sitio/src/pages/index.astro", "https://royalblue-quail-326867.hostingersite.com/", true),
      artifact("blooming-analysis", "analysis", "Analysis", "blooming-skincare/sitio/public/analisis/index.html"),
      artifact("blooming-links", "links", "Links page", "blooming-skincare/sitio/src/pages/links.astro", "https://royalblue-quail-326867.hostingersite.com/links/"),
      artifact("blooming-cms", "cms", "CMS", "blooming-skincare/sitio/public/admin/index.php", "https://royalblue-quail-326867.hostingersite.com/admin/"),
    ],
  },
  {
    id: "frank-hernandez",
    tenantId: "frank-hernandez",
    slug: "frank-hernandez",
    name: "Frank Hernández",
    description: "Bilingual real-estate site, analysis, links, listings, and CMS.",
    status: "live",
    niche: "Real estate",
    city: "Riviera Maya",
    stack: ["Astro", "TypeScript", "PHP"],
    localPath: "frank-hernandez",
    artifacts: [
      artifact("frank-landing", "landing", "Landing", "frank-hernandez/sitio/src/pages/index.astro", "https://darkviolet-dolphin-929053.hostingersite.com/", true),
      artifact("frank-analysis", "analysis", "Analysis", "frank-hernandez/sitio/public/analisis/index.html", "https://darkviolet-dolphin-929053.hostingersite.com/analisis/"),
      artifact("frank-links", "links", "Links page", "frank-hernandez/sitio/src/pages/links.astro", "https://darkviolet-dolphin-929053.hostingersite.com/links/"),
      artifact("frank-cms", "cms", "CMS", "frank-hernandez/sitio/public/admin/index.php", "https://darkviolet-dolphin-929053.hostingersite.com/admin/"),
    ],
  },
  {
    id: "katya-varela",
    tenantId: "katya-varela",
    slug: "katya-varela",
    name: "Katya Varela",
    description: "Bilingual real-estate site, analysis, links, listings, and CMS.",
    status: "live",
    niche: "Real estate",
    city: "Riviera Maya",
    stack: ["Astro", "TypeScript", "PHP"],
    localPath: "katya-varela",
    artifacts: [
      artifact("katya-landing", "landing", "Landing", "katya-varela/sitio/src/pages/index.astro", "https://mediumaquamarine-elk-522949.hostingersite.com/", true),
      artifact("katya-analysis", "analysis", "Analysis", "katya-varela/sitio/public/analisis/index.html", "https://mediumaquamarine-elk-522949.hostingersite.com/analisis/"),
      artifact("katya-links", "links", "Links page", "katya-varela/sitio/src/pages/links.astro", "https://mediumaquamarine-elk-522949.hostingersite.com/links/"),
      artifact("katya-cms", "cms", "CMS", "katya-varela/sitio/public/admin/index.php", "https://mediumaquamarine-elk-522949.hostingersite.com/admin/"),
    ],
  },
  {
    id: "suemi-garcia",
    tenantId: "suemi-garcia",
    slug: "suemi-garcia",
    name: "Suemi García",
    description: "Bilingual real-estate site, analysis, links, listings, and CMS.",
    status: "live",
    niche: "Real estate",
    city: "Riviera Maya",
    stack: ["Astro", "TypeScript", "PHP"],
    localPath: "suemi-garcia",
    artifacts: [
      artifact("suemi-landing", "landing", "Landing", "suemi-garcia/sitio/src/pages/index.astro", "https://chocolate-newt-399168.hostingersite.com/", true),
      artifact("suemi-analysis", "analysis", "Analysis", "suemi-garcia/sitio/public/analisis/index.html", "https://chocolate-newt-399168.hostingersite.com/analisis/"),
      artifact("suemi-links", "links", "Links page", "suemi-garcia/sitio/src/pages/links.astro", "https://chocolate-newt-399168.hostingersite.com/links/"),
      artifact("suemi-cms", "cms", "CMS", "suemi-garcia/sitio/public/admin/index.php", "https://chocolate-newt-399168.hostingersite.com/admin/"),
    ],
  },
  {
    id: "caiman-tugurio",
    tenantId: "caiman-tugurio",
    slug: "caiman-tugurio",
    name: "Caimán Tugurio",
    description: "Digital menu and reservation landing.",
    status: "landing",
    niche: "Restaurant and bar",
    city: "Playa del Carmen",
    stack: ["HTML", "JavaScript"],
    localPath: "CaimanTugurio",
    artifacts: [
      artifact("caiman-landing", "landing", "Digital menu", "CaimanTugurio/index.html", null, true),
    ],
  },
  {
    id: "softvibes-funnel",
    tenantId: "softvibes",
    slug: "softvibes-funnel",
    name: "Softvibes Funnel",
    description: "Softvibes commercial funnel and lead-generation landing.",
    status: "landing",
    niche: "Digital services",
    city: null,
    stack: ["HTML", "JavaScript", "Google Sheets"],
    localPath: "softvibes-funnel",
    artifacts: [
      artifact("softvibes-funnel-landing", "landing", "Landing", "softvibes-funnel/site/index.html", null, true),
    ],
  },
];
