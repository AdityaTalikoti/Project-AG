# ClashCheck — Low-Level Design (LLD)

## 1. System Architecture

We utilize the **Repository Pattern** to decouple the user interface logic from data access and storage layers.

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer                             │
│             (Flutter Screens & Widgets)                 │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                State Management Layer                   │
│               (Providers / Controllers)                 │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│               Repository / Service Layer                │
│       (Abstract layer interfacing with Firebase)        │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    Firebase Layer                       │
│           (Firestore, Auth, Storage SDKs)               │
└─────────────────────────────────────────────────────────┘
```

- **UI Layer (Screens & Widgets)**: Pure Flutter UI for user interactions and screen layouts.
- **State Management (Providers/Controllers)**: Manages application reactive state and business workflows.
- **Repository/Service Layer**: Abstract data access layer encapsulating Firebase interactions (`auth_service`, `booking_service`, `storage_service`).
- **Firebase Layer**: Direct interactions with Google Firebase Cloud Firestore, Firebase Authentication, and Firebase Storage.

---

## 2. Flutter Project Structure

```
lib/
├── core/         # Global constants, app theme definitions, custom enums, and utility helper functions
├── models/       # Data classes (User, Equipment, Booking, BookingItem)
├── providers/    # Reactive state management controllers (AuthProvider, CartProvider)
├── services/     # Firebase wrappers (auth_service, booking_service, storage_service)
├── screens/      # Feature-based view screens
└── widgets/      # Reusable shared UI components
```

---

## 3. Data Models

### 3.1 `User`
- `uid`: `String` — Unique identifier from Firebase Auth
- `email`: `String` — User email address
- `role`: `String` — Access role (e.g., `'user'`, `'admin'`)
- `fullName`: `String` — Full display name of the user

### 3.2 `Equipment`
- `id`: `String` — Unique equipment identifier
- `name`: `String` — Item display title
- `category`: `String` — Classification category
- `totalQuantity`: `int` — Total available inventory quantity
- `imageUrls`: `List<String>` — Array of image asset URLs
- `description`: `String` — Detailed item description
- `status`: `String` — Availability status (e.g., `'available'`, `'maintenance'`, `'retired'`)

### 3.3 `Booking`
- `id`: `String` — Unique booking transaction ID
- `customerId`: `String` — Reference to user `uid`
- `items`: `List<BookingItem>` — Array of requested equipment items and quantities
- `startDate`: `DateTime` — Booking period start timestamp
- `endDate`: `DateTime` — Booking period end timestamp
- `status`: `String` — Booking lifecycle status (`'pending'`, `'approved'`, `'rejected'`, `'cancelled'`, `'completed'`)
- `totalPrice`: `double` — Total cost calculation for the booking period

### 3.4 `BookingItem`
- `equipmentId`: `String` — Reference to target `Equipment.id`
- `quantity`: `int` — Number of units requested

---

## 4. Firestore Database Design

### Collection Schema: `users`
```json
{
  "uid": "string",
  "email": "string",
  "role": "string (admin | user)"
}
```

### Collection Schema: `equipment`
```json
{
  "id": "string",
  "name": "string",
  "totalQuantity": "number",
  "status": "string"
}
```

### Collection Schema: `bookings`
```json
{
  "id": "string",
  "customerId": "string",
  "status": "string",
  "startDate": "timestamp",
  "endDate": "timestamp",
  "items": [
    {
      "equipmentId": "string",
      "quantity": "number"
    }
  ]
}
```

---

## 5. Conflict Detection Engine

The availability of any equipment item is calculated dynamically to prevent double-booking:

1. **Query Active Bookings**: Fetch all bookings where `items.equipmentId == targetID` and `status` is NOT `cancelled` or `rejected`.
2. **Filter Overlapping Window**: Filter the active bookings that overlap with the desired `[newStart, newEnd]` timeframe.
3. **Overlap Condition**:
   $$\text{IsOverlapping} = (\text{newStart} < \text{existingEnd}) \land (\text{newEnd} > \text{existingStart})$$
4. **Calculate Available Quantity**:
   $$\text{AvailableQuantity} = \text{TotalQuantity} - \sum_{\text{overlapping}} \text{quantity}$$

---

## 6. Concurrency Prevention

To guarantee atomic updates and prevent race conditions when multiple users attempt to book the same item simultaneously:
- All booking submissions are executed inside a `FirebaseFirestore.instance.runTransaction`.
- The transaction reads current existing active bookings within the timeframe, re-evaluates the dynamic availability, and commits the new booking write **only** if `AvailableQuantity >= requestedQuantity`.

---

## 7. Firebase Security Rules

Database-level access control rules enforced via Firestore Security Rules:

- **`equipment` collection**:
  - `read`: Allowed for all authenticated users.
  - `write`: Allowed strictly for users with `admin` role.
- **`bookings` collection**:
  - `read`: Allowed for the resource owner (`request.auth.uid == resource.data.customerId`) or `admin`.
  - `write`: Allowed for the resource owner (`request.auth.uid == request.resource.data.customerId`) or `admin`.

---

## 8. Team Module Separation

- **Dev 1 (Auth / User)**: Setup Firebase Auth, Login/Register UI & Logic, Profile Management.
- **Dev 2 (Equipment / Inventory)**: Equipment CRUD services, Inventory Catalog UI, Firebase Storage integration.
- **Dev 3 (Booking Engine / Dispatch)**: Conflict Detection Engine, Cart management, Dispatch & Admin Dashboard.

---

## 9. Implementation Checklist

- [ ] **Phase 1: Setup & Data** — Firebase setup, Data Models, Auth implementation.
- [ ] **Phase 2: Core Logic** — Service layer, Conflict Detection Engine, Booking UI.
- [ ] **Phase 3: Admin & Dispatch** — Dashboards, Status Updates, Firestore Security Rules.
- [ ] **Phase 4: Polish & Test** — Unit & Integration tests, UI Polish, Final Demo flow.
