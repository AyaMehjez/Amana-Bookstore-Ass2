// src/app/cart/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CartItem from '../components/CartItem';
import { books } from '../data/books';
import { Book } from '../types';

interface CartItemFromAPI {
  _id?: string;
  userId: string;
  bookId: string;
  quantity: number;
  addedAt?: string;
}

interface CartItemWithBook {
  book: Book;
  quantity: number;
  _id?: string;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemWithBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart items from API
  const fetchCartItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/cart');
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart items');
      }
      
      const data: CartItemFromAPI[] = await response.json();
      
      // Map cart items from API to include book details and merge duplicates
      const itemsMap = new Map<string, CartItemWithBook>();
      
      data.forEach(item => {
        const book = books.find(b => b.id === item.bookId);
        if (book) {
          const existingItem = itemsMap.get(item.bookId);
          if (existingItem) {
            // Merge duplicates by adding quantities
            existingItem.quantity += item.quantity;
          } else {
            // Add new item
            itemsMap.set(item.bookId, {
              book,
              quantity: item.quantity,
              _id: item._id
            });
          }
        }
      });
      
      // Convert map to array
      const itemsWithBooks = Array.from(itemsMap.values());
      
      setCartItems(itemsWithBooks);
    } catch (err) {
      console.error('Error fetching cart items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cart items');
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const updateQuantity = async (bookId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    // Optimistic update: Update local state first
    const updatedItems = cartItems.map(item => 
      item.book.id === bookId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedItems);

    try {
      // Find all cart items with this bookId from MongoDB
      const response = await fetch('/api/cart');
      if (response.ok) {
        const allCartItems: CartItemFromAPI[] = await response.json();
        const itemsToUpdate = allCartItems.filter(item => item.bookId === bookId);
        
        if (itemsToUpdate.length > 0) {
          // If there are multiple items, delete all and create one with new quantity
          if (itemsToUpdate.length > 1) {
            // Delete all existing items
            await Promise.all(
              itemsToUpdate.map(item => 
                item._id ? fetch(`/api/cart?itemId=${item._id}`, { method: 'DELETE' }) : Promise.resolve()
              )
            );
            // Create new item with updated quantity
            await fetch('/api/cart', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: 'guest-user',
                bookId: bookId,
                quantity: newQuantity,
              }),
            });
          } else {
            // Update single item
            const cartItem = itemsToUpdate[0];
            if (cartItem._id) {
              const updateResponse = await fetch('/api/cart', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  id: cartItem._id,
                  quantity: newQuantity,
                }),
              });

              if (!updateResponse.ok) {
                throw new Error('Failed to update quantity');
              }
            }
          }
        }
      }
      
      // Notify navbar
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Revert optimistic update on error
      fetchCartItems();
    }
  };

  const removeItem = async (bookId: string) => {
    // Optimistic update: Remove from local state first
    const updatedItems = cartItems.filter(item => item.book.id !== bookId);
    setCartItems(updatedItems);

    try {
      // Find all cart items with this bookId from MongoDB and delete them all
      const response = await fetch('/api/cart');
      if (response.ok) {
        const allCartItems: CartItemFromAPI[] = await response.json();
        const itemsToDelete = allCartItems.filter(item => item.bookId === bookId);
        
        // Delete all items with this bookId
        await Promise.all(
          itemsToDelete.map(item => 
            item._id ? fetch(`/api/cart?itemId=${item._id}`, { method: 'DELETE' }) : Promise.resolve()
          )
        );
      }
      
      // Notify navbar
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('Error removing item:', error);
      // Revert optimistic update on error
      fetchCartItems();
    }
  };

  const clearCart = async () => {
    try {
      // Get all cart items and delete them one by one
      const response = await fetch('/api/cart');
      if (response.ok) {
        const allCartItems: CartItemFromAPI[] = await response.json();
        
        // Delete all items
        await Promise.all(
          allCartItems.map(item => 
            item._id ? fetch(`/api/cart?itemId=${item._id}`, { method: 'DELETE' }) : Promise.resolve()
          )
        );
      }
      
      setCartItems([]);
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const totalPrice = cartItems.reduce((total, item) => total + (item.book.price * item.quantity), 0);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h1>
        <div className="text-center py-10">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h1>
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <h2 className="text-xl text-gray-600 mb-4">Your cart is empty</h2>
          <Link href="/" className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors cursor-pointer">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md">
            {cartItems.map((item, index) => (
              <CartItem
                key={item._id || `${item.book.id}-${index}`}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
              />
            ))}
          </div>
          
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center text-xl font-bold mb-4 text-gray-800">
              <span>Total: ${totalPrice.toFixed(2)}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/" className="flex-1 bg-gray-500 text-white text-center py-3 rounded-md hover:bg-gray-600 transition-colors cursor-pointer">
                Continue Shopping
              </Link>
              <button 
                onClick={clearCart}
                className="flex-1 bg-red-500 text-white py-3 rounded-md hover:bg-red-600 transition-colors cursor-pointer"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
