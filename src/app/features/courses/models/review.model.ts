export interface CourseReview {
  id: number;
  courseId: number;
  studentId: number;
  studentName: string;
  studentAvatarUrl?: string | null;
  rating: number;
  reviewText?: string | null;
  createdAt: string;
}

export interface CourseReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingCounts: { [key: number]: number };
  ratingPercentages: { [key: number]: number };
  reviews: CourseReview[];
  userReview?: CourseReview | null;
}

export interface CreateOrUpdateReviewRequest {
  courseId: number;
  rating: number;
  reviewText?: string | null;
}
