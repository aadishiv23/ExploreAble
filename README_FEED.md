# Feed Functionality

This document outlines the Feed feature added to the MedLaunchApp, which allows users to share posts about their activities and interact with other users' posts.

## Features

1. **Feed Page**
   - View posts from all users
   - Like and comment on posts
   - Pull to refresh for latest posts
   - Empty state when no posts are available

2. **Create Post**
   - Share text content
   - Add photos from the device's gallery
   - Tag an activity
   - Tag friends who participated
   - Preview image before posting

3. **Comments**
   - View comments on a post
   - Add new comments
   - See who commented and when

## Implementation Details

### Database Tables

The following tables were added to the database:

- `posts`: Stores post content, images, and metadata
- `comments`: Stores comments on posts
- `post_participants`: Tracks friends tagged in posts
- `post_likes`: Tracks likes on posts

### Database Functions

- `increment_comments_count`: Updates the comment count when a new comment is added
- `increment_likes_count`: Updates the like count when a post is liked
- `decrement_likes_count`: Updates the like count when a post is unliked

### Pages Added

1. **Feed Page** (`app/feed.tsx`)
   - Displays a list of posts
   - Includes post content, images, tagged activities, and tagged friends
   - Shows like and comment counts
   - Provides a floating action button to create a new post

2. **Create Post Page** (`app/createPost.tsx`)
   - Form to create a new post
   - Options to add an image, select an activity, and tag friends
   - Preview of the selected image
   - Post button to submit the post

3. **Comments Page** (`app/comments.tsx`)
   - Displays comments for a specific post
   - Allows adding new comments
   - Shows user information and timestamp for each comment

### Home Screen Integration

The home screen now includes a Feed section with:
- A link to view all posts
- A quick access button to create a new post

## Required Dependencies

To fully implement this feature, the following dependencies need to be installed:

```bash
npm install expo-image-picker expo-image-manipulator base64-arraybuffer date-fns
```

## Storage

The feature requires a Supabase storage bucket named `post-images` to store images uploaded by users.

## Next Steps

1. Implement the like functionality (currently only UI is in place)
2. Add pagination for the feed to handle large numbers of posts
3. Add the ability to delete or edit posts
4. Implement notifications for likes and comments 