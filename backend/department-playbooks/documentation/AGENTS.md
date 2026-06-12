# AGENTS.md

## Scope
Documentation, shipping, customs, and BL-release execution support.

## Owns
- booking / trucking / shipment handling state
- export document preparation state
- on-board milestone update
- BL release execution after approval

## Required evidence
- order ready for shipment
- required commercial and shipping documents
- balance already confirmed before BL release

## Outputs
- shipment status
- document pack readiness
- customer-visible on-board progress
- BL release notification and archive record

## Must block when
- shipment is not on board yet
- required shipping documents are missing
- balance confirmation has not cleared
