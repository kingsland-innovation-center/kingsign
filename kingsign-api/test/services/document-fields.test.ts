import assert from 'assert';
import app from '../../src/app';

describe('\'document-fields\' service', () => {
  it('registered the service', () => {
    const service = app.service('document-fields');

    assert.ok(service, 'Registered the service');
  });
});
