# Image Handling Refactor

## Overview

This refactor addresses the issue where pasted images were being converted to base64 and embedded directly into markdown files, causing them to become excessively large.

## Changes Made

### Previous Behavior (Commit 49ff18f)
- Images pasted into the content textarea were converted to base64 strings
- Base64 strings were embedded directly in markdown as `![filename](data:image/...)`
- This caused markdown files to grow to several megabytes with just a few images
- Made version control diffs difficult to review
- Increased repository size significantly

### New Behavior
- Images pasted into the content textarea are now stored temporarily in browser memory
- Markdown uses a placeholder path: `![filename](/assets/TEMP/filename.png)`
- When the form is submitted:
  1. All pasted images are uploaded to GitHub at `public/assets/<slug>/`
  2. Placeholder paths in markdown are replaced with actual paths: `/assets/<slug>/filename.png`
  3. The markdown file (now much smaller) is uploaded to GitHub
- Images are organized by blog post slug for better organization
- Markdown files remain small and readable

## Technical Implementation

### File Modified
- `src/pages/admin/create-post.astro`

### Key Changes

1. **Image Storage** (lines 343, 399)
   ```typescript
   const pastedImages = new Map<string, { file: File; data: ArrayBuffer }>();
   ```
   - Stores pasted images in memory until form submission
   - Uses ArrayBuffer to maintain binary data integrity

2. **Paste Handler** (lines 401-440)
   - Generates unique timestamp-based filenames
   - Stores image data in the `pastedImages` Map
   - Inserts placeholder markdown syntax
   - Shows user-friendly feedback

3. **Form Submission** (lines 257-298)
   - Uploads all images to GitHub API first
   - Places images in `public/assets/<slug>/` directory
   - Replaces placeholder paths with actual paths
   - Handles upload errors gracefully

4. **Helper Function** (lines 189-196)
   ```typescript
   function arrayBufferToBase64(buffer: ArrayBuffer): string
   ```
   - Converts ArrayBuffer to base64 for GitHub API
   - GitHub API requires base64-encoded content

5. **User Feedback** (line 102)
   - Updated help text to inform users about image pasting feature
   - "Paste images directly - they'll be saved to assets automatically!"

## Benefits

✅ **Smaller Markdown Files**: No more huge base64 strings  
✅ **Better Version Control**: Readable diffs for markdown files  
✅ **Proper Asset Organization**: Images stored in `/public/assets/<slug>/`  
✅ **Consistent with Existing Pattern**: Follows the project's asset organization convention  
✅ **Better Performance**: Smaller files = faster git operations  
✅ **Improved User Experience**: Clear feedback on image upload status  

## File Organization

After this refactor, blog posts with images will have the following structure:

```
public/assets/
  └── my-blog-post/
      ├── image-1234567890.png
      ├── image-1234567891.jpg
      └── image-1234567892.png

src/content/blog-en/
  └── my-blog-post.md  (contains ![image](/assets/my-blog-post/image-1234567890.png))
```

## Testing

- ✅ Build passes: `npm run build` generates 50 pages successfully
- ✅ Tests pass: All 48 tests pass in `npm run test:run`
- ✅ No TypeScript errors
- ✅ No runtime errors in client-side code

## Notes

- Images are uploaded to GitHub sequentially (not in parallel) to avoid rate limiting
- If an image upload fails, the entire form submission is cancelled with an error message
- The slug is generated from the post title, ensuring consistent asset organization
- Pasted images are cleared from memory after successful form submission
