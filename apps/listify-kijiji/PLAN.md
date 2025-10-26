# Listify - Planning Document

## Purpose & User Value

Listify is a local marketplace app that connects buyers and sellers in their community, making it easy to discover, buy, and sell items ranging from furniture to electronics to services. It emphasizes trust and safety through user verification, secure messaging, and rating systems while providing powerful search and filtering tools to help users find exactly what they need nearby. The app transforms the traditional classified ads experience into a modern, mobile-first marketplace that builds stronger local communities through commerce.

## Core MVP Feature List

- User registration with phone/email verification
- Create listings with photos, price, category, description
- Search and filter by category, price, distance, condition
- Location-based browsing with map view
- In-app messaging between buyers and sellers
- Save favorite listings and searches
- User profiles with ratings and reviews
- Report suspicious listings feature

## Future / Nice-to-Have Features

- Secure payment integration
- Shipping options for distant items
- Price drop notifications
- Make offer / price negotiation system
- Promoted listings for better visibility
- Business accounts with storefronts
- Barcode scanning for quick listing
- AI-powered pricing suggestions
- Social sharing of listings
- Trade/barter options

## Domain Entities & Relationships

- User (id, email, phone, name, verified, location, rating_average)
- Listing (id, seller_id, title, description, price, category_id, condition, status)
- Category (id, name, parent_id, icon, listing_count)
- ListingImage (id, listing_id, image_url, order_index)
- Location (listing_id, latitude, longitude, address, postal_code)
- Conversation (id, listing_id, buyer_id, seller_id, last_message_at)
- Message (id, conversation_id, sender_id, content, read_at)
- Review (id, reviewer_id, reviewed_id, listing_id, rating, comment)
- SavedListing (user_id, listing_id, saved_at)
- Report (reporter_id, listing_id, reason, description, status)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
├─────────────────────────────────────────────────────────┤
│  Screens (Expo Router)  │  Core Services                │
│  - Browse/Search        │  - Image Upload Manager       │
│  - Create Listing       │  - Location Services          │
│  - Messages             │  - Search Engine              │
│  - My Listings          │  - Chat System                │
├─────────────────────────────────────────────────────────┤
│         Camera, Location, and Storage APIs               │
├─────────────────────────────────────────────────────────┤
│              Supabase Client SDK                         │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                  Supabase Backend                        │
├─────────────────────────────────────────────────────────┤
│  Auth  │  Database  │  Storage  │ Realtime │  Edge Fn  │
│        │  - listings│  - photos │  - chat  │  - search │
│        │  - users   │  - thumbs │  - notif │  - price  │
│        │  - messages│           │           │  - verify │
└─────────────────────────────────────────────────────────┘
```

## Proposed Folder Structure

```
/apps/listify-kijiji/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── verify-phone.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── browse.tsx
│   │   ├── search.tsx
│   │   ├── messages.tsx
│   │   ├── my-listings.tsx
│   │   └── profile.tsx
│   ├── listing/
│   │   ├── new.tsx
│   │   ├── [id]/
│   │   │   ├── index.tsx
│   │   │   └── edit.tsx
│   │   └── category-select.tsx
│   ├── chat/
│   │   └── [conversationId].tsx
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   ├── ListingCard.tsx
│   │   ├── ImagePicker.tsx
│   │   ├── PriceInput.tsx
│   │   ├── CategorySelector.tsx
│   │   ├── LocationPicker.tsx
│   │   └── ChatBubble.tsx
│   ├── contexts/
│   │   ├── ListingContext.tsx
│   │   ├── SearchContext.tsx
│   │   └── ChatContext.tsx
│   ├── hooks/
│   │   ├── useListings.ts
│   │   ├── useImageUpload.ts
│   │   └── useLocation.ts
│   └── utils/
│       ├── image-processing.ts
│       ├── search-filters.ts
│       └── price-formatting.ts
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    ├── functions/
    │   ├── search-listings.ts
    │   └── flag-listing.ts
    └── seed.sql
```

## Two-Sprint Roadmap

### Sprint 1 (Week 1) - Core Marketplace Features

- Set up Expo project with camera and location permissions
- Design database schema for listings and categories
- Implement user authentication with phone verification
- Build listing creation with multi-image upload
- Create browse screen with category filtering
- Implement basic search functionality
- Set up listing detail view with image gallery
- Add location-based filtering

### Sprint 2 (Week 2) - Communication & Trust

- Build in-app messaging system with real-time updates
- Implement user profiles with listings history
- Add rating and review system
- Create "My Listings" management screen
- Build saved listings functionality
- Implement listing status updates (available/sold)
- Add report/flag listing feature
- Polish UI with smooth transitions

## Key Risks & Mitigations

1. **Fraud and Scam Listings**

   - Risk: Fake listings, payment scams, stolen goods
   - Mitigation: User verification, reporting system, safety guidelines, moderation

2. **Image Storage Costs**

   - Risk: High storage costs for listing photos
   - Mitigation: Image compression, limits per listing, automatic cleanup of old images

3. **Search Performance at Scale**

   - Risk: Slow searches with many listings
   - Mitigation: Elasticsearch integration, smart indexing, caching strategies

4. **User Safety for In-Person Meetings**

   - Risk: Unsafe meetups for transactions
   - Mitigation: Safety tips, public meetup spots, optional ID verification

5. **Message Spam and Harassment**

   - Risk: Users receiving spam or inappropriate messages
   - Mitigation: Message filtering, block functionality, report system

6. **Location Privacy**
   - Risk: Exact addresses exposed publicly
   - Mitigation: Approximate locations shown publicly, exact address only after agreement

## First 3 Actionable Engineering Tasks

1. **Set Up Image Handling Infrastructure**

   - Configure expo-image-picker
   - Implement image compression utilities
   - Set up Supabase Storage buckets

2. **Design Marketplace Schema**

   - Create database tables for listings, categories
   - Implement geospatial indexing for location
   - Set up full-text search capabilities

3. **Build Listing Creation Flow**
   - Create multi-step listing form
   - Implement category selection UI
   - Add image upload with preview
