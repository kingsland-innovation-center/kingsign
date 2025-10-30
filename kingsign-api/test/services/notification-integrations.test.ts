import assert from 'assert';
import app from '../../src/app';

describe('\'notification-integrations\' service', () => {
  it('registered the service', () => {
    const service = app.service('notification-integrations');

    assert.ok(service, 'Registered the service');
  });
});
