import express, { Request, Response } from 'express';
import GoogleDriveService from './services/googleDriveService';
import DBService from './services/dbService';
import { upload } from './middlewares/multerMiddleware';
import fs from 'fs';

const app = express();
const port = 3000;
const googleDriveService = new GoogleDriveService();
const db = new DBService();


app.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const { hashedPassCode, sharedKey } = JSON.parse(
        req.headers['x-additional-data'] as string
      );

      if (!req.file || !hashedPassCode || !sharedKey) {
        res.status(400).send('Something went wrong white getting file...');
        return;
      }

      const filePath = req.file.path;
      let driveResponse, downloadLink = null;

      try {
        driveResponse = await googleDriveService.uploadFile(filePath);
        downloadLink = await googleDriveService.generateDownloadLink(
          driveResponse?.id!
        );
      } catch (error) {
        console.log('Error in google drive service:', error);
        res.status(500).json({
          fileId: null,
          downloadLink: null,
          error,
        });
      }

      try {
        const fileId = driveResponse?.id!;
        const newSecureFile = await db.createSecureFile(
          hashedPassCode,
          sharedKey,
          fileId
        );
      } catch (error) {
        console.log('Error in database service:', error);
        res.status(500).json({ error });
      }

      fs.unlink(filePath, (error) => {
        if (error) {
          console.error('Error deleting file:', error);
        } else {
          console.log('Temporary file deleted:', filePath);
        }
      });

      res.status(200).json({
        fileId: driveResponse?.id,
        downloadLink: downloadLink?.webViewLink,
        message: 'success'
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).send('Internal Server Error');
    }
  }
);

app.get('/file/:sharedKey', async (req: Request, res: Response) => {
  const sharedKey = req.params.sharedKey;

  try {
    const file = await db.getSecureFile(sharedKey);

    res.status(200).json({
      message: 'Success',
      hashedPassCode: file?.hashedPassCode,
      fileId: file?.fileId,
    });
  } catch (error) {
    console.log('Error while getting file:', error);
    res.status(500).json({ 
      message: "Error while getting file",
      error 
    });
  }
});


app.get('/download/:fileId', async (req: Request, res: Response) => {
  const fileId = req.params.fileId;

  try {
      const fileMetadata = await googleDriveService.getFileMetadata(fileId);
      const fileName = fileMetadata.name;

      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      const drive = await googleDriveService.getDriveInstance();
      const fileStream = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      fileStream.data
        .on('end', () => {
          console.log('File streamed successfully:', fileName);
        })
        .on('error', (err: any) => {
          console.error('Error while streaming file:', err);
          res.status(500).send('Error downloading the file.');
        })
        .pipe(res);
    } catch (error) {
      console.error('Error downloading file from Google Drive:', error);
      res.status(500).send('Failed to download the file.');
    }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
