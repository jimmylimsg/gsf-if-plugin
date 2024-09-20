import {ERRORS} from '@grnsft/if-core/utils';
import {PluginParams, ExecutePlugin} from '@grnsft/if-core/types';
import {
  ApiConfig,
  TokenResult,
  MetricResult,
  MetricTimeSeriesData,
} from './types';

const {GlobalConfigError} = ERRORS;

export const AzureApiPlugin = (globalConfig: ApiConfig): ExecutePlugin => {
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
    console.log('=> GlobalConfig: ', globalConfig);
  };

  /**
   * Execute's strategy description here.
   */
  const execute = async (inputs: PluginParams[]): Promise<PluginParams[]> => {
    validateGlobalConfig();

    console.log('=> before: ', inputs);

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
    const dt_start_time: Date = new Date(start_time);
    const dt_end_time: Date = new Date(start_time);
    dt_end_time.setHours(dt_start_time.getHours() + 1);
    const iso_start_time: string = dt_start_time.toISOString();
    const iso_end_time: string = dt_end_time.toISOString();
    //console.log('iso timespan: ',iso_start_time, iso_end_time);

    const tenantID = globalConfig['tenant-id'];
    const clientID = globalConfig['client-id'];
    const clientSecret = globalConfig['client-secret'];
    const subID = globalConfig['subscription-id'];
    const rsGroup = globalConfig['rs-group'];
    const rsProviderNS = globalConfig['rs-provider-ns'];
    const rsType = globalConfig['rs-type'];
    const rsName = globalConfig['rs-name'];
    const metricName = globalConfig['metric-name'];

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
      throw new Error(`Response status: ${tokenApiResponse.status}.`);
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
      throw new Error(`Response status: ${metricApiResponse.status}.`);
    }

    const metricApiJSON = await metricApiResponse.json();
    const metric = metricApiJSON as MetricResult;
    //console.log('json: ', metricApiJSON);
    //console.log('time series: ', metric.value[0].timeseries[0].data[0]);

    const curTimeSeries = metric.value[0].timeseries[0]
      .data[0] as MetricTimeSeriesData;
    let newAverage = 0.0;

    if (curTimeSeries.average) {
      newAverage = Math.round(curTimeSeries.average * 100) / 100;
    }
    const newTimeSeries: MetricTimeSeriesData = {
      timeStamp: curTimeSeries.timeStamp,
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
