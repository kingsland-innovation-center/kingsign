import assert from 'assert';
import app from '../../src/app';

describe('\'aws-object-storage\' service', () => {
  it('registered the service', () => {
    const service = app.service('aws-object-storage');

    assert.ok(service, 'Registered the service');
  });

  it('validates required data for upload', async () => {
    const service = app.service('aws-object-storage');

    try {
      await service.create({});
      assert.fail('Should have thrown an error for missing file and filename');
    } catch (error: any) {
      assert.ok(error.message.includes('File and filename are required'));
    }
  });

  it('validates workspaceId is required', async () => {
    const service = app.service('aws-object-storage');
    const testBuffer = Buffer.from('test file content');

    try {
      await service.create({
        file: testBuffer,
        filename: 'test.txt'
      });
      assert.fail('Should have thrown an error for missing workspaceId');
    } catch (error: any) {
      assert.ok(error.message.includes('workspaceId is required'));
    }
  });

  it('validates buffer data', async () => {
    const service = app.service('aws-object-storage');

    try {
      await service.create({
        file: Buffer.alloc(0), // Empty buffer
        filename: 'test.txt',
        workspaceId: 'test-workspace'
      });
      assert.fail('Should have thrown an error for empty buffer');
    } catch (error: any) {
      assert.ok(error.message.includes('Invalid or empty file buffer'));
    }
  });

  it('validates non-buffer data', async () => {
    const service = app.service('aws-object-storage');

    try {
      await service.create({
        file: 'not a buffer' as any,
        filename: 'test.txt',
        workspaceId: 'test-workspace'
      });
      assert.fail('Should have thrown an error for non-buffer data');
    } catch (error: any) {
      assert.ok(error.message.includes('Invalid or empty file buffer'));
    }
  });

  // Note: Actual upload tests would require AWS credentials and S3 setup
  // These tests focus on validation and error handling
});
