/**
 * One-shot migration script: Telegram Vault → Cloudflare R2
 *
 * Usage:
 *   dotenv -e ../../.env -- ts-node src/media/migrate-vault-to-r2.ts
 *
 * What it does:
 *   1. Finds Block records with vault_file_id in properties (legacy Telegram storage)
 *   2. Downloads each file from Telegram via streaming
 *   3. Uploads to R2 under users/captures/{blockId}.{ext}
 *   4. Updates the Block.properties with the new storageKey (removes vault_file_id)
 */

import 'dotenv/config';
import axios from 'axios';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

const BUCKET = process.env.R2_BUCKET_NAME ?? '';
const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const BATCH_SIZE = 5;

async function downloadFromTelegram(fileId: string): Promise<{ buffer: Buffer; ext: string }> {
  const infoRes = await axios.get(
    `https://api.telegram.org/bot${BOT_TOKEN}/getFile`,
    { params: { file_id: fileId } },
  );

  const filePath: string = infoRes.data?.result?.file_path;
  if (!filePath) throw new Error(`No file_path for fileId=${fileId}`);

  const ext = filePath.split('.').pop() ?? 'bin';
  const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

  const dlRes = await axios.get(url, { responseType: 'arraybuffer', timeout: 120_000 });
  return { buffer: Buffer.from(dlRes.data), ext };
}

async function uploadToR2(buffer: Buffer, key: string, mimeType: string): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ContentLength: buffer.length,
    }),
  );
  return `${PUBLIC_URL}/${key}`;
}

const MIME_FROM_EXT: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
};

async function run() {
  if (!BUCKET || !BOT_TOKEN || !PUBLIC_URL) {
    console.error('Missing required env vars: R2_BUCKET_NAME, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL, TELEGRAM_BOT_TOKEN');
    process.exit(1);
  }

  // Find blocks that still have a vault_file_id in properties
  const blocks = await prisma.block.findMany({
    where: {
      deletedAt: null,
      properties: { path: ['vault_file_id'], not: Prisma.JsonNull },
    },
    select: { id: true, properties: true },
  });

  console.log(`Found ${blocks.length} blocks with legacy vault_file_id to migrate.`);

  let migrated = 0;
  let failed = 0;

  for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
    const batch = blocks.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (block) => {
        const props = block.properties as any;
        const vaultFileId: string = props.vault_file_id;

        try {
          console.log(`[${block.id}] Downloading from Telegram (file_id=${vaultFileId})...`);
          const { buffer, ext } = await downloadFromTelegram(vaultFileId);

          const storageKey = `users/captures/${block.id}.${ext}`;
          const mimeType = MIME_FROM_EXT[ext] ?? 'application/octet-stream';

          console.log(`[${block.id}] Uploading to R2: ${storageKey}`);
          await uploadToR2(buffer, storageKey, mimeType);

          // Update Block: replace vault_file_id with storageKey
          const updatedProps = { ...props, storageKey };
          delete (updatedProps as any).vault_file_id;

          await prisma.block.update({
            where: { id: block.id },
            data: { properties: updatedProps },
          });

          console.log(`[${block.id}] ✓ Migrated → ${storageKey}`);
          migrated++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[${block.id}] ✗ Failed: ${msg}`);
          failed++;
        }
      }),
    );

    // Throttle between batches
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\nMigration complete. Migrated: ${migrated}, Failed: ${failed}`);
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
