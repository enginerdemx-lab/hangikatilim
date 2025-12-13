# Project Structure

```
hangi-katılım-yeni/
├── src/
│   ├── services/
│   │   ├── supabaseClient.ts       # Supabase initialization
│   │   ├── authService.ts          # Admin authentication
│   │   ├── storageService.ts       # File upload/delete
│   │   └── api/
│   │       ├── siteSettings.ts
│   │       ├── navigation.ts
│   │       ├── ticker.ts
│   │       ├── homeHero.ts
│   │       ├── calculator.ts
│   │       ├── companies.ts
│   │       ├── campaigns.ts
│   │       ├── news.ts
│   │       ├── blog.ts
│   │       └── contact.ts
│   ├── types/
│   │   └── database.ts             # TypeScript interfaces
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── SiteSettings.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── Ticker.tsx
│   │   │   ├── HomeHero.tsx
│   │   │   ├── Calculator.tsx
│   │   │   ├── Companies.tsx
│   │   │   ├── Campaigns.tsx
│   │   │   ├── News.tsx
│   │   │   ├── Blog.tsx
│   │   │   ├── Contact.tsx
│   │   │   └── MediaLibrary.tsx
│   │   └── [existing public pages...]
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── ImageUpload.tsx
│   │   │   ├── RichTextEditor.tsx
│   │   │   ├── DragDropList.tsx
│   │   │   └── Toast.tsx
│   │   └── CampaignCard.tsx        # Public campaign card
│   └── hooks/
│       ├── useAuth.ts
│       └── useToast.ts
├── supabase-schema.sql
├── .env
└── .env.example
```

## Storage Structure (Supabase)

```
media/ (public bucket)
├── logos/              # Company logos
├── campaign-images/    # Campaign-specific images
├── blog-covers/        # Blog cover images
└── news-covers/        # News cover images
```
