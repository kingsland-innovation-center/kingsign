import { Id, NullableId, Paginated, Params, ServiceMethods } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Files } from '../files/files.interface';

interface Data {
  file?: Buffer;
  filename?: string;
  contentType?: string;
  workspaceId?: string;
  accountId?: string;
  fileRecord?: Files;
}

interface ServiceOptions {}

export class AwsObjectStorage implements ServiceMethods<any> {
  app: Application;
  options: ServiceOptions;
  s3Client: S3Client;

  constructor (options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
    
    // Initialize S3 client
    this.s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ''
      },
      forcePathStyle: true, // This helps with S3-compatible services
    });
  }

  async get (id: Id, params?: Params): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_SPACE,
        Key: id.toString()
      });

      // Generate a signed URL that expires in 1 hour
      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

      return signedUrl;
    } catch (error: any) {
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }

  async create (data: Data | Data[], params?: Params): Promise<Data | Data[]> {
    if (Array.isArray(data)) {
      const results = await Promise.all(data.map(current => this.create(current, params)));
      return results as Data[];
    }

    if (!data.file || !data.filename) {
      throw new Error('File and filename are required');
    }

    if (!data.workspaceId) {
      throw new Error('workspaceId is required');
    }

    // Validate and reconstruct the buffer
    const fileData = data.file as any; // Cast to any to handle serialized Buffer objects
    
    console.log('Backend buffer validation:', {
      hasFile: !!fileData,
      isBuffer: Buffer.isBuffer(fileData),
      length: fileData ? fileData.length : 'N/A',
      type: typeof fileData,
      fileData: fileData && typeof fileData === 'object' ? Object.keys(fileData).slice(0, 5) : 'N/A'
    });
    
    if (!fileData) {
      throw new Error('No file data provided');
    }
    
    let buffer: Buffer;
    
    // If it's already a Buffer, use it directly
    if (Buffer.isBuffer(fileData)) {
      buffer = fileData;
    }
    // If it's a serialized Buffer object (from HTTP transmission)
    else if (typeof fileData === 'object' && fileData.type === 'Buffer' && Array.isArray(fileData.data)) {
      console.log('Reconstructing Buffer from serialized data');
      buffer = Buffer.from(fileData.data);
    }
    // If it's a plain object with numeric keys (another serialization format)
    else if (typeof fileData === 'object' && Object.keys(fileData).every(key => !isNaN(parseInt(key)))) {
      console.log('Reconstructing Buffer from numeric keys object');
      const keys = Object.keys(fileData).map(k => parseInt(k)).sort((a, b) => a - b);
      const values = keys.map(k => fileData[k] as number);
      buffer = Buffer.from(values);
    }
    // Try to convert from array-like object
    else if (typeof fileData === 'object' && 'length' in fileData) {
      console.log('Reconstructing Buffer from array-like object');
      const array = Array.from(fileData as ArrayLike<number>);
      buffer = Buffer.from(array);
    }
    else {
      const keys = typeof fileData === 'object' ? Object.keys(fileData).slice(0, 10).join(', ') : 'N/A';
      throw new Error(`File data is not in a recognized Buffer format, got: ${typeof fileData}, keys: ${keys}`);
    }
    
    if (buffer.length === 0) {
      throw new Error('File buffer is empty (length: 0)');
    }
    
    console.log('Successfully reconstructed buffer:', {
      isBuffer: Buffer.isBuffer(buffer),
      length: buffer.length
    });
    
    // Update data.file to use the reconstructed buffer
    data.file = buffer;

    try {
      const key = `${Date.now()}-${data.filename}`;
      
      // Convert Buffer to Uint8Array for better S3 compatibility
      const fileBody = new Uint8Array(data.file);
      
      const command = new PutObjectCommand({
        Bucket: process.env.S3_SPACE,
        Key: key,
        Body: fileBody,
        ContentType: data.contentType || 'application/octet-stream',
        ContentLength: data.file.length,
      });

      await this.s3Client.send(command);

      const fileUrl = `${process.env.S3_BASEURL}/${key}`;
      const fileExtension = data.filename.split('.').pop() || '';
      const fileType = data.contentType || 'application/octet-stream';

      // Save file information to the files service
      const fileRecord = await this.app.service('files').create({
        fileName: data.filename,
        fileUrl,
        fileType,
        fileExtension,
        workspaceId: data.workspaceId,
        accountId: data.accountId
      });

      return {
        id: key,
        key,
        url: fileUrl,
        ...fileRecord
      };
    } catch (error: any) {
      console.error('AWS Object Storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }


  // Not needed for this service
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async find (params?: Params): Promise<Data[] | Paginated<Data>> {
    return [];
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update (id: NullableId, data: Data, params?: Params): Promise<Data> {
    return data;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async patch (id: NullableId, data: Data, params?: Params): Promise<Data> {
    return data;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async remove (id: NullableId, params?: Params): Promise<any> {
    return false;
  }
}
