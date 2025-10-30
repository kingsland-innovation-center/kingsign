import assert from 'assert';
import app from '../../src/app';

describe('\'documents\' service', () => {
  it('registered the service', () => {
    const service = app.service('documents');

    assert.ok(service, 'Registered the service');
  });

  it('can archive and unarchive a document', async () => {
    const service = app.service('documents');
    const created = await service.create({ title: 'DocTest', creator_account_id: '507f1f77bcf86cd799439021', status: 'pending', file_id: '507f1f77bcf86cd799439022', template_id: '507f1f77bcf86cd799439023' });
    const archived = await service.patch(created._id, { archived: true });
    assert.strictEqual(archived.archived, true);
    const unarchived = await service.patch(created._id, { archived: false });
    assert.strictEqual(unarchived.archived, false);
  });

  it('does not return archived documents by default', async () => {
    const service = app.service('documents');
    const created = await service.create({ title: 'DocTest2', creator_account_id: '507f1f77bcf86cd799439024', status: 'pending', file_id: '507f1f77bcf86cd799439025', template_id: '507f1f77bcf86cd799439026', archived: true });
    const found = await service.find({ query: { _id: created._id } });
    assert.strictEqual(Array.isArray(found.data) ? found.data.length : found.length, 0);
  });

  it('can return archived documents if explicitly queried', async () => {
    const service = app.service('documents');
    const created = await service.create({ title: 'DocTest3', creator_account_id: '507f1f77bcf86cd799439027', status: 'pending', file_id: '507f1f77bcf86cd799439028', template_id: '507f1f77bcf86cd799439029', archived: true });
    const found = await service.find({ query: { _id: created._id, archived: true } });
    assert.strictEqual(Array.isArray(found.data) ? found.data.length : found.length, 1);
    assert.strictEqual((Array.isArray(found.data) ? found.data[0] : found[0]).archived, true);
  });
});
