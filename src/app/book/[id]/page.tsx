// src/app/book/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { books } from '../../data/books';
import { reviews } from '../../data/reviews';
import { Book, Review } from '../../types';

interface CartItemFromAPI {
  _id?: string;
  userId: string;
  bookId: string;
  quantity: number;
  addedAt?: string;
}

export default function BookDetailPage() {
  const [book, setBook] = useState<Book | null>(null);
  const [bookReviews, setBookReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);

  const params = useParams();
  const { id } = params;

  // Check if book is in cart and get its quantity
  useEffect(() => {
    const checkCartStatus = async () => {
      if (!id) return;
      
      try {
        const response = await fetch('/api/cart');
        if (response.ok) {
          const cartItems: CartItemFromAPI[] = await response.json();
          const cartItem = cartItems.find(item => item.bookId === id);
          
          if (cartItem) {
            setIsAddedToCart(true);
            setCartQuantity(cartItem.quantity);
          } else {
            setIsAddedToCart(false);
            setCartQuantity(0);
          }
        }
      } catch (error) {
        console.error('Error checking cart status:', error);
      }
    };

    checkCartStatus();

    // Listen for cart updates
    const handleCartUpdate = () => {
      checkCartStatus();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [id]);

  useEffect(() => {
    if (id) {
      const foundBook = books.find((b) => b.id === id);
      if (foundBook) {
        setBook(foundBook);
        // Get reviews for this book
        const bookReviewsData = reviews.filter((review) => review.bookId === id);
        setBookReviews(bookReviewsData);
      } else {
        setError('Book not found.');
      }
      setIsLoading(false);
    }
  }, [id]);

  const handleAddToCart = async () => {
    if (!book || isAdding || isAddedToCart) return;

    setIsAdding(true);

    try {
      // Check if book already exists in cart
      const response = await fetch('/api/cart');
      if (response.ok) {
        const cartItems: CartItemFromAPI[] = await response.json();
        const existingItem = cartItems.find(item => item.bookId === book.id);

        if (existingItem && existingItem._id) {
          // Update existing item quantity
          const updateResponse = await fetch('/api/cart', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: existingItem._id,
              quantity: existingItem.quantity + quantity,
            }),
          });

          if (!updateResponse.ok) {
            throw new Error('Failed to update cart');
          }
        } else {
          // Add new item to cart
          const addResponse = await fetch('/api/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: 'guest-user',
              bookId: book.id,
              quantity: quantity,
            }),
          });

          if (!addResponse.ok) {
            throw new Error('Failed to add to cart');
          }
        }

        // Update local state
        setIsAddedToCart(true);
        setCartQuantity(prev => prev + quantity);
        
        // Notify navbar and other components
        window.dispatchEvent(new CustomEvent('cartUpdated'));

        // Optional: Redirect to cart page
        // router.push('/cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };
  
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        // Full star
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        // Half star
        stars.push(
          <div key={i} className="relative w-4 h-4">
            <svg className="w-4 h-4 text-gray-300 fill-current absolute" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        );
      } else {
        // Empty star
        stars.push(
          <svg key={i} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      }
    }
    return <div className="flex items-center">{stars}</div>;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold text-red-500">{error}</h1>
        <Link href="/" className="text-blue-500 hover:underline mt-4 inline-block cursor-pointer">
          Back to Home
        </Link>
      </div>
    );
  }

  if (!book) {
    return null; // Should be handled by error state
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Book Image */}
        <div className="relative h-96 md:h-[600px] w-full shadow-lg rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
          {/* Book Icon Placeholder */}
          <div className="text-8xl text-gray-400">📚</div>
        </div>

        {/* Book Details */}
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">{book.title}</h1>
          <p className="text-xl text-gray-600 mb-4">by {book.author}</p>
          
          <div className="flex items-center mb-4">
            {renderStars(book.rating)}
            <span className="text-md text-gray-500 ml-2">({book.reviewCount} reviews)</span>
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed">{book.description}</p>

          <div className="mb-4">
            {book.genre.map((g) => (
              <span key={g} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                {g}
              </span>
            ))}
          </div>

          <div className="text-3xl font-bold text-blue-600 mb-6">${book.price.toFixed(2)}</div>

          <div className="flex items-center space-x-4 mb-6">
            <label htmlFor="quantity" className="font-semibold">Quantity:</label>
            <input
              type="number"
              id="quantity"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button 
            onClick={handleAddToCart}
            disabled={!book.inStock || isAdding || isAddedToCart}
            className={`w-full py-3 rounded-md transition-colors duration-300 text-lg font-semibold ${
              !book.inStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isAddedToCart
                ? 'bg-green-600 text-white cursor-not-allowed'
                : isAdding
                ? 'bg-blue-400 text-white cursor-wait'
                : 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
            }`}
          >
            {isAddedToCart ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Added to Cart {cartQuantity > 0 && `(${cartQuantity})`}
              </span>
            ) : isAdding ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </span>
            ) : !book.inStock ? (
              'Out of Stock'
            ) : (
              'Add to Cart'
            )}
          </button>

          <Link href="/" className="text-blue-500 hover:underline mt-6 text-center cursor-pointer">
            &larr; Back to Home
          </Link>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Reviews</h2>
        
        {bookReviews.length > 0 ? (
          <div className="space-y-6">
            {bookReviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-600">{formatDate(review.timestamp)}</span>
                    {review.verified && (
                      <>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Verified Purchase
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{review.title}</h3>
                <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">by {review.author}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No reviews yet. Be the first to review this book!</p>
          </div>
        )}
      </div>
    </div>
  );
}
