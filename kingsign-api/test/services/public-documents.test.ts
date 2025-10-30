import assert from 'assert';
import app from '../../src/app';

describe('\'public-documents\' service', () => {
  it('registered the service', () => {
    const service = app.service('public-documents');

    assert.ok(service, 'Registered the service');
  });
});
