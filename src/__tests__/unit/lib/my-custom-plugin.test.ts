import {AzureApiPlugin} from '../../../lib/my-custom-plugin';
import {ApiConfig} from '../../../lib/my-custom-plugin/types';

describe('Normal Test: lib/my-custom-plugin: ', () => {
  const apiConfig: ApiConfig = {
    'tenant-id': 'tid',
    'client-id': 'cid',
    'client-secret': 'csec',
    'subscription-id': 'sid',
    'rs-group': 'rg',
    'rs-provider-ns': 'rpns',
    'rs-type': 'rt',
    'rs-name': 'rn',
    'metric-name': 'mn',
    'test-mode': true,
  };

  describe('ApiConfig: ', () => {
    it('has properties.', () => {
      expect(apiConfig).toHaveProperty('tenant-id');
      expect(apiConfig).toHaveProperty('client-id');
      expect(apiConfig).toHaveProperty('client-secret');
      expect(apiConfig).toHaveProperty('subscription-id');
      expect(apiConfig).toHaveProperty('rs-group');
      expect(apiConfig).toHaveProperty('rs-provider-ns');
      expect(apiConfig).toHaveProperty('rs-type');
      expect(apiConfig).toHaveProperty('rs-name');
      expect(apiConfig).toHaveProperty('metric-name');
    });
  });

  describe('AzureApiPlugin(): ', () => {
    it('has metadata field.', () => {
      const pluginInstance = AzureApiPlugin(apiConfig);

      expect(pluginInstance).toHaveProperty('metadata');
      expect(pluginInstance).toHaveProperty('execute');
      expect(pluginInstance.metadata).toHaveProperty('kind');
      expect(typeof pluginInstance.execute).toBe('function');
    });

    describe('execute(): ', () => {
      it('applies logic on provided api config in test-mode.', async () => {
        const pluginInstance = AzureApiPlugin(apiConfig);
        const inputs = [
          {
            duration: 3600,
            timestamp: '2024-09-18T00:00:00Z',
          },
        ];

        const response = await pluginInstance.execute(inputs, {});
        expect(typeof response).toBe(typeof inputs);
        expect(response.length).toEqual(inputs.length);
        expect(response[0]).toHaveProperty('throughput');
        expect(response[0].throughput).not.toBeUndefined();
      });
    });
  });
});

describe('Exception Test: lib/my-custom-plugin: ', () => {
  const apiConfig: ApiConfig = {
    'tenant-id': 'tid',
    'client-id': 'cid',
    'client-secret': 'csec',
    'subscription-id': 'sid',
    'rs-group': 'rg',
    'rs-provider-ns': 'rpns',
    'rs-type': 'rt',
    'rs-name': 'rn',
    'metric-name': 'mn',
    'test-mode': false,
  };

  describe('AzureApiPlugin(): ', () => {
    describe('execute(): ', () => {
      it('applies logic on missing input array, expecting exception.', async () => {
        const pluginInstance = AzureApiPlugin(apiConfig);
        const inputs = [{}];

        try {
          await pluginInstance.execute(inputs, {});
        } catch (error: any) {
          expect(error.message).toMatch("Input's timestamp is invalid");
        }
      });

      it('applies logic on missing api config, expecting exception.', async () => {
        const pluginInstance = AzureApiPlugin(apiConfig);
        const inputs = [
          {
            duration: 3600,
            timestamp: '2024-09-18T00:00:00Z',
          },
        ];

        try {
          await pluginInstance.execute(inputs, {});
        } catch (error: any) {
          expect(error.message).toMatch('Failed to request token!');
        }
      });
    });
  });
});
