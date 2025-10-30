import assert from 'assert';
import app from '../../src/app';

describe('\'workspace-invites\' service', () => {
  it('registered the service', () => {
    const service = app.service('workspace-invites');

    assert.ok(service, 'Registered the service');
  });
});
