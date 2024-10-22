import dotenv from 'dotenv';

dotenv.config();

export const SCOPES = ['https://www.googleapis.com/auth/drive'];

export const google_client_email = process.env.GOOGLE_CLIENT_EMAIL;
export const google_drive_parent_id = process.env.GOOGLE_DRIVE_PARENT_ID;
export const google_private_key = process.env.GOOGLE_PRIVATE_KEY!.replace(
  /\\n/g,
  '\n'
);
export const port = process.env.PORT || 3000;
