import assert from 'assert';
import app from '../../src/app';

describe('\'create-master-account\' service', () => {
  it('registered the service', () => {
    const service = app.service('create-master-account');

    assert.ok(service, 'Registered the service');
  });
});
