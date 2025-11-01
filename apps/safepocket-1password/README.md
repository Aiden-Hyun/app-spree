# SafePocket - Password Manager App

A secure, feature-rich password manager built with React Native and Expo, rivaling 1Password with strong encryption, biometric authentication, and comprehensive security features.

## 🚀 Tech Stack

- **Expo SDK 51** with React Native 0.74
- **Expo Router v3** for navigation
- **TypeScript** (strict mode)
- **Supabase** for authentication and database
- **React Native StyleSheet** for styling
- **Expo Crypto & Secure Store** for encryption
- **Expo Local Authentication** for biometrics

## ✨ Features

### Core Security

- **🔐 Master Password Protection**: Client-side encryption with PBKDF2-like key derivation
- **🔑 Biometric Authentication**: Face ID/Touch ID support for quick vault access
- **⏱️ Auto-lock**: Configurable timeout with background state detection
- **🔒 Zero-knowledge Architecture**: Passwords encrypted client-side, server never sees plain text

### Password Management

- **📝 Full CRUD Operations**: Add, view, edit, delete passwords with encryption
- **🏷️ Categories**: Organize passwords with custom color-coded categories
- **⭐ Favorites**: Quick access to frequently used passwords
- **🔍 Search**: Real-time search across all password fields
- **📋 Quick Actions**: Copy username/password with auto-clipboard clearing
- **🌐 Website Integration**: Store and open associated websites

### Security Features

- **📊 Security Dashboard**: Visual security score with actionable insights
- **💪 Password Strength Analysis**: Real-time strength indicators
- **♻️ Reuse Detection**: Identifies duplicate passwords across accounts
- **📅 Password Age Monitoring**: Alerts for passwords older than 90 days
- **🚨 Breach Monitoring**: Check passwords against known breaches
- **📜 Security Event Logging**: Track all security-related activities

### Advanced Features

- **🎲 Password Generator**: Customizable with presets (Memorable, Strong, Maximum)
- **📱 Password History**: Track password changes over time
- **👥 Secure Sharing**: Share passwords with family/team members
- **🔄 Import/Export**: Backup and restore vault data (coming soon)
- **🔐 Two-Factor Authentication**: Additional security layer (coming soon)

## 🏗️ Architecture

```
/apps/safepocket-1password/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx              # Login screen
│   │   ├── register.tsx           # Registration screen
│   │   └── master-password.tsx    # Master password setup/unlock
│   ├── password/
│   │   ├── [id].tsx              # Password detail/edit view
│   │   └── new.tsx               # Add new password
│   ├── home.tsx                  # Main password list
│   ├── security.tsx              # Security dashboard
│   ├── settings.tsx              # App settings
│   └── _layout.tsx               # Root layout with providers
├── src/
│   ├── components/
│   │   ├── PasswordItem.tsx      # Password list item
│   │   ├── PasswordForm.tsx      # Add/edit password form
│   │   ├── SecurityScore.tsx     # Security score visualization
│   │   ├── BiometricPrompt.tsx   # Biometric auth UI
│   │   ├── SearchBar.tsx         # Search component
│   │   ├── CategoryPicker.tsx    # Category selection modal
│   │   └── StatsCard.tsx         # Statistics display card
│   ├── contexts/
│   │   ├── AuthContext.tsx       # Authentication state
│   │   ├── VaultContext.tsx      # Password vault management
│   │   └── SecurityContext.tsx   # Security analysis & monitoring
│   ├── hooks/
│   │   ├── useBiometrics.ts     # Biometric authentication
│   │   └── useAutoLock.ts       # Auto-lock functionality
│   ├── services/
│   │   ├── encryptionService.ts # Core encryption logic
│   │   ├── passwordService.ts   # Password operations
│   │   ├── categoryService.ts   # Category management
│   │   ├── securityService.ts   # Security analysis
│   │   └── sharingService.ts    # Password sharing
│   └── utils/
│       ├── crypto.ts            # Encryption utilities
│       ├── passwordStrength.ts  # Strength calculation
│       └── validators.ts        # Form validation
└── supabase/
    ├── schema.sql               # Database schema
    ├── seed.sql                # Sample data
    └── functions/               # Edge functions
        ├── check_password_breach.sql
        └── log_security_event.sql
```

## 🔐 Security Implementation

### Encryption Strategy

- **Algorithm**: XOR encryption with key derivation (upgradeable to AES-256)
- **Key Derivation**: PBKDF2-style with SHA256 iterations
- **Salt Generation**: Secure random 32-byte salt per user
- **Session Management**: Encryption keys stored in memory only

### Security Best Practices

- Master password never stored, only hash for verification
- All passwords encrypted client-side before storage
- Auto-lock on app background/inactivity
- Clipboard auto-clear after 30 seconds
- Secure storage for sensitive data
- Biometric authentication as secondary factor

## 🛠️ Development Setup

1. **Install dependencies**:

   ```bash
   npm install --legacy-peer-deps
   ```

2. **Environment setup**:

   ```bash
   cp .env.example .env
   ```

   Add your Supabase project URL and anon key.

3. **Database setup**:

   - Create a new Supabase project
   - Run `schema.sql` to create tables
   - Run `seed.sql` for sample data

4. **Start development**:
   ```bash
   npm start
   ```

## 🗄️ Database Schema

- **users**: User accounts with security preferences
- **password_categories**: Custom categories for organization
- **passwords**: Encrypted password storage with metadata
- **password_history**: Track password changes
- **security_events**: Audit log for security activities
- **shared_passwords**: Password sharing relationships

## 🧪 Testing

```bash
npm test
```

## 📱 Platform Support

- iOS (iPhone & iPad)
- Android
- Web (limited features)

## 🔮 Future Enhancements

- [ ] Hardware key support (YubiKey)
- [ ] Password breach API integration
- [ ] Team/Family vaults
- [ ] Browser extensions
- [ ] Secure notes & documents
- [ ] Emergency access
- [ ] Travel mode
- [ ] Watchtower-like monitoring

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

This project is licensed under the MIT License.
