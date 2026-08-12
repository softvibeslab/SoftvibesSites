## Context

The only verified sources are public Meta profile metadata and one historical seasonal Threads post. Instagram did not expose a browsable current catalog without authentication. The preview therefore demonstrates information architecture and visual direction, not current inventory or operational readiness.

## Goals / Non-Goals

**Goals:**
- Show a credible analysis-to-landing transformation grounded in public evidence.
- Reduce ordering uncertainty through occasion-first categories and a transparent process.
- Preserve Atelier Noisette's warm, botanical, handcrafted visual cues without reproducing a logo.
- Make every unknown or required client input explicit.

**Non-Goals:**
- Publish or deploy.
- Invent prices, location, response times, testimonials, availability, allergens, delivery terms, or contact channels.
- Collect leads, accept orders/payments, or track visitors.
- Claim public-source media is licensed or client-approved.

## Decisions

### 1. Static paired artifacts

The landing and analysis use semantic static HTML/CSS with minimal JavaScript. The analysis embeds the landing through a relative iframe and links to it directly.

### 2. Safe conversion fallback

Until an approved order URL exists, all order actions open the verified Instagram profile. Labels say “Consultar por Instagram,” not “Comprar” or “Pedido confirmado.”

### 3. Editorial brand interpretation

The visual system uses warm ivory, cocoa, muted rose, sage, serif display type, botanical line work, soft shadows, and tactile paper-like surfaces. It avoids copying either observed logo.

### 4. Evidence-aware media

Historic public images may appear as preview references with descriptive alt text. The footer and analysis identify them as public-source placeholders that must be replaced or approved before publication.

The expanded gallery uses four additional non-personal derivatives from the publicly visible Instagram feed: a plated sweet, two decorated cakes, and an occasion table detail. Candidate media containing identifiable people, personal photographs, prominent embedded copy, or unrelated savory dishes is retained only as research evidence and excluded from the customer-facing landing.

### 5. Honest product taxonomy

The landing presents broad occasions—celebrations, gifts, and seasonal editions—supported by the public positioning. It does not present specific current SKUs except as historical evidence inside the analysis.

## Risks / Trade-offs

- Public imagery may be mistaken for approved production media → label preview status and require replacement/approval.
- A larger gallery can imply a current catalog or exhaust mobile attention → use inspiration captions, constrain media height, and keep the grid scannable at 390 CSS pixels.
- A polished concept may imply operational readiness → expose missing catalog, contact, location, fulfillment, legal, and allergen inputs.
- Instagram fallback retains platform friction → use it only as a safe temporary destination; an approved order path is the next client input.
