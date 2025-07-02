import sharp from 'sharp';
import { randomUUID } from 'crypto';
import type { MultipartFile } from '@fastify/multipart';

// TEMP: fall back to hard-coded credentials if env vars are not set
const DEFAULT_STORAGE_ZONE = 'mymuaythai';
const DEFAULT_API_KEY = '';

const STORAGE_HOST = 'sg.storage.bunnycdn.com';

const BUNNY_STORAGE_BASE_URL =
  `https://${STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE_NAME}`;
const PUBLIC_CDN_URL = "https://mymuaythai.b-cdn.net";

// Constants for validation
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
];

// 5 MB size limit per image (in bytes)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Resizes and compresses an image using sharp.
 * @param buffer The original image buffer.
 * @returns The processed image buffer.
 */
async function processImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({
      width: 1024,
      height: 1024,
      fit: 'inside', // a.k.a. "max"
      withoutEnlargement: true,
    })
    .webp({ quality: 80 }) // Convert to WebP for better compression
    .toBuffer();
}

/**
 * Uploads a file buffer to BunnyCDN Storage.
 * @param folder The folder to upload into.
 * @param processedBuffer The processed image buffer.
 * @returns The public CDN URL of the uploaded file.
 */
async function uploadToBunny(folder: string, processedBuffer: Buffer): Promise<string> {
  if (!BUNNY_STORAGE_ZONE_NAME || !BUNNY_STORAGE_API_KEY) {
    throw new Error('BunnyCDN credentials are not configured in environment variables.');
  }

  const fileName = `${randomUUID()}.webp`;
  const uploadUrl = `${BUNNY_STORAGE_BASE_URL}/${folder}/${fileName}`;

  console.log('Uploading to:', uploadUrl);
  console.log('Key starts with:', BUNNY_STORAGE_API_KEY.slice(0, 6));

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      AccessKey: BUNNY_STORAGE_API_KEY,
      'Content-Type': 'application/octet-stream',
    },
    body: processedBuffer as any,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Bunny upload failed:", errorBody);
    throw new Error(`Failed to upload image to BunnyCDN: ${response.status} ${response.statusText}`);
  }

  return `${PUBLIC_CDN_URL}/${folder}/${fileName}`;
}

/**
 * Validates a multipart file for correct mime-type and size.
 *
 * @throws Error if validation fails
 */
function validateMultipartFile(part: MultipartFile) {
  if (!ALLOWED_MIME_TYPES.includes(part.mimetype)) {
    throw new Error(`Unsupported file type: ${part.mimetype}. Allowed types are ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  // part.file.size is not guaranteed. We need to rely on buffer length after reading.
}

/**
 * Handles the complete upload flow: parse, resize, upload.
 * 
 * @param part - The FastifyMultipart file part
 * @param folder - Target folder in BunnyCDN
 * @returns - The Bunny CDN URL
 */
export async function handleImageUpload(part: MultipartFile, folder: 'gyms' | 'trainers'): Promise<string> {
  // Validate mime-type first (cheap synchronous check)
  validateMultipartFile(part);

  // Read stream into buffer using the helper
  const fileBuffer = await part.toBuffer();

  // Validate size after reading
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`File is too large. Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`);
  }

  // Process image
  const processedBuffer = await processImage(fileBuffer);

  // Upload to Bunny
  return uploadToBunny(folder, processedBuffer);
}

/**
 * Handles upload for up to 5 images at once.
 *
 * @param parts Array of MultipartFile objects
 * @param folder Target folder in BunnyCDN ("gyms" | "trainers")
 * @returns Array with CDN URLs in the same order as the provided files
 */
export async function handleMultipleImageUpload(
  parts: MultipartFile[],
  folder: 'gyms' | 'trainers',
): Promise<string[]> {
  if (parts.length === 0) {
    return [];
  }
  if (parts.length > 5) {
    throw new Error('You can upload at most 5 images at a time.');
  }

  const uploads: Promise<string>[] = parts.map((part) => handleImageUpload(part, folder));
  return Promise.all(uploads);
} 