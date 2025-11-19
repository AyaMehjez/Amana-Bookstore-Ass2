// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import BookGrid from './components/BookGrid';
import { books } from './data/books';

export default function HomePage() {
  // Track which books have been added to cart
  const [addedToCart, setAddedToCart] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState<Set<string>>(new Set());

  // Load cart status from MongoDB on mount and listen for updates
  useEffect(() => {
    const loadCartStatus = async () => {
      try {
        const response = await fetch('/api/cart');
        if (response.ok) {
          const cartItems: { bookId: string }[] = await response.json();
          const addedBooks = new Set<string>(cartItems.map((item) => item.bookId));
          setAddedToCart(addedBooks);
        }
      } catch (error) {
        console.error('Error loading cart status:', error);
      }
    };

    loadCartStatus();

    // Listen for cart updates from other pages/components
    const handleCartUpdate = () => {
      loadCartStatus();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Handle add to cart with API call and state update
  const handleAddToCart = async (bookId: string) => {
    // Prevent duplicate requests
    if (isAdding.has(bookId) || addedToCart.has(bookId)) {
      return;
    }

    setIsAdding(prev => new Set(prev).add(bookId));

    try {
      // Send POST request to /api/cart
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'guest-user', // In a real app, get from auth/session
          bookId: bookId,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add item to cart');
      }

      // Check if the response indicates success
      if (data.success) {
        // Update React state to change button text and disable it
        setAddedToCart(prev => new Set(prev).add(bookId));
        console.log(`Successfully added book ${bookId} to cart. ID: ${data.insertedId}`);
        
        // Notify navbar and other components (like book detail page)
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        throw new Error(data.error || 'Failed to add item to cart');
      }
    } catch (error) {
      // Handle errors gracefully
      console.error('Error adding to cart:', error);
      alert(error instanceof Error ? error.message : 'Failed to add item to cart. Please try again.');
    } finally {
      setIsAdding(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <section className="text-center bg-blue-100 p-8 rounded-lg mb-12 shadow-md">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Welcome to the Amana Bookstore!</h1>
        <p className="text-lg text-gray-600">
          Your one-stop shop for the best books. Discover new worlds and adventures.
        </p>
      </section>

      {/* Book Grid */}
      <BookGrid 
        books={books} 
        onAddToCart={handleAddToCart}
        addedToCart={addedToCart}
        isAdding={isAdding}
      />
    </div>
  );
}
