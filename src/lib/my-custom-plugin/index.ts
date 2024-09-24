import {ERRORS} from '@grnsft/if-core/utils';
import {PluginParams, ExecutePlugin} from '@grnsft/if-core/types';
import {
  AzureApiConfig,
  TokenResult,
  MetricResult,
  MetricTimeSeriesData,
  ApiConfig,
  ApiData,
} from './types';

const {GlobalConfigError} = ERRORS;
const {InputValidationError} = ERRORS;

export const AzureApiPlugin = (globalConfig: AzureApiConfig): ExecutePlugin => {
  const metadata = {
    kind: 'execute',
  };

  /**
   * Validates global config.
   */
  const validateGlobalConfig = () => {
    //console.log('validateGlobalConfig() => globalConfig: ', globalConfig);
    if (!globalConfig) {
      throw new GlobalConfigError('Global config must be provided.');
    }

    if (!globalConfig['tenant-id'])
      throw new GlobalConfigError('tenant-id must be provided.');
    if (!globalConfig['client-id'])
      throw new GlobalConfigError('client-id must be provided.');
    if (!globalConfig['client-secret'])
      throw new GlobalConfigError('client-secret must be provided.');
    if (!globalConfig['subscription-id'])
      throw new GlobalConfigError('subscription-id must be provided.');
    if (!globalConfig['rs-group'])
      throw new GlobalConfigError('rs-group must be provided.');
    if (!globalConfig['rs-provider-ns'])
      throw new GlobalConfigError('rs-provider-ns must be provided.');
    if (!globalConfig['rs-type'])
      throw new GlobalConfigError('rs-type must be provided.');
    if (!globalConfig['rs-name'])
      throw new GlobalConfigError('rs-name must be provided.');
    if (!globalConfig['metric-name'])
      throw new GlobalConfigError('metric-name must be provided.');
  };

  /**
   * Validates input data.
   */
  const validateInput = (inputs: PluginParams[]): PluginParams[] => {
    if (!inputs) {
      throw new InputValidationError('Input must be provided.');
    }

    const safeInputs = inputs.map(input => {
      const start_time = input.timestamp;
      let dt_start_time: Date;
      let dt_end_time: Date;
      let iso_start_time: string;
      let iso_end_time: string;

      try {
        dt_start_time = new Date(start_time);
        dt_end_time = new Date(start_time);
        dt_end_time.setHours(dt_start_time.getHours() + 1);
        iso_start_time = dt_start_time.toISOString();
        iso_end_time = dt_end_time.toISOString();
        //console.log('validateInput() => apiTimespan: ', iso_start_time, iso_end_time);
      } catch (error) {
        throw new InputValidationError(
          `Input's timestamp is invalid [${start_time}]. Exception: [${error}]`
        );
      }

      return {
        ...input,
        apiTimespan: `${iso_start_time}/${iso_end_time}`,
      };
    });

    return safeInputs;
  };

  /**
   * AzureApiPlugin's main logic as below:
   * - Takes input which is a timeseries of some data points (e.g. energy consumed over 24 hrs per day).
   * - Validates global config.
   * - Validates inputs and extends apiTimespan (i.e. iso start and end time for each hour).
   * - Gets access token.
   * - For each hour (i.e. apiTimespan) in the timeseries, perform below:
   *   - Check if access token has expired, if so, request a new token.
   *   - Get relevant metric from Azure by calling the Azure monitoring API.
   *   - Append metric as new data point.
   * - Return final output which contains the requested metric as part of the timeseries.
   */
  const execute = async (inputs: PluginParams[]): Promise<PluginParams[]> => {
    //console.log('execute() => inputs before processed: ', inputs);
    validateGlobalConfig();
    const safeInputs = validateInput(inputs);

    const token: TokenResult = await getAzureToken();
    //console.log('execute() => token: ', token);
    const outputsPromises = safeInputs.map(async (input, index) => {
      const metricTimeSeriesData = await callAzureApi(input.apiTimespan, token);
      console.log(
        `execute() => ${index} metricTimeSeriesData: `,
        metricTimeSeriesData
      );

      return {
        ...input,
        throughput: metricTimeSeriesData.average,
      };
    });

    const outputs = await Promise.all(outputsPromises);
    //console.log('execute() => outputs after processed: ', outputs);
    //console.log(`exeucte() => outputs type: ${Object.prototype.toString.call(outputs)}, `, outputs);

    return outputs;
  };

  /**
   * Method to request Azure Api access token.
   */
  const getAzureToken = async (): Promise<TokenResult> => {
    const tenantID = globalConfig['tenant-id'];
    const clientID = globalConfig['client-id'];
    const clientSecret = globalConfig['client-secret'];
    const testMode = globalConfig['test-mode'];

    if (testMode === true) {
      return {} as TokenResult;
    }

    const tokenReqGrantType = 'client_credentials';
    const tokenReqResource = 'https://management.azure.com/';
    const tokenReqBody = `grant_type=${tokenReqGrantType}&client_id=${clientID}&client_secret=${clientSecret}&resource=${tokenReqResource}`;
    const tokenReqURL = `https://login.microsoftonline.com/${tenantID}/oauth2/token`;
    const tokenReqContentType = 'application/x-www-form-urlencoded';

    const tokenApiResponse = await fetch(tokenReqURL, {
      method: 'POST',
      headers: {
        'Content-Type': tokenReqContentType,
      },
      body: tokenReqBody,
    });
    //console.log('getAzureToken() => fetch response: ', tokenApiResponse);

    if (!tokenApiResponse.ok) {
      throw new Error(
        `Failed to request token! Response status: ${tokenApiResponse.status}.`
      );
    }

    const tokenApiJSON = await tokenApiResponse.json();
    const token = tokenApiJSON as TokenResult;
    //console.log('getAzureToken() => response json: ', tokenApiJSON);
    //console.log('getAzureToken() => token.access_token: ', token.access_token);

    return token;
  };

  /**
   * Method to request Azure metric.
   */
  const callAzureApi = async (
    apiTimespan: string,
    token: TokenResult
  ): Promise<MetricTimeSeriesData> => {
    const subID = globalConfig['subscription-id'];
    const rsGroup = globalConfig['rs-group'];
    const rsProviderNS = globalConfig['rs-provider-ns'];
    const rsType = globalConfig['rs-type'];
    const rsName = globalConfig['rs-name'];
    const metricName = globalConfig['metric-name'];
    const testMode = globalConfig['test-mode'];

    if (testMode === true) {
      return {
        timeStamp: new Date(),
        average: 0.0,
      } as MetricTimeSeriesData;
    }

    const curUnixTimeInSec = Math.floor(Date.now() / 1000);
    if (!token.expires_on || +token.expires_on + 300 < curUnixTimeInSec) {
      //console.log('callAzureApi() => Getting new token!');
      const newToken = await getAzureToken();
      //console.log('callAzureApi() => newToken: ', newToken);

      token.token_type = newToken.token_type;
      token.expires_in = newToken.expires_in;
      token.ext_expires_in = newToken.ext_expires_in;
      token.expires_on = newToken.expires_on;
      token.not_before = newToken.not_before;
      token.resource = newToken.resource;
      token.access_token = newToken.access_token;
    }
    //console.log(`callAzureApi() => curUnixTimeInSec: ${curUnixTimeInSec}, token.expires_on: ${token.expires_on}.`);

    const metricReqRsURI = `subscriptions/${subID}/resourceGroups/${rsGroup}/providers/${rsProviderNS}/${rsType}/${rsName}`;
    const metricReqApiVer = '2018-01-01';
    const metricReqTimeSpan = apiTimespan; //'2024-09-18T00:00:00Z/2024-09-19T00:00:00Z';
    const metricReqInterval = 'PT1H';
    const metricReqQueryStr = `api-version=${metricReqApiVer}&metricnames=${metricName}&timespan=${metricReqTimeSpan}&interval=${metricReqInterval}`;
    const metricReqURL = `https://management.azure.com/${metricReqRsURI}/providers/microsoft.insights/metrics?${metricReqQueryStr}`;
    //console.log('callAzureApi() => metricReqTimeSpan: ', metricReqTimeSpan);
    //console.log('callAzureApi() => metricReqURL: ', metricReqURL);

    const metricApiResponse = await fetch(metricReqURL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token.access_token}`,
      },
    });
    //console.log('callAzureApi() => metricApiResponse: ', metricApiResponse);

    if (!metricApiResponse.ok) {
      throw new Error(
        `Failed to request metrics! Response status: ${metricApiResponse.status}.`
      );
    }

    const metricApiJSON = await metricApiResponse.json();
    const metric = metricApiJSON as MetricResult;
    //console.log('callAzureApi() => metricApiJSON: ', metricApiJSON);

    const apiTimeSeries = metric.value[0].timeseries[0]
      .data[0] as MetricTimeSeriesData;
    //console.log('callAzureApi() => apiTimeSeries: ', apiTimeSeries);
    let newAverage = 0.0;

    if (apiTimeSeries.average) {
      newAverage = Math.round(apiTimeSeries.average * 100) / 100;
    }
    const newTimeSeries: MetricTimeSeriesData = {
      timeStamp: apiTimeSeries.timeStamp,
      average: newAverage,
    };

    return newTimeSeries;
  };

  return {
    metadata,
    execute,
  };
};

export const RestApiPlugin = (globalConfig: ApiConfig): ExecutePlugin => {
  const metadata = {
    kind: 'execute',
  };

  /**
   * Validates global config.
   */
  const validateGlobalConfig = () => {
    //console.log('validateGlobalConfig() => globalConfig: ', globalConfig);
    if (!globalConfig) {
      throw new GlobalConfigError('Global config must be provided.');
    }
  };

  /**
   * Validates input data.
   */
  const validateInput = (inputs: PluginParams[]): PluginParams[] => {
    if (!inputs) {
      throw new InputValidationError('Input must be provided.');
    }

    const safeInputs = inputs.map(input => {
      //any parsing logic here.

      return {
        ...input,
      };
    });

    return safeInputs;
  };

  /**
   * RestApiPlugin's main logic as below:
   * - Takes input which is a timeseries of some data points (e.g. energy consumed over 24 hrs per day).
   * - For each hour (i.e. timestamp) in the timeseries, performs below:
   *   - Calls any rest api.
   *   - Appends result as new data point.
   * - Returns output which contains the result as part of the timeseries.
   */
  const execute = async (inputs: PluginParams[]): Promise<PluginParams[]> => {
    //console.log('execute() => inputs before processed: ', inputs);
    validateGlobalConfig();
    const safeInputs = validateInput(inputs);

    const outputsPromises = safeInputs.map(async (input, index) => {
      const url = globalConfig['url'];
      const options = globalConfig['options'];

      let apiData: ApiData;
      try {
        apiData = await callRestApi(url, options);
        console.log(`execute() => ${index} apiData: `, apiData);
      } catch (error: any) {
        apiData = error;
        console.log(`execute() => ${index} error: `, error);
      }

      return {
        ...input,
        result: apiData.result,
      };
    });

    const outputs = await Promise.all(outputsPromises);
    //console.log('execute() => outputs after processed: ', outputs);
    //console.log(`exeucte() => outputs type: ${Object.prototype.toString.call(outputs)}, `, outputs);

    return outputs;
  };

  const callRestApi = async (url: string, options?: any): Promise<ApiData> => {
    const testMode = globalConfig['test-mode'];

    //apiData template;
    const apiData: ApiData = {
      success: false,
      query: {
        input: options.body,
      },
      date: new Date(),
      result: {},
    };

    if (testMode === true) {
      apiData.success = true;
      apiData.result = 'test mode';
      return apiData;
    }

    try {
      const resp = await fetch(url, options);
      //console.log('callRestApi() => resp: ', resp);
      if (!resp.ok) {
        throw new Error(`Api responded with error status: ${resp.status}`);
      }
      const data = await resp.text();
      //console.log('callRestApi() => data: ', data);
      apiData.success = true;
      apiData.result = data;
      return Promise.resolve(apiData);
    } catch (error) {
      //console.log('callRestApi() => error: ', error);
      apiData.success = false;
      apiData.result = error;
      return Promise.reject(apiData);
    }
  };

  return {
    metadata,
    execute,
  };
};
