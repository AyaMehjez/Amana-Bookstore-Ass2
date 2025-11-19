// src/app/api/books/route.ts
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

/**
 * GET /api/books
 * Retrieves all documents from the "books" collection
 */
export async function GET() {
  try {
    // Establish connection to the database
    const db = await getDatabase();
    
    // Query the books collection
    const books = await db.collection('books').find({}).toArray();
    
    // Return results as JSON with proper headers
    return NextResponse.json(
      books,
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching books from MongoDB:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch books',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
