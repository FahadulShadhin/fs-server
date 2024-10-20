import * as fs from 'fs';

import { google, drive_v3 } from 'googleapis';
import path from 'path';
import {
  google_client_email,
  google_drive_parent_id,
  google_private_key,
  SCOPES,
} from '../variables';

export default class GoogleDriveService {
  private async authorize() {
    const jwtClient = new google.auth.JWT({
      email: google_client_email,
      key: google_private_key,
      scopes: SCOPES,
    });
    await jwtClient.authorize();
    return jwtClient;
  }

  public async getDriveInstance(): Promise<drive_v3.Drive> {
    const auth = await this.authorize();
    return google.drive({
      version: 'v3',
      auth,
    });
  }

  public async getFileMetadata(fileId: string): Promise<any> {
    const drive = await this.getDriveInstance();
    const response = await drive.files.get({
      fileId,
      fields: 'name, mimeType, fileExtension',
    });
    return response.data;
  }

  public async uploadFile(filePath: string): Promise<drive_v3.Schema$File> {
    const fileName = path.basename(filePath);
    const drive = await this.getDriveInstance();

    if (!google_drive_parent_id) throw new Error('No parent folder was given!');

    const fileMetadata = {
      name: fileName,
      parents: [google_drive_parent_id],
    };

    const media = {
      mimeType: 'application/octet-stream',
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id',
    });

    return response.data;
  }

  public async generateDownloadLink(
    fileId: string
  ): Promise<drive_v3.Schema$File> {
    const drive = await this.getDriveInstance();

    await drive.permissions.create({
      fileId: fileId!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const response = await drive.files.get({
      fileId: fileId!,
      fields: 'webViewLink, webContentLink',
    });

    return response.data;
  }

  public async downloadFile(
    fileId: string,
    destinationPath: string
  ): Promise<void> {
    const drive = await this.getDriveInstance();
    const destination = fs.createWriteStream(destinationPath);

    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    return new Promise<void>((resolve, reject) => {
      response.data
        .on('end', () => resolve())
        .on('error', (err: any) => reject(err))
        .pipe(destination);
    });
  }
}
