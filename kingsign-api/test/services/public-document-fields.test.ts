import assert from 'assert';
import app from '../../src/app';

describe('\'public-document-fields\' service', () => {
  it('registered the service', () => {
    const service = app.service('public-document-fields');

    assert.ok(service, 'Registered the service');
  });
});
