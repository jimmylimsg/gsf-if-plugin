//export type TextConfig = Record<string, any>;
export type ApiConfig = {
  'tenant-id': string;
  'client-id': string;
  'client-secret': string;
  'subscription-id': string;
  'rs-group': string;
  'rs-provider-ns': string;
  'rs-type': string;
  'rs-name': string;
  'metric-name': string;
  'test-mode'?: boolean;
};
export type TokenResult = {
  token_type: string;
  expires_in: string;
  ext_expires_in: string;
  expires_on: string;
  not_before: string;
  resource: string;
  access_token: string;
};
export type MetricResult = {
  cost: number;
  timespan: string;
  interval: string;
  value: MetricValue[];
  namespace: string;
  resourceregion: string;
};
export type MetricValue = {
  id: string;
  type: string;
  name: {
    value: string; //metric name
    localizedValue: string;
  };
  displayDescription: string;
  unit: string;
  timeseries: MetricTimeSeries[];
  errorCode: string;
};
export type MetricTimeSeries = {
  metadatavalues: MetricTimeSeriesMetadata[]; //dimensions
  data: MetricTimeSeriesData[]; //time series
};
export type MetricTimeSeriesMetadata = {
  name: {
    value: string;
    localizedValue: string;
  };
  value: string;
};
export type MetricTimeSeriesData = {
  timeStamp: Date;
  average?: number;
  total?: number;
};
export type ApiData = {
  success: boolean;
  query: {
    input: string;
  };
  date: Date;
  result: string;
};
