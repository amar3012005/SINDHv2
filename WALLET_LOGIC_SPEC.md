# SINDH Wallet Logic & Global Truth Specification

This document defines the definitive source of truth for wallet fields and the two-stage payment system in the SINDH platform.

## 1. Two-Stage Payment System

To ensure transparency and trust between Employers and Workers, the platform uses a two-stage payment flow.

### Stage 1: Acceptance (Base Price)
- **Trigger**: Employer clicks "Accept" on a worker's application.
- **Action**: Employer pays the **Base Price** (original job salary) immediately.
- **Backend Logic**:
  - Deduct Base Price from Employer `wallet.totalBalance`.
  - Add Base Price to Worker `wallet.totalBalance` (Net Worth).
  - *Note*: This money is "committed" but not yet withdrawable by the worker.
- **Status**: Application status moves to `accepted`.

### Stage 2: Finalization (Additional Charges)
- **Trigger**: Job is finished; Employer clicks "Complete & Finalize Pay".
- **Action**: Employer pays any **Additional Charges** (bonuses, extra hours, etc.) if applicable.
- **Backend Logic**:
  - Deduct Additional Charges from Employer `wallet.totalBalance`.
  - Add total (Base + Additional) to Worker `balance` (Withdrawable Cash).
  - Add total to Worker `wallet.totalEarnings` (Lifetime History).
  - Increment Employer `wallet.spentAmount` by the total job cost.
- **Status**: Application status moves to `completed`.

---

## 2. Firestore Field Definitions (Global Truth)

### Worker Document
| Field | Name | Meaning |
|-------|------|---------|
| `wallet.totalBalance` | **Net Worth** | Total value of money from Finished Jobs + Base Price of current Working/Accepted Jobs. |
| `balance` | **Withdrawable Cash** | Liquid funds available for immediate withdrawal. Only from Finished Jobs. |
| `wallet.totalEarnings` | **Lifetime History** | Cumulative sum of every rupee ever earned on SINDH. |

### Employer Document
| Field | Name | Meaning |
|-------|------|---------|
| `wallet.totalBalance` | **Available Funds** | "Ready Cash" the employer has for hiring new workers. |
| `wallet.spentAmount` | **Total Expenditure** | Total money spent across all hired workers and completed jobs. |

---

## 3. Standardized Endpoints

| Purpose | Method | Endpoint |
|---------|--------|----------|
| **Accept Applicant** | `PATCH` | `/api/job-applications/:id/status` (with status: 'accepted') |
| **Finalize Job** | `POST` | `/api/job-applications/:id/employer-finish` |

> [!IMPORTANT]
> Always use `employer-finish` for the final release of funds to ensure consistency between frontend and backend.


