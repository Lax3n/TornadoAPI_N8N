import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class TornadoApi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tornado API',
		name: 'tornadoApi',
		icon: 'file:tornado.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Download videos and podcasts from YouTube, Spotify and more with Tornado API',
		defaults: {
			name: 'Tornado API',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'tornadoApi',
				required: true,
			},
		],
		properties: [
			// Resource
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Job',
						value: 'job',
					},
					{
						name: 'Batch',
						value: 'batch',
					},
					{
						name: 'Storage',
						value: 'storage',
					},
					{
						name: 'Account',
						value: 'account',
					},
				],
				default: 'job',
			},

			// ==================== JOB OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['job'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new download job',
						action: 'Create a download job',
					},
					{
						name: 'Get Status',
						value: 'getStatus',
						description: 'Get the status of a job',
						action: 'Get job status',
					},
					{
						name: 'Wait for Completion',
						value: 'waitForCompletion',
						description: 'Wait for a job to complete',
						action: 'Wait for job completion',
					},
				],
				default: 'create',
			},

			// Job Create Fields
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['create'],
					},
				},
				default: '',
				placeholder: 'https://www.youtube.com/watch?v=...',
				description: 'The video or Spotify show URL to download',
			},
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Format',
						name: 'format',
						type: 'options',
						options: [
							{ name: 'MP4', value: 'mp4' },
							{ name: 'MKV', value: 'mkv' },
							{ name: 'WebM', value: 'webm' },
							{ name: 'MOV', value: 'mov' },
						],
						default: 'mp4',
						description: 'Output container format',
					},
					{
						displayName: 'Video Codec',
						name: 'video_codec',
						type: 'options',
						options: [
							{ name: 'Copy (No Re-encode)', value: 'copy' },
							{ name: 'H.264', value: 'h264' },
							{ name: 'H.265 (HEVC)', value: 'h265' },
							{ name: 'VP9', value: 'vp9' },
						],
						default: 'copy',
						description: 'Video codec to use',
					},
					{
						displayName: 'Audio Codec',
						name: 'audio_codec',
						type: 'options',
						options: [
							{ name: 'Copy (No Re-encode)', value: 'copy' },
							{ name: 'AAC', value: 'aac' },
							{ name: 'Opus', value: 'opus' },
							{ name: 'MP3', value: 'mp3' },
						],
						default: 'copy',
						description: 'Audio codec to use',
					},
					{
						displayName: 'Audio Bitrate',
						name: 'audio_bitrate',
						type: 'options',
						options: [
							{ name: '64 kbps', value: '64k' },
							{ name: '128 kbps', value: '128k' },
							{ name: '192 kbps', value: '192k' },
							{ name: '256 kbps', value: '256k' },
							{ name: '320 kbps', value: '320k' },
						],
						default: '192k',
						description: 'Audio bitrate when transcoding',
					},
					{
						displayName: 'Video Quality (CRF)',
						name: 'video_quality',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 51,
						},
						default: 23,
						description: 'Video quality CRF (0-51, lower = better). Only used when video codec is not "copy".',
					},
					{
						displayName: 'Custom Filename',
						name: 'filename',
						type: 'string',
						default: '',
						description: 'Custom filename (without extension)',
					},
					{
						displayName: 'Folder',
						name: 'folder',
						type: 'string',
						default: '',
						description: 'S3 folder prefix for organizing files',
					},
					{
						displayName: 'Webhook URL',
						name: 'webhook_url',
						type: 'string',
						default: '',
						description: 'URL to receive completion notification',
					},
				],
			},

			// Job Get Status Fields
			{
				displayName: 'Job ID',
				name: 'jobId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['getStatus', 'waitForCompletion'],
					},
				},
				default: '',
				description: 'The UUID of the job',
			},

			// Wait for Completion Options
			{
				displayName: 'Timeout (Seconds)',
				name: 'timeout',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['waitForCompletion'],
					},
				},
				default: 600,
				description: 'Maximum time to wait for completion',
			},
			{
				displayName: 'Poll Interval (Seconds)',
				name: 'pollInterval',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['waitForCompletion'],
					},
				},
				default: 5,
				description: 'Time between status checks',
			},

			// ==================== BATCH OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['batch'],
					},
				},
				options: [
					{
						name: 'Get Status',
						value: 'getStatus',
						description: 'Get the status of a batch',
						action: 'Get batch status',
					},
				],
				default: 'getStatus',
			},

			// Batch Get Status Fields
			{
				displayName: 'Batch ID',
				name: 'batchId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['batch'],
						operation: ['getStatus'],
					},
				},
				default: '',
				description: 'The UUID of the batch',
			},

			// ==================== STORAGE OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['storage'],
					},
				},
				options: [
					{
						name: 'Configure Bucket',
						value: 'configureBucket',
						description: 'Configure your own S3/R2 bucket for file uploads',
						action: 'Configure S3 bucket',
					},
					{
						name: 'Reset to Default',
						value: 'resetBucket',
						description: 'Reset to use Tornado default storage',
						action: 'Reset to default storage',
					},
				],
				default: 'configureBucket',
			},

			// Storage Provider
			{
				displayName: 'Provider',
				name: 'provider',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['storage'],
						operation: ['configureBucket'],
					},
				},
				options: [
					{ name: 'Amazon S3', value: 'aws' },
					{ name: 'Cloudflare R2', value: 'r2' },
					{ name: 'MinIO', value: 'minio' },
					{ name: 'Other S3-Compatible', value: 'other' },
				],
				default: 'aws',
				description: 'Your storage provider',
			},

			// S3 Endpoint
			{
				displayName: 'Endpoint URL',
				name: 'endpoint',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['storage'],
						operation: ['configureBucket'],
					},
				},
				default: '',
				placeholder: 'https://s3.us-east-1.amazonaws.com',
				description: 'S3 endpoint URL. For AWS use https://s3.REGION.amazonaws.com, for R2 use https://ACCOUNT_ID.r2.cloudflarestorage.com',
			},

			// Bucket Name
			{
				displayName: 'Bucket Name',
				name: 'bucket',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['storage'],
						operation: ['configureBucket'],
					},
				},
				default: '',
				placeholder: 'my-videos-bucket',
				description: 'The name of your S3 bucket',
			},

			// Region
			{
				displayName: 'Region',
				name: 'region',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['storage'],
						operation: ['configureBucket'],
					},
				},
				default: 'us-east-1',
				placeholder: 'us-east-1',
				description: 'AWS region (use "auto" for Cloudflare R2)',
			},

			// Access Key
			{
				displayName: 'Access Key ID',
				name: 'accessKey',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['storage'],
						operation: ['configureBucket'],
					},
				},
				default: '',
				description: 'Your S3 Access Key ID',
			},

			// Secret Key
			{
				displayName: 'Secret Access Key',
				name: 'secretKey',
				type: 'string',
				typeOptions: { password: true },
				required: true,
				displayOptions: {
					show: {
						resource: ['storage'],
						operation: ['configureBucket'],
					},
				},
				default: '',
				description: 'Your S3 Secret Access Key',
			},

			// ==================== ACCOUNT OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['account'],
					},
				},
				options: [
					{
						name: 'Get Usage',
						value: 'getUsage',
						description: 'Get account usage statistics',
						action: 'Get usage statistics',
					},
				],
				default: 'getUsage',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('tornadoApi');
		const baseUrl = credentials.baseUrl as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let responseData;

				// ==================== JOB ====================
				if (resource === 'job') {
					if (operation === 'create') {
						const url = this.getNodeParameter('url', i) as string;
						const additionalOptions = this.getNodeParameter('additionalOptions', i) as {
							format?: string;
							video_codec?: string;
							audio_codec?: string;
							audio_bitrate?: string;
							video_quality?: number;
							filename?: string;
							folder?: string;
							webhook_url?: string;
						};

						const body: Record<string, unknown> = { url };

						// Add optional fields
						if (additionalOptions.format) body.format = additionalOptions.format;
						if (additionalOptions.video_codec) body.video_codec = additionalOptions.video_codec;
						if (additionalOptions.audio_codec) body.audio_codec = additionalOptions.audio_codec;
						if (additionalOptions.audio_bitrate) body.audio_bitrate = additionalOptions.audio_bitrate;
						if (additionalOptions.video_quality !== undefined) body.video_quality = additionalOptions.video_quality;
						if (additionalOptions.filename) body.filename = additionalOptions.filename;
						if (additionalOptions.folder) body.folder = additionalOptions.folder;
						if (additionalOptions.webhook_url) body.webhook_url = additionalOptions.webhook_url;

						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/jobs`,
							body,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
								'Content-Type': 'application/json',
							},
						});
					}

					if (operation === 'getStatus') {
						const jobId = this.getNodeParameter('jobId', i) as string;

						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/jobs/${jobId}`,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
							},
						});
					}

					if (operation === 'waitForCompletion') {
						const jobId = this.getNodeParameter('jobId', i) as string;
						const timeout = this.getNodeParameter('timeout', i) as number;
						const pollInterval = this.getNodeParameter('pollInterval', i) as number;

						const startTime = Date.now();
						const timeoutMs = timeout * 1000;

						while (Date.now() - startTime < timeoutMs) {
							responseData = await this.helpers.httpRequest({
								method: 'GET',
								url: `${baseUrl}/jobs/${jobId}`,
								json: true,
								headers: {
									'x-api-key': credentials.apiKey as string,
								},
							});

							if (responseData.status === 'Completed') {
								break;
							}

							if (responseData.status === 'Failed') {
								throw new NodeOperationError(
									this.getNode(),
									`Job failed: ${responseData.error || 'Unknown error'}`,
									{ itemIndex: i },
								);
							}

							// Wait before next poll
							await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
						}

						if (responseData.status !== 'Completed' && responseData.status !== 'Failed') {
							throw new NodeOperationError(
								this.getNode(),
								`Timeout waiting for job completion. Last status: ${responseData.status}`,
								{ itemIndex: i },
							);
						}
					}
				}

				// ==================== BATCH ====================
				if (resource === 'batch') {
					if (operation === 'getStatus') {
						const batchId = this.getNodeParameter('batchId', i) as string;

						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/batch/${batchId}`,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
							},
						});
					}
				}

				// ==================== STORAGE ====================
				if (resource === 'storage') {
					if (operation === 'configureBucket') {
						const endpoint = this.getNodeParameter('endpoint', i) as string;
						const bucket = this.getNodeParameter('bucket', i) as string;
						const region = this.getNodeParameter('region', i) as string;
						const accessKey = this.getNodeParameter('accessKey', i) as string;
						const secretKey = this.getNodeParameter('secretKey', i) as string;

						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/user/bucket`,
							body: {
								endpoint,
								bucket,
								region,
								access_key: accessKey,
								secret_key: secretKey,
							},
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
								'Content-Type': 'application/json',
							},
						});
					}

					if (operation === 'resetBucket') {
						responseData = await this.helpers.httpRequest({
							method: 'DELETE',
							url: `${baseUrl}/user/bucket`,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
							},
						});
					}
				}

				// ==================== ACCOUNT ====================
				if (resource === 'account') {
					if (operation === 'getUsage') {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/usage`,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
							},
						});
					}
				}

				returnData.push({ json: responseData });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
