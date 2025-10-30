import assert from 'assert';
import app from '../../src/app';

describe('\'document-emails\' service', () => {
  it('registered the service', () => {
    const service = app.service('document-emails');

    assert.ok(service, 'Registered the service');
  });
});
