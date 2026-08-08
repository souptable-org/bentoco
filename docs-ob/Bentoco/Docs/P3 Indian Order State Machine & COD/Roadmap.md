# Sub-Roadmap: Phase 3 — Indian Order State Machine & COD OTP Engine

This document details the implementation of the **Indian Order State Machine**, replacing standard Western e-commerce order flows with native WhatsApp OTP verification, COD confirmation, and Prepaid Flip mechanics for **Bentoco Engine**.

---

## Order Lifecycle Architecture

```
[ Cart Submitted ]
       │
       ▼
[ ORDER_INITIATED ] ──(Generates 4-Digit OTP)──► [ WHATSAPP_VERIFYING ]
                                                        │
                     ┌──────────────────────────────────┴──────────────────────────────────┐
                     ▼                                                                     ▼
          (Customer Chooses UPI)                                               (Customer Enters 4-Digit OTP)
                     │                                                                     │
                     ▼                                                                     ▼
            [ PREPAID_FLIPPED ]                                                   [ COD_VERIFIED ]
                     │                                                                     │
                     └──────────────────────────────────┬──────────────────────────────────┘
                                                        ▼
                                               [ AWB_GENERATED ]
```

---

## Detailed Module Breakdown

### Module 1: Order State Machine & Database Schema Extensions
- [x] **1.1 Extended Order Status Enums**
  - Added native status values to `order` schema: `ORDER_INITIATED`, `WHATSAPP_VERIFYING`, `COD_VERIFIED`, `PREPAID_FLIPPED`, `AWB_GENERATED`.

- [x] **1.2 Order State History Audit Trail (`order_state_history`)**
  - Created table `order_state_history` (`id`, `tenant_id`, `order_id`, `from_status`, `to_status`, `reason`, `metadata`, `created_at`) with RLS policy bindings ([0001-indian-order-state-machine-otp.sql](file:///C:/Users/harsh/bentoco/packages/bentoco/src/migration-scripts/0001-indian-order-state-machine-otp.sql)).

---

### Module 2: Native 4-Digit OTP Verification Engine
- [x] **2.1 OTP Session Database Schema (`tenant_otp_session`)**
  - Created table `tenant_otp_session` (`id`, `tenant_id`, `order_id`, `phone`, `otp_code_hash`, `attempts`, `expires_at`, `is_verified`) with RLS policy bindings.

- [x] **2.2 Cryptographic OTP Generator & Expiry Service**
  - Built `generate4DigitOTP` and `createOTPSession` ([packages/bentoco/src/utils/indian-order-state-machine.ts](file:///C:/Users/harsh/bentoco/packages/bentoco/src/utils/indian-order-state-machine.ts)) returning 4-digit codes with 10-minute expiry window.

- [x] **2.3 OTP Verification Endpoint Handler**
  - Built `verifyOTPSession` ([packages/bentoco/src/utils/indian-order-state-machine.ts](file:///C:/Users/harsh/bentoco/packages/bentoco/src/utils/indian-order-state-machine.ts)) transitioning order status to `COD_VERIFIED` upon valid 4-digit OTP.

---

### Module 3: Prepaid Flip Engine (COD-to-Prepaid Conversion)
- [x] **3.1 Prepaid Flip Discount Math**
  - Applied instant UPI discount incentives in integer Paisa.

- [x] **3.2 Prepaid Flip State Transition Handler**
  - Built `flipOrderToPrepaid` ([packages/bentoco/src/utils/indian-order-state-machine.ts](file:///C:/Users/harsh/bentoco/packages/bentoco/src/utils/indian-order-state-machine.ts)) transitioning order status from `WHATSAPP_VERIFYING` → `PREPAID_FLIPPED`.

---

### Module 4: RTO Risk Assessment & Test Suite
- [x] **4.1 Basic RTO Risk Scoring**
  - Flagged unverified phone numbers, failed OTP attempts, and high-risk pincodes.

- [x] **4.2 State Machine Integration Test Suite (`scripts/test-order-state-machine.js`)**
  - Executed automated integration test suite [scripts/test-order-state-machine.js](file:///C:/Users/harsh/bentoco/scripts/test-order-state-machine.js).
  - Saved execution log to [log/test-order-state-machine.txt](file:///C:/Users/harsh/bentoco/log/test-order-state-machine.txt) (`✅ PHASE 3 AUDIT PASSED`).
