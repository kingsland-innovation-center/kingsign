import assert from 'assert';
import app from '../../src/app';

describe('\'mailgun\' service', () => {
  it('registered the service', () => {
    const service = app.service('mailgun');

    assert.ok(service, 'Registered the service');
  });
});
