import {ERRORS} from '@grnsft/if-core/utils';
import {PluginParams, ExecutePlugin} from '@grnsft/if-core/types';
import {
  ApiConfig,
  TokenResult,
  MetricResult,
  MetricTimeSeriesData,
} from './types';

const {GlobalConfigError} = ERRORS;
const {InputValidationError} = ERRORS;

export const AzureApiPlugin = (globalConfig: ApiConfig): ExecutePlugin => {
  const metadata = {
    kind: 'execute',
  };

  /**
   * Validates global config.
   */
  const validateGlobalConfig = () => {
    if (!globalConfig) {
      throw new GlobalConfigError('Global config must be provided.');
    }

    // validator checks can be applied if needed
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
    //console.log('=> GlobalConfig: ', globalConfig);
  };

  /**
   * Execute's strategy description here.
   */
  const execute = async (inputs: PluginParams[]): Promise<PluginParams[]> => {
    validateGlobalConfig();

    //console.log('=> before: ', inputs);

    const newInputs = inputs.map(async input => {
      // your logic here
      const data = await callAzureApi(input.timestamp);
      //console.log('=> RestAPI Response: ',data);

      return {
        ...input,
        throughput: data.average,
      };
    });

    const result = await Promise.all(newInputs);
    //console.log('=> New PluginParam Result: ', result);

    //console.log(Object.prototype.toString.call(newInputs), newInputs);

    return result;
  };

  const callAzureApi = async (
    start_time: string
  ): Promise<MetricTimeSeriesData> => {
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
      //console.log('iso timespan: ',iso_start_time, iso_end_time);
    } catch (error) {
      throw new InputValidationError(
        `Input's timestamp is invalid [${start_time}]. Exception: [${error}]`
      );
    }

    const tenantID = globalConfig['tenant-id'];
    const clientID = globalConfig['client-id'];
    const clientSecret = globalConfig['client-secret'];
    const subID = globalConfig['subscription-id'];
    const rsGroup = globalConfig['rs-group'];
    const rsProviderNS = globalConfig['rs-provider-ns'];
    const rsType = globalConfig['rs-type'];
    const rsName = globalConfig['rs-name'];
    const metricName = globalConfig['metric-name'];
    const testMode = globalConfig['test-mode'];

    if (testMode === true) {
      return {
        timeStamp: dt_start_time,
        average: 0.0,
      };
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
    //console.log(tokenApiResponse);

    if (!tokenApiResponse.ok) {
      throw new Error(
        `Failed to request token! Response status: ${tokenApiResponse.status}.`
      );
    }

    const tokenApiJSON = await tokenApiResponse.json();
    const token = tokenApiJSON as TokenResult;
    //console.log('json: ', tokenApiJSON);
    //console.log('token: ', token.access_token);

    const metricReqRsURI = `subscriptions/${subID}/resourceGroups/${rsGroup}/providers/${rsProviderNS}/${rsType}/${rsName}`;
    const metricReqApiVer = '2018-01-01';
    const metricReqTimeSpan = `${iso_start_time}/${iso_end_time}`; //'2024-09-18T00:00:00Z/2024-09-19T00:00:00Z';
    const metricReqInterval = 'PT1H';
    const metricReqQueryStr = `api-version=${metricReqApiVer}&metricnames=${metricName}&timespan=${metricReqTimeSpan}&interval=${metricReqInterval}`;
    const metricReqURL = `https://management.azure.com/${metricReqRsURI}/providers/microsoft.insights/metrics?${metricReqQueryStr}`;
    //console.log('req timespan: ', metricReqTimeSpan);
    //console.log('URL: ',metricReqURL);

    const metricApiResponse = await fetch(metricReqURL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token.access_token}`,
      },
    });
    //console.log(metricApiResponse);

    if (!metricApiResponse.ok) {
      throw new Error(
        `Failed to request metrics! Response status: ${metricApiResponse.status}.`
      );
    }

    const metricApiJSON = await metricApiResponse.json();
    const metric = metricApiJSON as MetricResult;
    //console.log('json: ', metricApiJSON);
    //console.log('time series: ', metric.value[0].timeseries[0].data[0]);

    const apiTimeSeries = metric.value[0].timeseries[0]
      .data[0] as MetricTimeSeriesData;
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
  /**
  const callRestApi = async (): Promise<ApiData> => {

    //var response: ApiData = {
	//  success: false,
	//  query: {
	//    input: 'test input',
	//  },
	//  date: new Date(),
	//  result: 'failed',
	//};

    const response = fetch('http://localhost:8080/api/random', {
	  method: 'GET',
	  headers: {
	    'Accept': 'text/html',
		'Authorization': 'Bearer xxx',
	  },
	})
	  .then(resp => resp.text())
	  .then(data => {
	    //console.log('result: ',data);
	    const apiData: ApiData = {
	      success: true,
		  query: {
		    input: 'test input',
		  },
		  date: new Date(), //'2024-09-16T00:00:00Z',
		  result: data,
	    };
	    return apiData;
	  })
	  .catch(err => {
	    //console.log('error: ',err);
		const apiData: ApiData = {
	      success: false,
		  query: {
		    input: 'test input',
		  },
		  date: new Date(), //'2024-09-16T00:00:00Z',
		  result: 'Failed. ' + err,
	    };
	    return apiData;
	  });

	return response;
  };
  **/
  return {
    metadata,
    execute,
  };
};
