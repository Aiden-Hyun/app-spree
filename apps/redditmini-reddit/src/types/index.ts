export interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  karma: number;
  cakeDay: string;
  preferences?: Record<string, any>;
}

export interface Subreddit {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  rules?: string;
  iconUrl?: string;
  bannerUrl?: string;
  subscriberCount: number;
  isPrivate: boolean;
  createdAt: string;
  createdBy: string;
}

export interface Post {
  id: string;
  userId: string;
  author: string;
  subredditId: string;
  subreddit: string;
  title: string;
  content?: string;
  postType: "text" | "image" | "link" | "video";
  url?: string;
  imageUrl?: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  isStickied: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  userVote?: "upvote" | "downvote" | null;
  isSaved?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  author: string;
  postId: string;
  parentCommentId?: string;
  content: string;
  upvotes: number;
  downvotes: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  userVote?: "upvote" | "downvote" | null;
  replies?: Comment[];
}

export interface Vote {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  voteType: "upvote" | "downvote";
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  subredditId: string;
  subscribedAt: string;
}

export interface SavedItem {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  savedAt: string;
  post?: Post;
  comment?: Comment;
}


