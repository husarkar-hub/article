import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getAuthSession } from '@/lib/auth';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: 0, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { success: 0, message: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'article-images', // Organize uploads in a folder
          public_id: `${Date.now()}-${file.name.split('.')[0]}`, // Unique filename
          transformation: [
            { width: 1200, height: 800, crop: 'limit' }, // Limit max size
            { quality: 'auto' }, // Auto optimize quality
            { fetch_format: 'auto' } // Auto optimize format
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const uploadResult = result as any;

    // Return success response in Editor.js expected format
    return NextResponse.json({
      success: 1,
      file: {
        url: uploadResult.secure_url,
        size: uploadResult.bytes,
        name: file.name,
        title: file.name,
        extension: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: 0, message: 'Upload failed' },
      { status: 500 }
    );
  }
}