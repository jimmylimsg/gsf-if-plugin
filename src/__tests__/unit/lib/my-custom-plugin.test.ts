import {AzureApiPlugin} from '../../../lib/my-custom-plugin';
import {AzureApiConfig} from '../../../lib/my-custom-plugin/types';

describe('Normal Test: lib/my-custom-plugin: ', () => {
  const apiConfig: AzureApiConfig = {
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

  describe('AzureApiConfig: ', () => {
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

        const outputs = await pluginInstance.execute(inputs, {});
        expect(typeof outputs).toBe(typeof inputs);
        expect(outputs.length).toEqual(inputs.length);
        expect(outputs[0]).toHaveProperty('throughput');
        expect(outputs[0].throughput).not.toBeUndefined();
      });
    });
  });
});

describe('Exception Test: lib/my-custom-plugin: ', () => {
  const apiConfig: AzureApiConfig = {
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
      it('applies logic on invalid timestamp value from input array, expecting exception.', async () => {
        const pluginInstance = AzureApiPlugin(apiConfig);
        const inputs = [{}];

        try {
          await pluginInstance.execute(inputs, {});
        } catch (error: any) {
          expect(error.message).toMatch("Input's timestamp is invalid");
        }
      });

      it('applies logic on invalid token details from api config, expecting exception.', async () => {
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

      it('applies logic on invalid metric details from api config, expecting exception.', async () => {
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
