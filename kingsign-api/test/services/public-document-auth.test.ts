import assert from 'assert';
import app from '../../src/app';

describe('\'public-document-auth\' service', () => {
  it('registered the service', () => {
    const service = app.service('public-document-auth');

    assert.ok(service, 'Registered the service');
  });
});
