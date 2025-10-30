import assert from 'assert';
import app from '../../src/app';

describe('\'api\' service', () => {
  it('registered the service', () => {
    const service = app.service('api');

    assert.ok(service, 'Registered the service');
  });
});
