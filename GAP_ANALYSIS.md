# Gap analysis: OpenSooq clone vs. the real OpenSooq (opensooq.com)

The real product was studied from its public pages (sa.opensooq.com homepage, category sections such as "apartments for sale/rent", "villas", "land"), looking at **features, flows and layout only**. No branding, assets or code were copied. Date: 2026-10-16.

## What the real OpenSooq offers (public UX)
- **Category tree:** a deep tree of main and sub-categories (cars, real estate → apartments/villas/land for sale or rent, jobs, services, animals, fashion, tutoring…).
- **Filters per category:** e.g. year, mileage and transmission for cars; rooms and area for property; price range and condition everywhere.
- **Location:** country, city and neighbourhood.
- **Listings:** multi-photo **image galleries**.
- **Buyer tools:** **favorites**, **chat/messages** between buyer and seller (in addition to calling).
- **Seller pages:** **seller profiles** (member since, the seller's other ads).
- **Paid visibility:** **featured / promoted ads**, shown first with a badge.
- **Safety:** **report ad**, plus safety tips.

## Where the clone stood (before this round)
| Area | Clone | Gap |
|---|---|---|
| Categories | 5 flat categories | No sub-categories, no category-specific fields |
| Filters | Category, city, text, sort | No price range, condition or per-category filters |
| Photos | One image | No gallery |
| Buyer tools | Phone only | No favorites, no in-app messages |
| Seller | Name on the ad | No seller profile page |
| Visibility | Newest first | No featured ads |
| Safety | Safety tip | No report-ad flow, no moderation queue |

## Priority and decision
1. **Category tree + per-category attributes and filters** (cars: year/mileage/transmission; property: rooms/area; all: condition, price range). *Shipped.*
2. **Image gallery** (up to 5 photos per ad, with thumbnails). *Shipped.*
3. **Favorites** (save/remove, "My favorites" page). *Shipped.*
4. **Messages** between buyer and seller, per ad, with an inbox and threads. *Shipped.*
5. **Seller profile** (member since, ad count, their ads). *Shipped.*
6. **Featured ads** (admin toggles, shown first with a badge). *Shipped.*
7. **Report ad**, plus an admin moderation queue (resolve / delete ad). *Shipped.*

## Remaining
- Neighbourhood-level location and a map; real-time chat (WebSocket); phone verification.
- Paid promotion checkout; saved searches and alerts (need email/push).
