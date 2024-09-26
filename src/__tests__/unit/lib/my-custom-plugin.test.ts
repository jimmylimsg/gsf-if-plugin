import {ERRORS} from '@grnsft/if-core/utils';
import {AzureApiPlugin} from '../../../lib/my-custom-plugin';
import {AzureApiConfig} from '../../../lib/my-custom-plugin/types';

const {GlobalConfigError} = ERRORS;
const {InputValidationError} = ERRORS;

describe('Normal Test: lib/my-custom-plugin: ', () => {
  describe('AzureApiPlugin(): ', () => {
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

    it('has metadata fields.', () => {
      const pluginInstance = AzureApiPlugin(apiConfig);

      expect(pluginInstance).toHaveProperty('metadata');
      expect(pluginInstance).toHaveProperty('execute');
      expect(pluginInstance.metadata).toHaveProperty('kind');
      expect(typeof pluginInstance.execute).toBe('function');
    });

    describe('execute(): ', () => {
      it('has expected outputs type and array length after run.', async () => {
        const pluginInstance = AzureApiPlugin(apiConfig);
        const inputs = [
          {
            duration: 3600,
            timestamp: '2024-09-18T00:00:00Z',
          },
        ];

        expect.assertions(5);
        const outputs = await pluginInstance.execute(inputs, {});
        expect(typeof outputs).toBe(typeof inputs);
        expect(outputs.length).toEqual(inputs.length);
        expect(outputs[0]).toHaveProperty('throughput');
        expect(outputs[0].throughput).not.toBeUndefined();
        expect(outputs[0].throughput).toBeGreaterThanOrEqual(0);
      });

      it('has expected outputs result after run in test-mode on provided inputs.', async () => {
        const pluginInstance = AzureApiPlugin(apiConfig);
        const inputs = [
          {
            duration: 3600,
            timestamp: '2024-09-18T00:00:00Z',
          },
        ];
        const expectedOutput = [
          {
            duration: 3600,
            timestamp: '2024-09-18T00:00:00Z',
            //apiTimespan: '2024-09-18T00:00:00.000Z/2024-09-18T01:00:00.000Z',
            throughput: 0,
          },
        ];

        expect.assertions(1);
        const outputs = await pluginInstance.execute(inputs, {});
        expect(outputs).toStrictEqual(expectedOutput);
      });

      /** if want to fully cover the test, include the actual values below:
      it('has expected outputs result after run in on provided inputs.', async () => {
        const apiConfig: AzureApiConfig = {
          'tenant-id': 'actual value',
          'client-id': 'actual value',
          'client-secret': 'actual value',
          'subscription-id': 'actual value',
          'rs-group': 'actual value',
          'rs-provider-ns': 'Microsoft.Compute',
          'rs-type': 'virtualMachines',
          'rs-name': 'actual value',
          'metric-name': 'Inbound%20Flows',
          'test-mode': false,
        };
        const pluginInstance = AzureApiPlugin(apiConfig);
        const inputs = [
          {
            duration: 3600,
            timestamp: '2024-09-18T00:00:00Z',
          },
        ];

        expect.assertions(5);
        const outputs = await pluginInstance.execute(inputs, {});
        expect(typeof outputs).toBe(typeof inputs);
        expect(outputs.length).toEqual(inputs.length);
        expect(outputs[0]).toHaveProperty('throughput');
        expect(outputs[0].throughput).not.toBeUndefined();
		expect(outputs[0].throughput).toBeGreaterThanOrEqual(0);
      });
	  **/
    });
  });
});

describe('Exception Test: lib/my-custom-plugin: ', () => {
  describe('AzureApiPlugin(): ', () => {
    it('throws an exception on missing tenant-id in api config.', async () => {
      const apiConfig: AzureApiConfig = {
        'tenant-id': '',
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
      const expectedErrorMessage = 'tenant-id must be provided.';
      expect.assertions(2);

      try {
        const pluginInstance = AzureApiPlugin(apiConfig);
        await pluginInstance.execute([{}], {});
      } catch (error) {
        expect(error).toBeInstanceOf(GlobalConfigError);
        expect(error).toStrictEqual(
          new GlobalConfigError(expectedErrorMessage)
        );
      }
    });

    it('throws an exception on missing client-id in api config.', async () => {
      const apiConfig: AzureApiConfig = {
        'tenant-id': 'tid',
        'client-id': '',
        'client-secret': 'csec',
        'subscription-id': 'sid',
        'rs-group': 'rg',
        'rs-provider-ns': 'rpns',
        'rs-type': 'rt',
        'rs-name': 'rn',
        'metric-name': 'mn',
        'test-mode': false,
      };
      const expectedErrorMessage = 'client-id must be provided.';
      expect.assertions(2);

      try {
        const pluginInstance = AzureApiPlugin(apiConfig);
        await pluginInstance.execute([{}], {});
      } catch (error) {
        expect(error).toBeInstanceOf(GlobalConfigError);
        expect(error).toStrictEqual(
          new GlobalConfigError(expectedErrorMessage)
        );
      }
    });

    it('throws an exception on missing client-secret in api config.', async () => {
      const apiConfig: AzureApiConfig = {
        'tenant-id': 'tid',
        'client-id': 'cid',
        'client-secret': '',
        'subscription-id': 'sid',
        'rs-group': 'rg',
        'rs-provider-ns': 'rpns',
        'rs-type': 'rt',
        'rs-name': 'rn',
        'metric-name': 'mn',
        'test-mode': false,
      };
      const expectedErrorMessage = 'client-secret must be provided.';
      expect.assertions(2);

      try {
        const pluginInstance = AzureApiPlugin(apiConfig);
        await pluginInstance.execute([{}], {});
      } catch (error) {
        expect(error).toBeInstanceOf(GlobalConfigError);
        expect(error).toStrictEqual(
          new GlobalConfigError(expectedErrorMessage)
        );
      }
    });

    it('throws an exception on missing subscription-id in api config.', async () => {
      const apiConfig: AzureApiConfig = {
        'tenant-id': 'tid',
        'client-id': 'cid',
        'client-secret': 'csec',
        'subscription-id': '',
        'rs-group': 'rg',
        'rs-provider-ns': 'rpns',
        'rs-type': 'rt',
        'rs-name': 'rn',
        'metric-name': 'mn',
        'test-mode': false,
      };
      const expectedErrorMessage = 'subscription-id must be provided.';
      expect.assertions(2);

      try {
        const pluginInstance = AzureApiPlugin(apiConfig);
        await pluginInstance.execute([{}], {});
      } catch (error) {
        expect(error).toBeInstanceOf(GlobalConfigError);
        expect(error).toStrictEqual(
          new GlobalConfigError(expectedErrorMessage)
        );
      }
    });

    it('throws an exception on missing rs-group in api config.', async () => {
      const apiConfig: AzureApiConfig = {
        'tenant-id': 'tid',
        'client-id': 'cid',
        'client-secret': 'csec',
        'subscription-id': 'sid',
        'rs-group': '',
        'rs-provider-ns': 'rpns',
        'rs-type': 'rt',
        'rs-name': 'rn',
        'metric-name': 'mn',
        'test-mode': false,
      };
      const expectedErrorMessage = 'rs-group must be provided.';
      expect.assertions(2);

      try {
        const pluginInstance = AzureApiPlugin(apiConfig);
        await pluginInstance.execute([{}], {});
      } catch (error) {
        expect(error).toBeInstanceOf(GlobalConfigError);
        expect(error).toStrictEqual(
          new GlobalConfigError(expectedErrorMessage)
        );
      }
    });

    it('throws an exception on missing rs-provider-ns in api config.', async () => {
      const apiConfig: AzureApiConfig = {
        'tenant-id': 'tid',
        'client-id': 'cid',
        'client-secret': 'csec',
        'subscription-id': 'sid',
        'rs-group': 'rg',
        'rs-provider-ns': '',
        'rs-type': 'rt',
        'rs-name': 'rn',
        'metric-name': 'mn',
        'test-mode': false,
      };
      const expectedErrorMessage = 'rs-provider-ns must be provided.';
      expect.assertions(2);

      try {
        const pluginInstance = AzureApiPlugin(apiConfig);
        await pluginInstance.execute([{}], {});
      } catch (error) {
        expect(error).toBeInstanceOf(GlobalConfigError);
        expect(error).toStrictEqual(
          new GlobalConfigError(expectedErrorMessage)
        );
      }
    });

    it('throws an exception on missing rs-type in api config.', async () => {
      const apiConfig: AzureApiConfig = {
        'tenant-id': 'tid',
        'client-id': 'cid',
        'client-secret': 'csec',
        'subscription-id': 'sid',
        'rs-group': 'rg',
        'rs-provider-ns': 'rpns',
        'rs-type': '',
        'rs-name': 'rn',
        'metric-name': 'mn',
        'test-mode': false,
      };
      const expectedErrorMessage = 'rs-type must be provided.';
      expect.assertions(2);

      try {
        const pluginInstance = AzureApiPlugin(apiConfig);
        await pluginInstance.execute([{}], {});
      } catch (error) {
        expect(error).toBeInstanceOf(GlobalConfigError);
        expect(error).toStrictEqual(
          new GlobalConfigError(expectedErrorMessage)
        );
      }
    });

    it('throws an exception on missing rs-name in api config.', async () => {
      const apiConfig: AzureApiConfig = {
        'tenant-id': 'tid',
        'client-id': 'cid',
        'client-secret': 'csec',
        'subscription-id': 'sid',
        'rs-group': 'rg',
        'rs-provider-ns': 'rpns',
        'rs-type': 'rt',
        'rs-name': '',
        'metric-name': 'mn',
        'test-mode': false,
      };
      const expectedErrorMessage = 'rs-name must be provided.';
      expect.assertions(2);

      try {
        const pluginInstance = AzureApiPlugin(apiConfig);
        await pluginInstance.execute([{}], {});
      } catch (error) {
        expect(error).toBeInstanceOf(GlobalConfigError);
        expect(error).toStrictEqual(
          new GlobalConfigError(expectedErrorMessage)
        );
      }
    });

    it('throws an exception on missing metric-name in api config.', async () => {
      const apiConfig: AzureApiConfig = {
        'tenant-id': 'tid',
        'client-id': 'cid',
        'client-secret': 'csec',
        'subscription-id': 'sid',
        'rs-group': 'rg',
        'rs-provider-ns': 'rpns',
        'rs-type': 'rt',
        'rs-name': 'rn',
        'metric-name': '',
        'test-mode': false,
      };
      const expectedErrorMessage = 'metric-name must be provided.';
      expect.assertions(2);

      try {
        const pluginInstance = AzureApiPlugin(apiConfig);
        await pluginInstance.execute([{}], {});
      } catch (error) {
        expect(error).toBeInstanceOf(GlobalConfigError);
        expect(error).toStrictEqual(
          new GlobalConfigError(expectedErrorMessage)
        );
      }
    });

    describe('execute(): ', () => {
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

      it('throws an exception on invalid timestamp value from input array.', async () => {
        const pluginInstance = AzureApiPlugin(apiConfig);
        const inputs = [{}];
        const expectedErrorMessage = "Input's timestamp is invalid";
        expect.assertions(2);

        try {
          await pluginInstance.execute(inputs, {});
        } catch (error: any) {
          expect(error).toBeInstanceOf(InputValidationError);
          expect(error.message).toMatch(expectedErrorMessage);
        }
      });

      it('throws an exception on invalid token details from api config.', async () => {
        const pluginInstance = AzureApiPlugin(apiConfig);
        const inputs = [
          {
            duration: 3600,
            timestamp: '2024-09-18T00:00:00Z',
          },
        ];
        const expectedErrorMessage = 'Failed to request token!';
        expect.assertions(1);

        try {
          await pluginInstance.execute(inputs, {});
        } catch (error: any) {
          expect(error.message).toMatch(expectedErrorMessage);
        }
      });

      /** if want to fully cover the test, include the actual values below:
      it('throws an exception on invalid metric details from api config.', async () => {
        const apiConfig: AzureApiConfig = {
          'tenant-id': 'actual value',
          'client-id': 'actual value',
          'client-secret': 'actual value',
          'subscription-id': 'sid',
          'rs-group': 'rg',
          'rs-provider-ns': 'Microsoft.Compute',
          'rs-type': 'rt',
          'rs-name': 'rn',
          'metric-name': 'mn',
          'test-mode': false,
        };
        const pluginInstance = AzureApiPlugin(apiConfig);
        const inputs = [
          {
            duration: 3600,
            timestamp: '2024-09-18T00:00:00Z',
          },
        ];
		const expectedErrorMessage = 'Failed to request metrics!';
        expect.assertions(1);

        try {
          await pluginInstance.execute(inputs, {});
        } catch (error: any) {
          expect(error.message).toMatch(expectedErrorMessage);
        }
      });
	  **/
    });
  });
});
