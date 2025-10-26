# SafePocket - Planning Document

## Purpose & User Value

SafePocket is a secure password manager that helps users create, store, and autofill strong unique passwords across all their accounts, eliminating password reuse and reducing security risks. It uses industry-standard encryption to protect sensitive data while providing convenient access through biometric authentication and secure sharing features. The app transforms password management from a frustrating burden into a seamless security enhancement that protects users' digital lives without sacrificing convenience.

## Core MVP Feature List

- Master password and biometric authentication
- Secure vault for passwords, notes, and cards
- Password generator with customizable rules
- Search and categorization of items
- Auto-lock timer and security settings
- Import from browser/CSV
- Secure password sharing via link
- Data breach monitoring alerts

## Future / Nice-to-Have Features

- Browser extension integration
- Two-factor authentication (2FA) codes
- Secure document storage
- Family/team vaults with permissions
- Password strength audit
- Watchtower for compromised sites
- Travel mode to hide sensitive vaults
- Emergency access for trusted contacts
- Passwordless authentication support
- CLI tool for developers

## Domain Entities & Relationships

- User (id, email, master_password_hash, salt, key_derivation_params)
- Vault (id, user_id, name, type, created_at)
- Item (id, vault_id, type, title, encrypted_data, favorite, created_at, modified_at)
- ItemField (id, item_id, field_name, field_value, field_type, is_encrypted)
- Category (id, name, icon, color, user_id)
- SharedItem (id, item_id, shared_by, shared_with, expiry_date, access_count)
- SecurityLog (id, user_id, action, ip_address, device_info, timestamp)
- BreachAlert (id, user_id, item_id, breach_name, breach_date, notified_at)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
├─────────────────────────────────────────────────────────┤
│  Screens (Expo Router)  │  Security Core                │
│  - Vault Browser        │  - Encryption Manager         │
│  - Item Details         │  - Key Derivation             │
│  - Password Generator   │  - Biometric Auth             │
│  - Settings             │  - Auto-lock Timer            │
├─────────────────────────────────────────────────────────┤
│      Secure Storage & Biometric APIs                    │
├─────────────────────────────────────────────────────────┤
│              Supabase Client SDK                         │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                  Supabase Backend                        │
├─────────────────────────────────────────────────────────┤
│  Auth  │  Database  │  Storage  │ Realtime │  Edge Fn  │
│        │  - vaults  │  - docs   │  - sync  │  - breach │
│        │  - items   │           │           │  - share  │
│        │  - logs    │           │           │  - audit  │
└─────────────────────────────────────────────────────────┘
```

## Proposed Folder Structure

```
/apps/safepocket-1password/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── master-password.tsx
│   ├── (authenticated)/
│   │   ├── _layout.tsx
│   │   ├── vault.tsx
│   │   ├── generator.tsx
│   │   ├── watchtower.tsx
│   │   └── settings.tsx
│   ├── item/
│   │   ├── new.tsx
│   │   └── [id]/
│   │       ├── index.tsx
│   │       └── edit.tsx
│   ├── setup/
│   │   └── biometric.tsx
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   ├── ItemCard.tsx
│   │   ├── PasswordField.tsx
│   │   ├── PasswordGenerator.tsx
│   │   ├── StrengthMeter.tsx
│   │   └── SecureInput.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── VaultContext.tsx
│   │   └── SecurityContext.tsx
│   ├── hooks/
│   │   ├── useEncryption.ts
│   │   ├── useBiometric.ts
│   │   └── useAutoLock.ts
│   └── utils/
│       ├── crypto.ts
│       ├── password-generator.ts
│       └── breach-check.ts
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    ├── functions/
    │   ├── check-breach.ts
    │   └── share-item.ts
    └── seed.sql
```

## Two-Sprint Roadmap

### Sprint 1 (Week 1) - Core Security Foundation

- Set up Expo project with secure storage
- Implement master password creation and key derivation
- Build encryption/decryption utilities with AES-256
- Create basic vault structure and item types
- Implement biometric authentication
- Build password generator with options
- Create secure item storage and retrieval
- Add auto-lock functionality

### Sprint 2 (Week 2) - Features & Polish

- Implement search and categorization
- Build password strength analysis
- Add CSV import functionality
- Create secure sharing mechanism
- Implement breach monitoring alerts
- Build security audit dashboard
- Add backup and sync features
- Polish UI with security indicators

## Key Risks & Mitigations

1. **Encryption Implementation Flaws**

   - Risk: Weak encryption leading to data exposure
   - Mitigation: Use proven libraries (crypto-js), security audit, follow OWASP

2. **Master Password Loss**

   - Risk: User loses access to all data permanently
   - Mitigation: Clear warnings, secure recovery options, emergency access

3. **Sync Conflicts**

   - Risk: Data loss during device synchronization
   - Mitigation: Conflict resolution strategy, versioning, atomic operations

4. **Biometric Security Bypass**

   - Risk: Biometric auth compromised, giving vault access
   - Mitigation: Always require master password for sensitive operations

5. **Memory Exposure**

   - Risk: Sensitive data remaining in memory
   - Mitigation: Clear variables after use, secure memory management

6. **Clipboard Security**
   - Risk: Passwords exposed through clipboard
   - Mitigation: Auto-clear clipboard, warning messages

## First 3 Actionable Engineering Tasks

1. **Implement Encryption Core**

   - Set up AES-256-GCM encryption utilities
   - Implement PBKDF2 key derivation
   - Create secure random generator

2. **Build Authentication System**

   - Design master password setup flow
   - Implement biometric authentication
   - Create secure session management

3. **Create Vault Data Model**
   - Design encrypted item storage schema
   - Build CRUD operations for vault items
   - Implement secure search functionality
