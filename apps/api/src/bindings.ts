export type Env = {
  DB: D1Database;
  BUCKET: R2Bucket;
  ADMIN_SECRET: string;
  JWT_SECRET: string;
  PUBLIC_ORIGINS: string;
  R2_PUBLIC_BASE_URL: string;
  R2_BUCKET_NAME: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_PRESIGN_ENABLED?: string;
  AUTO_IMPORT_ENABLED?: string;
  AUTO_DAILY_PUBLISH?: string;
  THEMEALDB_API_KEY?: string;
};
