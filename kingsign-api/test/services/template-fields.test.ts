import assert from 'assert';
import app from '../../src/app';

describe('\'template-fields\' service', () => {
  it('registered the service', () => {
    const service = app.service('template-fields');

    assert.ok(service, 'Registered the service');
  });
});
