import {ERRORS} from '@grnsft/if-core/utils';
import {PluginParams, ExecutePlugin} from '@grnsft/if-core/types';

import {TextConfig} from './types';

const {GlobalConfigError} = ERRORS;

export const TextPlugin = (globalConfig: TextConfig): ExecutePlugin => {
  const metadata = {
    kind: 'execute',
  };

  /**
   * Validates global config.
   */
  const validateGlobalConfig = () => {
    if (!globalConfig) {
      throw new GlobalConfigError('My custom message here.');
    }

    // validator checks can be applied if needed
  };

  /**
   * Execute's strategy description here.
   */
  const execute = async (inputs: PluginParams[]): Promise<PluginParams[]> => {
    validateGlobalConfig();

    return inputs.map(input => {
      // your logic here
      //globalConfig;
      console.log(
        'testing: ' +
          globalConfig['something'] +
          ', other: ' +
          globalConfig['otherthing']
      );
      //console.log('testing: ' + globalConfig.something);

      return input;
    });
  };

  return {
    metadata,
    execute,
  };
};
