import assert from 'assert';
import app from '../../src/app';

describe('\'signature-footprint\' service', () => {
  it('registered the service', () => {
    const service = app.service('signature-footprints');

    assert.ok(service, 'Registered the service');
  });
});
