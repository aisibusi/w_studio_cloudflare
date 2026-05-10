# w studio

A quiet luxury jewelry storefront for w studio collections.

This version is Cloudflare-ready. The public storefront is a React + Vite app served by Cloudflare Pages. The `/admin` dashboard uses Cloudflare Pages Functions for API routes, Cloudflare D1 for product/settings/inquiry data, and Cloudflare R2 for uploaded images.

## Project Overview

- Public storefront at `/`
- Separate admin page at `/admin`
- Homepage hero image controlled from admin
- Homepage collection/category card images controlled from admin
- Homepage collection/category card order controlled from admin drag-and-drop
- Product create, edit, delete, and product image upload
- Product detail modal with description, price, and inquiry action
- Customer inquiry form
- USD pricing and `Inquire for pricing` support
- Cloudflare D1 storage instead of JSON files in production
- Cloudflare R2 image storage instead of local `/data/uploads` in production

## Tech Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Cloudflare Pages
- Cloudflare Pages Functions
- Cloudflare D1
- Cloudflare R2
- Motion
- Lucide React

## Important Cloudflare Files

```text
functions/api/[[path]].ts       Cloudflare API for /api/*
functions/uploads/[[path]].ts   Serves uploaded R2 images from /uploads/*
migrations/0001_init.sql        D1 database schema
wrangler.toml                   Cloudflare bindings template
```

## Local Frontend Check

Install dependencies:

```bash
npm install
```

Type-check:

```bash
npm run lint
```

Build:

```bash
npm run build
```

The production frontend output is:

```text
dist
```

## Cloudflare Data Model

D1 tables:

```text
products
inquiries
site_settings
```

R2 bucket:

```text
wstudio-uploads
```

Uploaded images are stored in R2 and served through the site path:

```text
/uploads/<image-file>
```

This keeps the frontend code using normal relative image URLs.

## Admin

The admin page is:

```text
/admin
```

Default password if `ADMIN_PASSWORD` is not configured:

```text
666
```

For production, configure these Cloudflare Pages environment variables:

```text
ADMIN_PASSWORD=your-admin-password
SESSION_SECRET=replace-this-with-a-long-random-string
```

## Admin Homepage Controls

The `/admin` dashboard includes a `Homepage` tab.

From this tab, the site owner can:

- Upload the main homepage hero photo. This image appears at the very top of `/`, behind the “Formed by Nature. Refined by Time.” headline.
- Upload or reset each collection/category cover image. These images appear on the homepage collection cards.
- Drag collection/category rows to change the order of the homepage collection cards.
- Use the up/down buttons as an alternative to drag-and-drop.
- Click `Save Homepage Changes` to publish the updated homepage photo, category cover images, and collection order.

These settings are stored in D1 under the `site_settings` table.

## Admin Product Image Upload Guidance

The admin editor includes a product image upload area. Before uploading, the editor shows the selected collection and explains where the image will appear after the product is saved:

- the public collection product archive grid
- the product card thumbnail
- the product detail modal
- the inquiry drawer product context
- the admin archive thumbnail

The upload success message also repeats the exact selected collection name, so the admin user knows which public collection page will display the uploaded product image.

## Cloudflare Deployment Summary

1. Push this project to GitHub.
2. In Cloudflare Dashboard, create a D1 database named `wstudio-db`.
3. Create an R2 bucket named `wstudio-uploads`.
4. Replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` in `wrangler.toml` with the real D1 database ID.
5. Apply the D1 migration:

```bash
npx wrangler d1 migrations apply wstudio-db --remote
```

6. Create a Cloudflare Pages project connected to the GitHub repo.
7. Use this build configuration:

```text
Framework preset: Vite
Build command: npm run build
Build output directory: dist
```

8. In the Pages project settings, add bindings:

```text
D1 binding name: DB       → wstudio-db
R2 binding name: UPLOADS  → wstudio-uploads
```

9. Add environment variables:

```text
ADMIN_PASSWORD=your-admin-password
SESSION_SECRET=replace-this-with-a-long-random-string
```

10. Deploy.

## GitHub Repo

Use this repository:

```text
https://github.com/aisibusi/w_studio.git
```

Typical update flow:

```bash
npm install
npm run lint
npm run build
git add .
git commit -m "Prepare w studio for Cloudflare Pages"
git push origin main
```

Cloudflare Pages will redeploy after the GitHub push.

## Notes

- Railway-specific `DATA_DIR` storage is no longer needed for Cloudflare production.
- The old `server/index.mjs` can still be kept in the repo, but Cloudflare Pages will use the `functions/` API instead.
- Do not commit local D1 or R2 development data.
- The API paths remain the same for the frontend: `/api/products`, `/api/site-settings`, `/api/uploads`, etc.
