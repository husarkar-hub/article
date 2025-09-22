# Cloudinary Setup Guide

## 🚀 Quick Setup Steps

### 1. Create Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. Verify your email

### 2. Get Your Credentials

1. Log into your Cloudinary dashboard
2. Go to **Dashboard** > **Settings** > **API Keys**
3. Copy the following values:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 3. Update Environment Variables

Replace the placeholder values in your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

### 4. Test Image Upload

1. Start your development server: `pnpm dev`
2. Go to create/edit article page
3. Click the **+** button in the editor
4. Select **Image**
5. Upload an image - it should now upload to Cloudinary!

## 🎯 Features Included

✅ **Automatic optimization** - Images are automatically optimized for web  
✅ **Size limits** - Max 1200x800px to prevent huge uploads  
✅ **Format conversion** - Auto-converts to best format (WebP when supported)  
✅ **Organized storage** - Images stored in `article-images/` folder  
✅ **Secure uploads** - Only authenticated users can upload  
✅ **Captions** - Users can add captions to images

## 📝 Image Upload Flow

1. User clicks **Image** tool in Editor.js
2. Selects file from computer
3. File uploads to Cloudinary via `/api/upload`
4. Cloudinary processes and optimizes image
5. Returns secure URL
6. Image appears in editor with optional caption

## 🔧 Customization

You can modify upload settings in `/src/app/api/upload/route.ts`:

- **Folder organization**: Change `folder: 'article-images'`
- **Size limits**: Modify `{ width: 1200, height: 800, crop: 'limit' }`
- **Quality**: Adjust `{ quality: 'auto' }`
- **Formats**: Change `{ fetch_format: 'auto' }`

## 🆓 Free Tier Limits

Cloudinary free tier includes:

- 25 GB storage
- 25 GB monthly bandwidth
- 1,000 transformations per month

Perfect for getting started!
