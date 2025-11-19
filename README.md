# Amana Bookstore

A modern bookstore project I built using Next.js, React, and Tailwind CSS. It features a book catalog with search and filtering capabilities, book details with ratings, and a simple shopping cart.

## Features

- **Catalog Display**: Grid and list views with search, genre filtering, and sorting
- **Book Details**: Ratings, genres, pricing, and reviews section
- **Shopping Cart**: Local storage using localStorage
- **Responsive Design**: Works on all devices

## Tech Stack

- **Next.js 15** with App Router
- **React 19** + **TypeScript**
- **Tailwind CSS v4** for styling

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open your browser at `http://localhost:3000`

## Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/app/
  ├── api/          # API routes
  ├── book/[id]/    # Book details page
  ├── cart/         # Shopping cart page
  ├── components/   # UI components
  └── data/         # Books and reviews data
```

---

Developed as part of Amana Bootcamp.
