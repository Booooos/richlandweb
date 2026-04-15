# AGENTS.md

## Project purpose
This repository contains the new RichLand Ltd. website project.

The site is a static B2B export product website for electric fans and related home appliances.

RichLand / Huatian is a manufacturer-based export business, not a consumer retail brand, not a startup SaaS company, and not a portfolio-style design project.

The design direction should reference:
- Panasonic North America for homepage structure and corporate website rhythm
- Hunter Fan for fan-category presentation and homepage product logic

Do not copy either site directly.
Only borrow:
- information architecture
- section rhythm
- category logic
- visual hierarchy

---

## Company background
RichLand represents Huatian Home Appliance Factory, based in Shunde, Foshan, Guangdong, China.

The company is a professional manufacturer with around 25 years of factory experience, focused primarily on electric fan production, while also supporting related appliance lines such as:
- induction cookers
- electric pressure cookers
- electric heaters
- air treatment / air-cleaning related products

The factory has approximately 30,000 square meters of self-owned factory space and an integrated production chain covering:
- plastics
- molds
- electronics
- motors
- metal parts
- assembly
- development
- inspection

Core fan product lines include:
- pedestal fans
- table fans
- wall fans
- desk-pedestal fans
- box / louver-style fans
- industrial / high-power fans

Common fan size ranges include:
- 250mm
- 300mm
- 350mm
- 400mm
- 450mm
- 500mm

The business should be presented as:
- factory-based
- export-oriented
- practical
- reliable
- quality-focused
- capable of OEM / ODM support
- able to support different regional market requirements

Do not frame the company as a trendy lifestyle brand or a flashy direct-to-consumer brand.

---

## Brand and content tone
The tone should feel:
- professional
- export-oriented
- trustworthy
- calm
- clear
- manufacturer-based
- practical rather than exaggerated

Preferred messaging themes:
- stable manufacturing capability
- broad product range
- integrated factory support
- OEM / ODM cooperation
- reliable export service
- practical communication and inquiry conversion
- long-term cooperation
- competitive value with dependable quality

Avoid wording that feels:
- overly promotional
- old-fashioned trade-fair slogan style
- startup-like
- vague and generic
- too decorative or emotional

Avoid overusing phrases such as:
- best in the world
- revolutionary
- cutting-edge leader
- unbeatable
- perfect solution

Do not write in a boastful or inflated style.
Prefer grounded B2B language.

---

## Working style
This is an iterative refinement project, not a full rebuild from scratch.

Make focused, reviewable changes.
Do not change unrelated sections unless explicitly requested.

If a task says:
- analyze only → do not modify code
- change homepage structure only → do not redesign everything
- change hero only → do not modify product sections

---

## Tech constraints
- Static website only
- Main file: `index.html`
- Images should live under `assets/`
- Do not introduce frameworks unless explicitly requested
- Keep implementation lightweight

Additional maintainability preference:
- keep configuration in dedicated files when appropriate
- keep product/catalog data separate from page markup when appropriate
- avoid scattering reusable logic across many inline scripts

---

## Design goals
The website should feel:
- clean
- modern
- calm
- trustworthy
- premium but restrained
- B2B-oriented

It should look like a real export manufacturer website, not a concept landing page.

Avoid:
- flashy consumer-style layouts
- clutter
- random experimentation
- overly decorative effects
- SaaS dashboard aesthetics
- portfolio-style art direction
- excessive animation

---

## Homepage direction
Use a Panasonic-style homepage structure:
- ordered sections
- clear hierarchy
- corporate credibility
- balanced spacing

Use a Hunter Fan-style product logic:
- fan categories should be easy to scan
- product groupings should feel intentional
- homepage should guide users into product types clearly

Homepage priorities:
- make fan categories the main business focus
- keep related appliance lines visible but secondary
- support inquiry conversion clearly
- preserve practical factory/export information

---

## Product and business priorities
Primary business focus:
- electric fans and fan-related categories

Secondary product lines:
- induction cookers
- electric pressure cookers
- electric heaters
- air treatment related products

When presenting products:
- prioritize fan categories visually and structurally
- keep related appliance lines as supporting categories, not the main homepage story
- keep product browsing clear and practical for importers, distributors, and wholesale buyers

---

## Content rules
Preserve important business information unless explicitly told otherwise:
- company name
- OEM / ODM
- MOQ
- lead time
- contact details
- manufacturer identity
- export-oriented positioning

Do not invent:
- certifications
- product specs
- technical claims
- compliance claims
- legal/export approvals
- factory capacities beyond what is already confirmed

When rewriting company introduction or about content:
- reflect the real factory background
- emphasize manufacturing experience, integrated production capability, and product breadth
- keep the wording suitable for an export website
- avoid literal translation of old Chinese brochure language

---

## Inquiry and conversion rules
The website should support practical B2B inquiry behavior.

Inquiry-related UI and copy should feel suitable for:
- importers
- distributors
- wholesalers
- private-label buyers

Prefer:
- clear inquiry paths
- practical field labels
- structured buyer information
- restrained but obvious CTA language

Avoid:
- overly salesy CTA language
- consumer e-commerce tone
- excessive repetition of the same business keywords in nearby sections

---

## Image rules
- prefer organized category folders under `assets/`
- do not stretch images
- keep image display sizes visually consistent
- do not rename or move large numbers of files unless necessary
- prefer trimmed, presentation-ready product images where available
- avoid mixing catalog assets with non-catalog support images unless needed intentionally

---

## Response rules
Before finishing any task:
- state what changed
- state which files changed
- state what was intentionally not changed
- note any remaining setup needed

## Factory & Company Information

### Company Name
RichLand Electrical Appliance Technology Co., Ltd.  
(also operating as Foshan HuaTian Electrical Appliance Co., Ltd.)

### Company Overview
Established in 1994, the company has over 30 years of experience specializing in the manufacturing of electric fans.  
The company focuses on cost-efficiency, product quality, and reliable after-sales service, building a strong reputation across multiple regions in China.

Key advantages:
- High cost-performance ratio
- Stable product quality (China CCC certified)
- Strong distributor network across multiple provinces
- 2-year warranty on fan motors

---

### Headquarters

** Address:**  
KunZhou Industrial Zone, Beijiao Town, Shunde District, Foshan, Guangdong, China  

**Phone:**  
+86-0757-26630638  

---

### Production Base

**Address:**  
No. 98 XingMin Road, Hecheng Street, Gaoming District, Foshan, Guangdong, China  

**Phone:**  
+86-0757-26657123  

**Factory Size:**  
Total construction area approx. 60,000+ square meters  

**Facilities Include:**
- Motor production workshop
- Injection molding workshop
- Complete fan assembly production lines

---

### Factories

#### Xiongchuang Industrial Factory
Primary facility supporting:
- Motor production
- Injection molding

#### Huatian Electrical Appliance Factory
Main factory for:
- Fan assembly
- Finished product manufacturing

---

### Product Scope
- Electric fans
- Household ventilation equipment
- Related motor and plastic components

---

### Website(Chinese Lanaguage)
http://www.huatiandq.com

---

### Contact Email

Ht-888@163.com

---

### Contact Email

ZHiHai（Client Manager）

### Notes for Frontend / Map Integration

- Use **Headquarters address** as primary map location
- Alternatively, allow switching between:
  - Headquarters
  - Production Base
- Phone numbers should be clickable (`tel:` format)
- Address should be usable for map API (Google Maps / AMap / etc.)