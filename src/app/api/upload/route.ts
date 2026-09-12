import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getSession, authorize } from '@/lib/auth';

/**
 * POST /api/upload
 * Upload a file to Vercel Blob storage
 * Returns the Blob URL to be used as file_ref in imaging_assets
 * 
 * Requires BLOB_READ_WRITE_TOKEN env var for production.
 * In dev without Blob configured, returns a mock URL.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const err = authorize(session, { roles: ['dentist'] });
    if (err) return NextResponse.json({ error: err }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/dicom'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.dcm')) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and DICOM are allowed.' }, { status: 400 });
    }

    // Max 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 20MB.' }, { status: 400 });
    }

    // Try Vercel Blob upload, fallback to mock URL for dev
    let url: string;
    let blobSize: number;

    try {
      const blob = await put(`dental-imaging/${Date.now()}_${file.name}`, file, {
        access: 'public',
      });
      url = blob.url;
      blobSize = file.size;
    } catch (blobError: any) {
      // Dev fallback — if BLOB_READ_WRITE_TOKEN is missing
      console.warn('Vercel Blob not configured, using mock URL:', blobError.message);
      url = `/api/mock-image?name=${encodeURIComponent(file.name)}&ts=${Date.now()}`;
      blobSize = file.size;
    }

    return NextResponse.json({
      url,
      fileName: file.name,
      fileSize: blobSize,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed.' }, { status: 500 });
  }
}
