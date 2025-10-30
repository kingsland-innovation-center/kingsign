import assert from 'assert';
import app from '../../src/app';

describe('\'email-verification\' service', () => {
  it('registered the service', () => {
    const service = app.service('email-verification');

    assert.ok(service, 'Registered the service');
  });
});
