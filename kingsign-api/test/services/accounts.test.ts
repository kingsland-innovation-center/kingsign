import assert from 'assert';
import app from '../../src/app';

describe('\'accounts\' service', () => {
  it('registered the service', () => {
    const service = app.service('accounts');

    assert.ok(service, 'Registered the service');
  });
});
