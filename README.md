# H.A. Overseas — Frontend Web Application

A modern, responsive React single-page application built with Vite for configuring tool orders, browsing the catalog, tracking exports, and managing distributor accounts.

---

## 🛠️ Tech Stack
- **Framework:** React 19 (Hooks, Context API)
- **Build Tool:** Vite 8.x
- **Routing:** React Router v7
- **Icons:** Lucide React
- **Animations & Effects:** Canvas-Confetti, CSS transitions, Glassmorphism design system
- **Styling:** Curated Vanilla CSS tokens (dark mode industrial theme with amber and slate accents)

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base endpoint for the backend API | `http://localhost:5000/api` |
| `VITE_FIREBASE_API_KEY` | *(Optional)* Firebase API Key for Google Sign-In | `""` |
| `VITE_FIREBASE_PROJECT_ID` | *(Optional)* Firebase Project ID | `""` |

---

## 🚀 Available Scripts

- **`npm run dev`**: Starts the Vite local development server on `http://localhost:5173`.
- **`npm run build`**: Compiles and bundles production assets into `dist/`.
- **`npm run preview`**: Previews the production build locally.

---

## 🧭 Key Features & Pages

- 🏠 **Home (`/`):** Hero section, product division spotlights, and export guarantees.
- 🧰 **Catalog (`/catalog`):** Instant search, category filters, detailed specs, and one-click launch into the configurator.
- ⚡ **Order Creator (`/order-creator`):** Live variant selector (Finishes, Laser Markings, Colorways, Packaging, Carton estimations) with real-time FOB pricing calculations.
- 📦 **My Orders (`/my-orders`):** Export order timeline tracking, shipment marks inspection, and direct authenticated PDF proforma downloads.
- 🔐 **Admin Hub (`/admin`):** High-level analytics, product manager with image uploads, dynamic attribute manager, order status lifecycle updater, and customer account administration.
