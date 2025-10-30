import assert from 'assert';
import app from '../../src/app';

describe('\'templates\' service', () => {
  it('registered the service', () => {
    const service = app.service('templates');

    assert.ok(service, 'Registered the service');
  });

  it('can archive and unarchive a template', async () => {
    const service = app.service('templates');
    const created = await service.create({ name: 'Test', file_id: '507f1f77bcf86cd799439011', created_by: '507f1f77bcf86cd799439012' });
    const archived = await service.patch(created._id, { archived: true });
    assert.strictEqual(archived.archived, true);
    const unarchived = await service.patch(created._id, { archived: false });
    assert.strictEqual(unarchived.archived, false);
  });

  it('does not return archived templates by default', async () => {
    const service = app.service('templates');
    const created = await service.create({ name: 'Test2', file_id: '507f1f77bcf86cd799439013', created_by: '507f1f77bcf86cd799439014', archived: true });
    const found = await service.find({ query: { _id: created._id } });
    assert.strictEqual(Array.isArray(found.data) ? found.data.length : found.length, 0);
  });

  it('can return archived templates if explicitly queried', async () => {
    const service = app.service('templates');
    const created = await service.create({ name: 'Test3', file_id: '507f1f77bcf86cd799439015', created_by: '507f1f77bcf86cd799439016', archived: true });
    const found = await service.find({ query: { _id: created._id, archived: true } });
    assert.strictEqual(Array.isArray(found.data) ? found.data.length : found.length, 1);
    assert.strictEqual((Array.isArray(found.data) ? found.data[0] : found[0]).archived, true);
  });
});
