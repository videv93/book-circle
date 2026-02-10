import type { Book, UserBook, ReadingStatus } from '@prisma/client';

/**
 * Standard action result type for server actions
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * UserBook with included Book relation
 */
export interface UserBookWithBook extends UserBook {
  book: Book;
}

/**
 * Status information for a user's book
 */
export interface UserBookStatus {
  isInLibrary: boolean;
  status?: ReadingStatus;
  progress?: number;
  userBook?: UserBookWithBook;
}

/**
 * Error returned when a free tier user hits the book limit.
 * Superset of ActionResult failure — existing consumers still work.
 */
export type BookLimitError = {
  success: false;
  error: string;
  code: 'BOOK_LIMIT_REACHED';
  premiumStatus: string;
  currentBookCount: number;
  maxBooks: number;
};

/**
 * Result type for addToLibrary that includes the book limit error branch.
 */
export type AddToLibraryResult =
  | { success: true; data: UserBookWithBook }
  | { success: false; error: string }
  | BookLimitError;

/**
 * Input type for adding a book to library
 */
export interface AddToLibraryInput {
  title: string;
  authors: string[];
  isbn10?: string;
  isbn13?: string;
  coverUrl?: string;
  pageCount?: number;
  publishedYear?: number;
  description?: string;
  status: 'CURRENTLY_READING' | 'FINISHED' | 'WANT_TO_READ';
}
