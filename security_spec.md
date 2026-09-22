# Security Specification & Threat Model (Zero-Trust)

This specification defines the strict data invariants, security boundaries, and authorization guidelines for **Kosmopoly Trader's** cloud storage.

## 1. Data Invariants

1. **User Ownership Isolation**: Users can ONLY read or write their own user profile document at `/users/{userId}`. Users can NEVER access other users' data.
2. **Trade Ownership Isolation**: A user can ONLY query, read, create, update, or delete trades that contain their exact authenticated `userId` field matching `request.auth.uid`.
3. **Identity Preservation**: Once created, a trade's `userId` is immutable. It cannot be reassigned or spoofed.
4. **Verified Traders**: Writing data requires an email-verified Google authentication token.
5. **No Blind Updates**: Anyone attempting to update a trade can only change specific allowed fields like notes, lessons, emotions, or screenshot URLs. Core financial parameters can only be updated if valid constraints are met.
6. **No Arbitrary Fields**: Any document creation or update must strictly match the types (e.g. `pnl` must be a number) and must prevent "ghost/shadow" fields from being injected.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following 12 payloads attempt to bypass authorization, inject fake data, spoof identities, or hijack roles. They **must always** be rejected (`PERMISSION_DENIED`) by the rules.

### Injecting Admin Privileges (Identity Spoofing)
* **Payload 1: Profile Creation with Arbitrary Role Upgrade**
  Attempts to create a user profile with role `ADMIN_ELITE` instead of standard `ASSOCIATE`.
  ```json
  {
    "id": "malicious_user_123",
    "email": "hacker@gmail.com",
    "displayName": "Injected Admin",
    "role": "ADMIN_ELITE"
  }
  ```
* **Payload 2: Upgrading Profile Role via Shadow Update**
  Attempts an update to switch the role of an existing profile to bypass rank validation.
  ```json
  {
    "role": "ADMIN_ELITE"
  }
  ```

### Cross-User Identity Hijacking (Spoofing)
* **Payload 3: Creating a Trade for Another User**
  Victim's UID is `victim_777`. Malicious actor `attacker_999` tries to create a trade under the victim's account.
  ```json
  {
    "id": "trade_fake_001",
    "userId": "victim_777",
    "active": "EUR/USD",
    "direction": "LONG",
    "entryPrice": 1.0910,
    "exitPrice": 1.0950,
    "size": 1.0,
    "pnl": 400,
    "createdAt": "2026-06-09T08:00:00Z"
  }
  ```
* **Payload 4: Takeover of an Existing Trade**
  Attempts to update a trade to reassign the `userId` field to a different owner.
  ```json
  {
    "userId": "attacker_999"
  }
  ```

### Resource Poisoning & Denial-of-Wallet
* **Payload 5: Overly Large Trade ID Injection**
  Attempts to use a huge, 10KB string to poison database index storage.
  ```json
  {
    "id": "trade_very_long_id_poisoning_payload_10kb_string_...",
    "userId": "attacker_999"
  }
  ```
* **Payload 6: Value Type Poisoning**
  Passing `pnl` as a Boolean or a multi-megabyte string, testing if rules allow malformed data.
  ```json
  {
    "pnl": "A_VERY_LONG_STRING_REPLACING_NUMBER_TYPE"
  }
  ```

### Input Boundary Circumvention
* **Payload 7: Bogus Asset Name**
  Attempts to log a trade with a huge junk string as active pair name.
  ```json
  {
    "active": "A".repeat(500)
  }
  ```
* **Payload 8: Direction Enum Violation**
  Attempts to store an invalid enum code for direction, testing check constraints.
  ```json
  {
    "direction": "YOLO_UP"
  }
  ```

### Temporal Integrity Violations
* **Payload 9: Spoofing Creation Timestamp**
  Attempts to insert a hardcoded historic date as the server creation timestamp.
  ```json
  {
    "createdAt": "1994-01-01T00:00:00Z"
  }
  ```
* **Payload 10: Clock Manipulation on Update**
  Attempts to manipulate `updatedAt` to a future date to trick historical tracking.
  ```json
  {
    "updatedAt": "2030-12-31T23:59:59Z"
  }
  ```

### Arbitrary PII Exploits
* **Payload 11: Stealing Raw Email Profiles**
  Unauthenticated user requests raw blanket listings of all user emails in `/users`.
  ```
  GET /users
  ```
* **Payload 12: Admin Verification Bypass (Unverified Email)**
  Attempts to perform administrative operations with `email_verified` as `false`.
  ```
  WRITE as unverified user with admin email string
  ```

---

## 3. Security Tests Specifications

Tests to be validated against the security rules structure:
- Profiles: `create` blocks if `request.auth.uid == userId` AND `email_verified == true`.
- Trades: `read` and `write` blocks if `resource.data.userId == request.auth.uid` or `incoming().userId == request.auth.uid`.
