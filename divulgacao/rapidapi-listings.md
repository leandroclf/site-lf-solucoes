# RapidAPI Listings — LF Soluções

Conteúdo pronto para publicar em rapidapi.com/provider.
Crie uma conta em rapidapi.com → "My APIs" → "Add New API" e use os textos abaixo.

---

## API 1 — WorldBank Risk Pricing API

### Basic Info
- **API Name:** WorldBank Risk Pricing API
- **Short Description:** Country risk scoring and automatic B2B pricing quotes using WorldBank data
- **Category:** Finance → Risk Management
- **Tags:** worldbank, risk, pricing, b2b, credit-score, country-risk

### Long Description (copie no campo "About"):
```
Automatically calculate country risk scores and generate B2B pricing quotes based on WorldBank economic indicators.

Built for companies that operate across multiple countries and need to adjust pricing, credit terms, or contract values based on sovereign risk.

**Key features:**
- Country risk score (0–100) based on WorldBank governance, economic, and financial indicators
- Automatic pricing bands (Conservative / Balanced / Aggressive) with risk-adjusted margins
- Batch processing for up to 50 countries in a single request
- Pricing quote with base price, risk multiplier, and recommended final price

**Use cases:**
- International B2B contract pricing
- Credit risk assessment for foreign clients
- Export pricing strategy
- Investment due diligence

**Data source:** World Bank Open Data (public, updated annually)
```

### Base URL
```
https://lf-worldbank-risk-pricing.onrender.com
```

### Endpoints para cadastrar no RapidAPI:

#### GET /health
- **Name:** Health Check
- **Description:** Check API availability
- **Required params:** none

#### GET /sample
- **Name:** Sample Data
- **Description:** Returns example risk score and pricing quote for Brazil
- **Required params:** none

#### GET /risk-score
- **Name:** Get Risk Score
- **Description:** Returns risk score (0–100) for a given country
- **Required params:**
  - `country_code` (string, query) — ISO 3166-1 alpha-2 code (e.g. BR, US, DE)

#### POST /pricing-quote
- **Name:** Generate Pricing Quote
- **Description:** Generates a risk-adjusted pricing quote
- **Required params:** none
- **Body (JSON):**
```json
{
  "country_code": "BR",
  "base_price": 10000,
  "currency": "BRL"
}
```

#### POST /batch
- **Name:** Batch Risk Scores
- **Description:** Returns risk scores for multiple countries at once
- **Body (JSON):**
```json
{
  "country_codes": ["BR", "US", "DE", "AR"]
}
```

#### GET /pricing-bands
- **Name:** Pricing Bands
- **Description:** Returns pricing band definitions (Conservative/Balanced/Aggressive)
- **Required params:** none

### Planos de preço (RapidAPI Pricing):

| Plan | Price | Requests/month | Features |
|---|---|---|---|
| **Free** | $0 | 500 | All endpoints, no SLA |
| **Basic** | $19/mo | 5,000 | All endpoints, email support |
| **Pro** | $49/mo | 25,000 | All endpoints, priority support, SLA 99.5% |
| **Enterprise** | $149/mo | Unlimited | Dedicated support, custom SLA, webhook alerts |

---

## API 2 — Wikidata Entity Graph API

### Basic Info
- **API Name:** Wikidata Entity Graph API
- **Short Description:** Semantic entity matching and enrichment using Wikidata knowledge graph
- **Category:** Data → Knowledge Graph
- **Tags:** wikidata, entity-matching, knowledge-graph, nlp, crm-enrichment, semantic

### Long Description:
```
Match, enrich, and link business entities using the Wikidata knowledge graph — the largest open structured database in the world.

Ideal for CRM deduplication, taxonomy building, and semantic normalization of company, person, and product names across systems.

**Key features:**
- Fuzzy entity matching with confidence score (0–1)
- Multi-language support (Portuguese, English, Spanish, and more)
- Entity type detection (company, person, location, product)
- Full enrichment pipeline: match → expand → link → output
- Pipeline metrics for batch processing quality assessment

**Use cases:**
- CRM/ERP data deduplication and normalization
- Supplier database enrichment
- Taxonomy and classification automation
- Master data management (MDM)
- Cross-system entity linking

**Data source:** Wikidata (wikimedia.org) — open knowledge graph with 100M+ items
```

### Base URL
```
https://lf-wikidata-entity-graph.onrender.com
```

### Endpoints:

#### GET /health
- **Name:** Health Check

#### GET /sample
- **Name:** Sample Entity Match
- **Description:** Example match for "Petrobras"

#### GET /metrics
- **Name:** Pipeline Metrics
- **Description:** Quality metrics for the last pipeline run

#### POST /match
- **Name:** Match Entity
- **Description:** Find the best Wikidata match for an entity name
- **Body (JSON):**
```json
{
  "name": "Petrobras",
  "type": "company",
  "language": "pt"
}
```
- **Response fields:** `entity_id`, `label`, `confidence`, `description`, `url`

#### POST /pipeline
- **Name:** Run Enrichment Pipeline
- **Description:** Full match → expand → link pipeline for a list of entities
- **Body (JSON):**
```json
{
  "entities": [
    {"name": "Embraer", "type": "company"},
    {"name": "Lula", "type": "person"},
    {"name": "São Paulo", "type": "location"}
  ],
  "language": "pt"
}
```

### Planos de preço:

| Plan | Price | Requests/month | Features |
|---|---|---|---|
| **Free** | $0 | 300 | All endpoints, community support |
| **Basic** | $29/mo | 3,000 | All endpoints, email support |
| **Pro** | $79/mo | 15,000 | Priority support, SLA 99.5% |
| **Enterprise** | $199/mo | Unlimited | Custom pipeline config, dedicated support |

---

## API 3 — OpenAlex Lead Enrichment API

### Basic Info
- **API Name:** OpenAlex Lead Enrichment API
- **Short Description:** B2B lead enrichment with academic and institutional data from OpenAlex
- **Category:** Marketing → Lead Generation
- **Tags:** lead-enrichment, openalex, b2b, prospecting, academic-data, data-enrichment

### Long Description:
```
Enrich your B2B leads with academic, institutional, and research data from OpenAlex — the world's largest open scholarly database with 250M+ records.

Discover which companies and institutions invest in R&D, their focus areas, publication output, and research maturity — powerful signals for B2B technology and innovation sales.

**Key features:**
- Lead value score (0–100) based on research activity and institutional profile
- Automatic lead prioritization by value score
- Batch enrichment for multiple leads at once
- Research domain classification (technology, health, agronomy, etc.)
- Publication count and citation impact as commercial signals

**Use cases:**
- Qualifying leads for technology and SaaS sales
- Identifying R&D-heavy companies for consulting proposals
- Prioritizing outreach for innovation-focused prospects
- Academic and government institution prospecting

**Data source:** OpenAlex (openalex.org) — open access scholarly database
```

### Base URL
```
https://lf-openalex-enrichment-mvp.onrender.com
```

### Endpoints:

#### GET /health
- **Name:** Health Check

#### GET /sample
- **Name:** Sample Enrichment
- **Description:** Example enrichment for USP (Universidade de São Paulo)

#### POST /enrich
- **Name:** Enrich Leads
- **Description:** Enrich a list of leads with OpenAlex data
- **Body (JSON):**
```json
{
  "leads": [
    {"name": "USP", "country": "BR"},
    {"name": "Embrapa", "country": "BR"},
    {"name": "INPE", "country": "BR"}
  ]
}
```

#### POST /value-score
- **Name:** Get Value Score
- **Description:** Calculate value score (0–100) for a single lead
- **Body (JSON):**
```json
{
  "name": "Fiocruz",
  "country": "BR"
}
```

#### POST /prioritize
- **Name:** Prioritize Leads
- **Description:** Returns ranked list of leads by value score
- **Body (JSON):**
```json
{
  "leads": [
    {"name": "UNICAMP", "country": "BR"},
    {"name": "ITA", "country": "BR"},
    {"name": "UFMG", "country": "BR"}
  ]
}
```

### Planos de preço:

| Plan | Price | Requests/month | Features |
|---|---|---|---|
| **Free** | $0 | 200 | All endpoints, community support |
| **Basic** | $24/mo | 2,000 | All endpoints, email support |
| **Pro** | $69/mo | 10,000 | Priority support, SLA 99.5% |
| **Enterprise** | $179/mo | Unlimited | Custom scoring model, dedicated support |

---

## Passos para publicar no RapidAPI

1. Acesse **rapidapi.com** → criar conta com Google/GitHub
2. Menu → **"My APIs"** → **"Add New API"**
3. Escolha **"I have an existing API"**
4. Cole a Base URL do backend Render
5. Preencha os campos usando os textos acima
6. Em **"Pricing"**, configure os 4 planos
7. Em **"Endpoints"**, adicione cada endpoint manualmente (ou importe o OpenAPI YAML de cada repo)
8. Clique **"Make Public"** para publicar no marketplace

**Dica:** importe diretamente o `docs/openapi.yaml` de cada repo para criar os endpoints automaticamente — mais rápido do que cadastrar um por um.

---

## Texto para o perfil de provider no RapidAPI

**Provider Name:** LF Soluções
**Bio:**
> B2B automation and data intelligence company from Brazil. We build open APIs for risk pricing, entity enrichment, and lead qualification — helping companies automate decisions with public data.

**Website:** https://lfsolucoes.etc.br
**Contact:** https://wa.me/5561992491132
