import sharp from 'sharp';
import { randomUUID } from 'crypto';
import type { MultipartFile } from '@fastify/multipart';

// Environment variables
const BUNNY_STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE_NAME;
const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY;

const STORAGE_HOST = 'sg.storage.bunnycdn.com';

const BUNNY_STORAGE_BASE_URL =
  `https://${STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE_NAME}`;
const PUBLIC_CDN_URL = "https://mymuaythai.b-cdn.net";


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
 * @param fileName Optional custom file name
 * @returns The public CDN URL of the uploaded file.
 */
async function uploadToBunny(folder: string, processedBuffer: Buffer, fileName?: string): Promise<string> {
  if (!BUNNY_STORAGE_ZONE_NAME || !BUNNY_STORAGE_API_KEY) {
    throw new Error('BunnyCDN credentials are not configured in environment variables.');
  }

  const finalFileName = fileName ?? `${randomUUID()}.webp`;
  const uploadUrl = `${BUNNY_STORAGE_BASE_URL}/${folder}/${finalFileName}`;
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

  const cdnUrl = `${PUBLIC_CDN_URL}/${folder}/${finalFileName}`;

  return cdnUrl;
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
 * @param fileBaseName Optional base name for the file
 * @returns - The Bunny CDN URL
 */
export async function handleImageUpload(part: MultipartFile, folder: string, fileBaseName?: string): Promise<string> {
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
  let finalName: string | undefined = undefined;
  if (fileBaseName) {
    finalName = fileBaseName.endsWith('.webp') ? fileBaseName : `${fileBaseName}.webp`;
  }
  return uploadToBunny(folder, processedBuffer, finalName);
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
  folder: string,
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

/**
 * Deletes a file from Bunny storage given its public CDN URL.
 */
export async function deleteImageFromBunny(cdnUrl: string): Promise<void> {
  if (!BUNNY_STORAGE_ZONE_NAME || !BUNNY_STORAGE_API_KEY) {
    console.warn('Bunny delete skipped – missing credentials')
    return
  }

  // Extract path after CDN base
  const relativePath = cdnUrl.replace(`${PUBLIC_CDN_URL}/`, '')
  const deleteUrl = `${BUNNY_STORAGE_BASE_URL}/${relativePath}`

  const response = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: { AccessKey: BUNNY_STORAGE_API_KEY },
  })

  if (!response.ok) {
    console.error('Failed to delete image from BunnyCDN:', response.status, await response.text())
  }
}