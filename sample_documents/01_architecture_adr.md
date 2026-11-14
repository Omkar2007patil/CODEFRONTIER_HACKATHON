# Architecture Decision Records (ADR) - Apex Core Platform
Project: Apex Enterprise Gateway
Last Updated: 2026-10-28
Author: Alex Chen (Lead Backend Architect)

## ADR-001: Persistent Audit Trail and Compliance Store
### Status
Accepted
### Context
We evaluated MongoDB vs PostgreSQL for compliance event streaming, user audit trails, and version immutability.
### Decision
PostgreSQL is selected for audit trail storage due to its ACID guarantees, robust JSONB support, and mature row-level security. SQLite will be used for rapid local test prototypes, but production and staging strictly utilize PostgreSQL.

---

## ADR-004: Release Timeline & API Freeze
### Status
Active
### Decision
All breaking API changes must cease by the API freeze milestone on November 10, 2026. The staging verification window closes Nov 12, prior to staging hardening.
