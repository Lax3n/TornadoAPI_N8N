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
						name: 'Dashboard',
						value: 'dashboard',
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
						name: 'Create Bulk',
						value: 'createBulk',
						description: 'Create multiple download jobs at once',
						action: 'Create bulk jobs',
					},
					{
						name: 'Get Status',
						value: 'getStatus',
						description: 'Get the status of a job',
						action: 'Get job status',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all jobs',
						action: 'List jobs',
					},
					{
						name: 'Cancel',
						value: 'cancel',
						description: 'Cancel a pending job',
						action: 'Cancel a job',
					},
					{
						name: 'Retry',
						value: 'retry',
						description: 'Retry a failed job',
						action: 'Retry a job',
					},
					{
						name: 'Delete File',
						value: 'deleteFile',
						description: 'Delete a job file from storage',
						action: 'Delete a job file',
					},
					{
						name: 'Get Metadata',
						value: 'getMetadata',
						description: 'Get video metadata without downloading',
						action: 'Get video metadata',
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
					{
						displayName: 'Audio Only',
						name: 'audio_only',
						type: 'boolean',
						default: false,
						description: 'Extract audio track only (outputs mp3/aac)',
					},
					{
						displayName: 'Download Subtitles',
						name: 'download_subtitles',
						type: 'boolean',
						default: false,
						description: 'Download subtitles if available',
					},
					{
						displayName: 'Download Thumbnail',
						name: 'download_thumbnail',
						type: 'boolean',
						default: false,
						description: 'Download video thumbnail',
					},
					{
						displayName: 'Quality Preset',
						name: 'quality_preset',
						type: 'options',
						options: [
							{ name: 'Default', value: '' },
							{ name: 'Highest', value: 'highest' },
							{ name: 'High', value: 'high' },
							{ name: 'Medium', value: 'medium' },
							{ name: 'Low', value: 'low' },
							{ name: 'Lowest', value: 'lowest' },
						],
						default: '',
						description: 'Quality preset (overrides video_quality)',
					},
					{
						displayName: 'Max Resolution',
						name: 'max_resolution',
						type: 'options',
						options: [
							{ name: 'Best Available', value: 'best' },
							{ name: '4K (2160p)', value: '2160' },
							{ name: '2K (1440p)', value: '1440' },
							{ name: 'Full HD (1080p)', value: '1080' },
							{ name: 'HD (720p)', value: '720' },
							{ name: 'SD (480p)', value: '480' },
							{ name: 'Low (360p)', value: '360' },
						],
						default: 'best',
						description: 'Maximum video resolution to download',
					},
					{
						displayName: 'Clip Start',
						name: 'clip_start',
						type: 'string',
						default: '',
						placeholder: '00:01:30 or 90',
						description: 'Start timestamp for video clipping (HH:MM:SS or seconds)',
					},
					{
						displayName: 'Clip End',
						name: 'clip_end',
						type: 'string',
						default: '',
						placeholder: '00:05:00 or 300',
						description: 'End timestamp for video clipping (HH:MM:SS or seconds)',
					},
					{
						displayName: 'Live Recording',
						name: 'live_recording',
						type: 'boolean',
						default: false,
						description: 'Whether to enable live stream recording mode',
					},
					{
						displayName: 'Live From Start',
						name: 'live_from_start',
						type: 'boolean',
						default: false,
						description: 'Whether to record from the beginning of the live stream (VOD mode)',
					},
					{
						displayName: 'Max Duration (Seconds)',
						name: 'max_duration',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 0,
						description: 'Maximum recording duration in seconds (recommended for live streams)',
					},
					{
						displayName: 'Wait for Video',
						name: 'wait_for_video',
						type: 'boolean',
						default: false,
						description: 'Whether to wait for scheduled/upcoming streams to start',
					},
					{
						displayName: 'Enable Progress Webhook',
						name: 'enable_progress_webhook',
						type: 'boolean',
						default: false,
						description: 'Whether to receive progress webhooks during processing (downloading, muxing, uploading stages)',
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
						operation: ['getStatus', 'cancel', 'retry', 'deleteFile'],
					},
				},
				default: '',
				description: 'The UUID of the job',
			},

			// Job List Options
			{
				displayName: 'List Options',
				name: 'listOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						typeOptions: { minValue: 1, maxValue: 100 },
						default: 20,
						description: 'Number of jobs to return (max 100)',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						typeOptions: { minValue: 0 },
						default: 0,
						description: 'Number of jobs to skip',
					},
					{
						displayName: 'Status Filter',
						name: 'status',
						type: 'options',
						options: [
							{ name: 'All', value: '' },
							{ name: 'Pending', value: 'pending' },
							{ name: 'Processing', value: 'processing' },
							{ name: 'Completed', value: 'completed' },
							{ name: 'Failed', value: 'failed' },
						],
						default: '',
						description: 'Filter by job status',
					},
				],
			},

			// Get Metadata URL
			{
				displayName: 'URL',
				name: 'metadataUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['getMetadata'],
					},
				},
				default: '',
				placeholder: 'https://www.youtube.com/watch?v=...',
				description: 'The video URL to get metadata from',
			},

			// Bulk Create URLs
			{
				displayName: 'URLs',
				name: 'bulkUrls',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				required: true,
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['createBulk'],
					},
				},
				default: {},
				options: [
					{
						name: 'urlItems',
						displayName: 'URLs',
						values: [
							{
								displayName: 'URL',
								name: 'url',
								type: 'string',
								default: '',
								description: 'Video URL to download',
							},
							{
								displayName: 'Filename',
								name: 'filename',
								type: 'string',
								default: '',
								description: 'Optional custom filename',
							},
						],
					},
				],
				description: 'List of URLs to download (max 100)',
			},

			// Bulk Create Options
			{
				displayName: 'Bulk Options',
				name: 'bulkOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['createBulk'],
					},
				},
				options: [
					{
						displayName: 'Folder',
						name: 'folder',
						type: 'string',
						default: '',
						description: 'S3 folder prefix for all files',
					},
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
						description: 'Output format for all jobs',
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
						description: 'Video codec for all jobs',
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
						description: 'Audio codec for all jobs',
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
						description: 'Audio bitrate for all jobs',
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
						description: 'Video quality CRF for all jobs (0-51, lower = better)',
					},
					{
						displayName: 'Audio Only',
						name: 'audio_only',
						type: 'boolean',
						default: false,
						description: 'Extract audio only for all jobs',
					},
					{
						displayName: 'Download Subtitles',
						name: 'download_subtitles',
						type: 'boolean',
						default: false,
						description: 'Download subtitles for all jobs',
					},
					{
						displayName: 'Download Thumbnail',
						name: 'download_thumbnail',
						type: 'boolean',
						default: false,
						description: 'Download thumbnails for all jobs',
					},
					{
						displayName: 'Quality Preset',
						name: 'quality_preset',
						type: 'options',
						options: [
							{ name: 'Default', value: '' },
							{ name: 'Highest', value: 'highest' },
							{ name: 'High', value: 'high' },
							{ name: 'Medium', value: 'medium' },
							{ name: 'Low', value: 'low' },
							{ name: 'Lowest', value: 'lowest' },
						],
						default: '',
						description: 'Quality preset for all jobs',
					},
					{
						displayName: 'Max Resolution',
						name: 'max_resolution',
						type: 'options',
						options: [
							{ name: 'Best Available', value: 'best' },
							{ name: '4K (2160p)', value: '2160' },
							{ name: '2K (1440p)', value: '1440' },
							{ name: 'Full HD (1080p)', value: '1080' },
							{ name: 'HD (720p)', value: '720' },
							{ name: 'SD (480p)', value: '480' },
							{ name: 'Low (360p)', value: '360' },
						],
						default: 'best',
						description: 'Maximum video resolution for all jobs',
					},
					{
						displayName: 'Clip Start',
						name: 'clip_start',
						type: 'string',
						default: '',
						placeholder: '00:01:30 or 90',
						description: 'Start timestamp for video clipping (all jobs)',
					},
					{
						displayName: 'Clip End',
						name: 'clip_end',
						type: 'string',
						default: '',
						placeholder: '00:05:00 or 300',
						description: 'End timestamp for video clipping (all jobs)',
					},
					{
						displayName: 'Live Recording',
						name: 'live_recording',
						type: 'boolean',
						default: false,
						description: 'Whether to enable live stream recording mode for all jobs',
					},
					{
						displayName: 'Live From Start',
						name: 'live_from_start',
						type: 'boolean',
						default: false,
						description: 'Whether to record from the beginning of live streams',
					},
					{
						displayName: 'Max Duration (Seconds)',
						name: 'max_duration',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 0,
						description: 'Maximum recording duration in seconds for all jobs',
					},
					{
						displayName: 'Wait for Video',
						name: 'wait_for_video',
						type: 'boolean',
						default: false,
						description: 'Whether to wait for scheduled streams to start',
					},
				],
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
					{
						name: 'Rename Jobs',
						value: 'renameJobs',
						description: 'Rename files of jobs in a batch',
						action: 'Rename batch jobs',
					},
					{
						name: 'Start',
						value: 'start',
						description: 'Start processing a batch',
						action: 'Start a batch',
					},
				],
				default: 'getStatus',
			},

			// Batch ID Fields
			{
				displayName: 'Batch ID',
				name: 'batchId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['batch'],
						operation: ['getStatus', 'renameJobs', 'start'],
					},
				},
				default: '',
				description: 'The UUID of the batch',
			},

			// Batch Rename Jobs Fields
			{
				displayName: 'Renames',
				name: 'renames',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				required: true,
				displayOptions: {
					show: {
						resource: ['batch'],
						operation: ['renameJobs'],
					},
				},
				default: {},
				options: [
					{
						name: 'renameItems',
						displayName: 'Renames',
						values: [
							{
								displayName: 'Job ID',
								name: 'job_id',
								type: 'string',
								default: '',
								description: 'The UUID of the job to rename',
							},
							{
								displayName: 'Filename',
								name: 'filename',
								type: 'string',
								default: '',
								description: 'New filename for the job',
							},
						],
					},
				],
				description: 'List of job ID and filename pairs to rename',
			},

			// ==================== DASHBOARD OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['dashboard'],
					},
				},
				options: [
					{
						name: 'Get Stats',
						value: 'getStats',
						description: 'Get aggregated statistics for your API key',
						action: 'Get dashboard stats',
					},
					{
						name: 'Get Jobs',
						value: 'getJobs',
						description: 'Get paginated list of jobs for the dashboard',
						action: 'Get dashboard jobs',
					},
					{
						name: 'Get Batches',
						value: 'getBatches',
						description: 'Get list of batch operations',
						action: 'Get dashboard batches',
					},
					{
						name: 'Get Daily Stats',
						value: 'getDaily',
						description: 'Get daily job statistics for the last 7 days',
						action: 'Get daily stats',
					},
					{
						name: 'Get Cluster Stats',
						value: 'getCluster',
						description: 'Get real-time cluster activity statistics',
						action: 'Get cluster stats',
					},
					{
						name: 'Get Billing',
						value: 'getBilling',
						description: 'Get current billing period usage from Stripe',
						action: 'Get billing info',
					},
				],
				default: 'getStats',
			},

			// Dashboard Get Jobs Options
			{
				displayName: 'Options',
				name: 'dashboardJobsOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['dashboard'],
						operation: ['getJobs'],
					},
				},
				options: [
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						typeOptions: { minValue: 1, maxValue: 100 },
						default: 50,
						description: 'Number of jobs to return (max 100)',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						typeOptions: { minValue: 0 },
						default: 0,
						description: 'Number of jobs to skip for pagination',
					},
					{
						displayName: 'Status Filter',
						name: 'status',
						type: 'options',
						options: [
							{ name: 'All', value: '' },
							{ name: 'Pending', value: 'pending' },
							{ name: 'Processing', value: 'processing' },
							{ name: 'Completed', value: 'completed' },
							{ name: 'Failed', value: 'failed' },
						],
						default: '',
						description: 'Filter by job status',
					},
				],
			},

			// ==================== STORAGE OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['storage'] } },
				options: [
					{ name: 'Configure S3', value: 'configureS3', description: 'Configure an S3-compatible storage provider', action: 'Configure S3 storage' },
					{ name: 'Delete S3', value: 'deleteS3', description: 'Remove S3 storage configuration', action: 'Delete S3 configuration' },
					{ name: 'Configure Azure Blob', value: 'configureBlob', description: 'Configure Azure Blob Storage', action: 'Configure Azure Blob storage' },
					{ name: 'Delete Azure Blob', value: 'deleteBlob', description: 'Remove Azure Blob storage configuration', action: 'Delete Azure Blob configuration' },
					{ name: 'Configure GCS', value: 'configureGcs', description: 'Configure Google Cloud Storage', action: 'Configure GCS storage' },
					{ name: 'Delete GCS', value: 'deleteGcs', description: 'Remove Google Cloud Storage configuration', action: 'Delete GCS configuration' },
					{ name: 'Configure OSS', value: 'configureOss', description: 'Configure Alibaba Cloud OSS', action: 'Configure OSS storage' },
					{ name: 'Delete OSS', value: 'deleteOss', description: 'Remove Alibaba Cloud OSS configuration', action: 'Delete OSS configuration' },
					{ name: 'Configure Bucket (Legacy)', value: 'configureBucket', description: '[Deprecated] Configure S3 bucket using legacy endpoint', action: 'Configure bucket (legacy)' },
					{ name: 'Reset Bucket (Legacy)', value: 'resetBucket', description: '[Deprecated] Reset to default storage using legacy endpoint', action: 'Reset bucket (legacy)' },
				],
				default: 'configureS3',
			},

			// S3 Fields
			{
				displayName: 'Bucket Name',
				name: 's3Bucket',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureS3'] } },
				default: '',
				description: 'The name of your S3 bucket',
			},
			{
				displayName: 'Region',
				name: 's3Region',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureS3'] } },
				default: 'us-east-1',
				description: 'AWS region (use auto for Cloudflare R2)',
			},
			{
				displayName: 'Access Key ID',
				name: 's3AccessKey',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureS3'] } },
				default: '',
				description: 'Your S3 Access Key ID',
			},
			{
				displayName: 'Secret Access Key',
				name: 's3SecretKey',
				type: 'string',
				typeOptions: { password: true },
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureS3'] } },
				default: '',
				description: 'Your S3 Secret Access Key',
			},
			{
				displayName: 'S3 Options',
				name: 's3Options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['storage'], operation: ['configureS3'] } },
				options: [
					{ displayName: 'Endpoint URL', name: 'endpoint', type: 'string', default: '', description: 'Custom S3 endpoint URL (for R2, MinIO, etc.)' },
					{ displayName: 'Folder Prefix', name: 'folder_prefix', type: 'string', default: '', description: 'Folder prefix for uploaded files' },
					{ displayName: 'Base Folder', name: 'base_folder', type: 'string', default: '', description: 'Base folder path in the bucket' },
				],
			},

			// Azure Blob Fields
			{
				displayName: 'Account Name',
				name: 'blobAccountName',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureBlob'] } },
				default: '',
				description: 'Azure Storage account name',
			},
			{
				displayName: 'Container',
				name: 'blobContainer',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureBlob'] } },
				default: '',
				description: 'Azure Blob container name',
			},
			{
				displayName: 'Blob Options',
				name: 'blobOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['storage'], operation: ['configureBlob'] } },
				options: [
					{ displayName: 'Account Key', name: 'account_key', type: 'string', typeOptions: { password: true }, default: '', description: 'Azure Storage account key' },
					{ displayName: 'SAS Token', name: 'sas_token', type: 'string', typeOptions: { password: true }, default: '', description: 'Azure SAS token (alternative to account key)' },
					{ displayName: 'Folder Prefix', name: 'folder_prefix', type: 'string', default: '', description: 'Folder prefix for uploaded files' },
					{ displayName: 'Base Folder', name: 'base_folder', type: 'string', default: '', description: 'Base folder path in the container' },
				],
			},

			// GCS Fields
			{
				displayName: 'Project ID',
				name: 'gcsProjectId',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureGcs'] } },
				default: '',
				description: 'Google Cloud project ID',
			},
			{
				displayName: 'Bucket Name',
				name: 'gcsBucket',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureGcs'] } },
				default: '',
				description: 'GCS bucket name',
			},
			{
				displayName: 'Service Account JSON',
				name: 'gcsServiceAccountJson',
				type: 'string',
				typeOptions: { password: true },
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureGcs'] } },
				default: '',
				description: 'GCS service account JSON key (stringified)',
			},
			{
				displayName: 'GCS Options',
				name: 'gcsOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['storage'], operation: ['configureGcs'] } },
				options: [
					{ displayName: 'Folder Prefix', name: 'folder_prefix', type: 'string', default: '', description: 'Folder prefix for uploaded files' },
					{ displayName: 'Base Folder', name: 'base_folder', type: 'string', default: '', description: 'Base folder path in the bucket' },
				],
			},

			// OSS Fields
			{
				displayName: 'Bucket Name',
				name: 'ossBucket',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureOss'] } },
				default: '',
				description: 'Alibaba Cloud OSS bucket name',
			},
			{
				displayName: 'Access Key ID',
				name: 'ossAccessKeyId',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureOss'] } },
				default: '',
				description: 'Alibaba Cloud Access Key ID',
			},
			{
				displayName: 'Access Key Secret',
				name: 'ossAccessKeySecret',
				type: 'string',
				typeOptions: { password: true },
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureOss'] } },
				default: '',
				description: 'Alibaba Cloud Access Key Secret',
			},
			{
				displayName: 'OSS Options',
				name: 'ossOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['storage'], operation: ['configureOss'] } },
				options: [
					{ displayName: 'Endpoint URL', name: 'endpoint', type: 'string', default: '', description: 'Custom OSS endpoint URL' },
					{ displayName: 'Folder Prefix', name: 'folder_prefix', type: 'string', default: '', description: 'Folder prefix for uploaded files' },
					{ displayName: 'Base Folder', name: 'base_folder', type: 'string', default: '', description: 'Base folder path in the bucket' },
				],
			},

			// Legacy Storage Fields
			{
				displayName: 'Provider',
				name: 'provider',
				type: 'options',
				displayOptions: { show: { resource: ['storage'], operation: ['configureBucket'] } },
				options: [
					{ name: 'Amazon S3', value: 'aws' },
					{ name: 'Cloudflare R2', value: 'r2' },
					{ name: 'MinIO', value: 'minio' },
					{ name: 'Other S3-Compatible', value: 'other' },
				],
				default: 'aws',
				description: '[Deprecated] Your storage provider',
			},
			{
				displayName: 'Endpoint URL',
				name: 'endpoint',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureBucket'] } },
				default: '',
				description: '[Deprecated] S3 endpoint URL',
			},
			{
				displayName: 'Bucket Name',
				name: 'bucket',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureBucket'] } },
				default: '',
				description: '[Deprecated] The name of your S3 bucket',
			},
			{
				displayName: 'Region',
				name: 'region',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureBucket'] } },
				default: 'us-east-1',
				description: '[Deprecated] AWS region',
			},
			{
				displayName: 'Access Key ID',
				name: 'accessKey',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureBucket'] } },
				default: '',
				description: '[Deprecated] Your S3 Access Key ID',
			},
			{
				displayName: 'Secret Access Key',
				name: 'secretKey',
				type: 'string',
				typeOptions: { password: true },
				required: true,
				displayOptions: { show: { resource: ['storage'], operation: ['configureBucket'] } },
				default: '',
				description: '[Deprecated] Your S3 Secret Access Key',
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
							audio_only?: boolean;
							download_subtitles?: boolean;
							download_thumbnail?: boolean;
							quality_preset?: string;
							max_resolution?: string;
							clip_start?: string;
							clip_end?: string;
							live_recording?: boolean;
							live_from_start?: boolean;
							max_duration?: number;
							wait_for_video?: boolean;
							enable_progress_webhook?: boolean;
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
						if (additionalOptions.audio_only) body.audio_only = additionalOptions.audio_only;
						if (additionalOptions.download_subtitles) body.download_subtitles = additionalOptions.download_subtitles;
						if (additionalOptions.download_thumbnail) body.download_thumbnail = additionalOptions.download_thumbnail;
						if (additionalOptions.quality_preset) body.quality_preset = additionalOptions.quality_preset;
						if (additionalOptions.max_resolution && additionalOptions.max_resolution !== 'best') body.max_resolution = additionalOptions.max_resolution;
						if (additionalOptions.clip_start) body.clip_start = additionalOptions.clip_start;
						if (additionalOptions.clip_end) body.clip_end = additionalOptions.clip_end;
						if (additionalOptions.live_recording) body.live_recording = additionalOptions.live_recording;
						if (additionalOptions.live_from_start) body.live_from_start = additionalOptions.live_from_start;
						if (additionalOptions.max_duration && additionalOptions.max_duration > 0) body.max_duration = additionalOptions.max_duration;
						if (additionalOptions.wait_for_video) body.wait_for_video = additionalOptions.wait_for_video;
						if (additionalOptions.enable_progress_webhook) body.enable_progress_webhook = additionalOptions.enable_progress_webhook;

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

					if (operation === 'list') {
						const listOptions = this.getNodeParameter('listOptions', i) as {
							limit?: number;
							offset?: number;
							status?: string;
						};

						const qs: Record<string, string | number> = {};
						if (listOptions.limit) qs.limit = listOptions.limit;
						if (listOptions.offset) qs.offset = listOptions.offset;
						if (listOptions.status) qs.status = listOptions.status;

						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/jobs`,
							qs,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
							},
						});
					}

					if (operation === 'cancel') {
						const jobId = this.getNodeParameter('jobId', i) as string;

						responseData = await this.helpers.httpRequest({
							method: 'DELETE',
							url: `${baseUrl}/jobs/${jobId}`,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
							},
						});
					}

					if (operation === 'retry') {
						const jobId = this.getNodeParameter('jobId', i) as string;

						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/jobs/${jobId}/retry`,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
							},
						});
					}

					if (operation === 'deleteFile') {
						const jobId = this.getNodeParameter('jobId', i) as string;

						responseData = await this.helpers.httpRequest({
							method: 'DELETE',
							url: `${baseUrl}/jobs/${jobId}/file`,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
							},
						});
					}

					if (operation === 'getMetadata') {
						const url = this.getNodeParameter('metadataUrl', i) as string;

						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/metadata`,
							body: { url },
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
								'Content-Type': 'application/json',
							},
						});
					}

					if (operation === 'createBulk') {
						const bulkUrls = this.getNodeParameter('bulkUrls', i) as {
							urlItems?: Array<{ url: string; filename?: string }>;
						};
						const bulkOptions = this.getNodeParameter('bulkOptions', i) as {
							folder?: string;
							format?: string;
							video_codec?: string;
							audio_codec?: string;
							audio_bitrate?: string;
							video_quality?: number;
							audio_only?: boolean;
							download_subtitles?: boolean;
							download_thumbnail?: boolean;
							quality_preset?: string;
							max_resolution?: string;
							clip_start?: string;
							clip_end?: string;
							live_recording?: boolean;
							live_from_start?: boolean;
							max_duration?: number;
							wait_for_video?: boolean;
						};

						const jobs = (bulkUrls.urlItems || []).map((item) => ({
							url: item.url,
							filename: item.filename || undefined,
						}));

						const body: Record<string, unknown> = { jobs };
						if (bulkOptions.folder) body.folder = bulkOptions.folder;
						if (bulkOptions.format) body.format = bulkOptions.format;
						if (bulkOptions.video_codec) body.video_codec = bulkOptions.video_codec;
						if (bulkOptions.audio_codec) body.audio_codec = bulkOptions.audio_codec;
						if (bulkOptions.audio_bitrate) body.audio_bitrate = bulkOptions.audio_bitrate;
						if (bulkOptions.video_quality !== undefined) body.video_quality = bulkOptions.video_quality;
						if (bulkOptions.audio_only) body.audio_only = bulkOptions.audio_only;
						if (bulkOptions.download_subtitles) body.download_subtitles = bulkOptions.download_subtitles;
						if (bulkOptions.download_thumbnail) body.download_thumbnail = bulkOptions.download_thumbnail;
						if (bulkOptions.quality_preset) body.quality_preset = bulkOptions.quality_preset;
						if (bulkOptions.max_resolution && bulkOptions.max_resolution !== 'best') body.max_resolution = bulkOptions.max_resolution;
						if (bulkOptions.clip_start) body.clip_start = bulkOptions.clip_start;
						if (bulkOptions.clip_end) body.clip_end = bulkOptions.clip_end;
						if (bulkOptions.live_recording) body.live_recording = bulkOptions.live_recording;
						if (bulkOptions.live_from_start) body.live_from_start = bulkOptions.live_from_start;
						if (bulkOptions.max_duration && bulkOptions.max_duration > 0) body.max_duration = bulkOptions.max_duration;
						if (bulkOptions.wait_for_video) body.wait_for_video = bulkOptions.wait_for_video;

						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/jobs/bulk`,
							body,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
								'Content-Type': 'application/json',
							},
						});
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

					if (operation === 'renameJobs') {
						const batchId = this.getNodeParameter('batchId', i) as string;
						const renames = this.getNodeParameter('renames', i) as {
							renameItems?: Array<{ job_id: string; filename: string }>;
						};

						responseData = await this.helpers.httpRequest({
							method: 'PATCH',
							url: `${baseUrl}/batch/${batchId}/jobs`,
							body: { renames: renames.renameItems || [] },
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
								'Content-Type': 'application/json',
							},
						});
					}

					if (operation === 'start') {
						const batchId = this.getNodeParameter('batchId', i) as string;

						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/batch/${batchId}/start`,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
							},
						});
					}
				}

				// ==================== DASHBOARD ====================
				if (resource === 'dashboard') {
					const dashboardBaseUrl = (credentials.dashboardBaseUrl as string || '').replace(/\/$/, '');
					if (!dashboardBaseUrl) {
						throw new NodeOperationError(this.getNode(), 'Dashboard Base URL is not configured. Please set the Dashboard Base URL in your Tornado API credentials to use Dashboard operations.');
					}

					if (operation === 'getStats') {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${dashboardBaseUrl}/dashboard/stats`,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
							},
						});
					}

					if (operation === 'getBatches') {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${dashboardBaseUrl}/dashboard/batches`,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
							},
						});
					}

					if (operation === 'getDaily') {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${dashboardBaseUrl}/dashboard/daily`,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
							},
						});
					}

					if (operation === 'getCluster') {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${dashboardBaseUrl}/dashboard/cluster`,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
							},
						});
					}

					if (operation === 'getBilling') {
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${dashboardBaseUrl}/dashboard/billing`,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
							},
						});
					}

					if (operation === 'getJobs') {
						const options = this.getNodeParameter('dashboardJobsOptions', i) as {
							limit?: number;
							offset?: number;
							status?: string;
						};

						const qs: Record<string, string | number> = {};
						if (options.limit) qs.limit = options.limit;
						if (options.offset) qs.offset = options.offset;
						if (options.status) qs.status = options.status;

						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${dashboardBaseUrl}/dashboard/jobs`,
							qs,
							json: true,
							headers: {
								'x-api-key': credentials.apiKey as string,
							},
						});
					}
				}

				// ==================== STORAGE ====================
				if (resource === 'storage') {
					if (operation === 'configureS3') {
						const bucket = this.getNodeParameter('s3Bucket', i) as string;
						const region = this.getNodeParameter('s3Region', i) as string;
						const access_key = this.getNodeParameter('s3AccessKey', i) as string;
						const secret_key = this.getNodeParameter('s3SecretKey', i) as string;
						const opts = this.getNodeParameter('s3Options', i) as { endpoint?: string; folder_prefix?: string; base_folder?: string };
						const body: Record<string, unknown> = { bucket, region, access_key, secret_key };
						if (opts.endpoint) body.endpoint = opts.endpoint;
						if (opts.folder_prefix) body.folder_prefix = opts.folder_prefix;
						if (opts.base_folder) body.base_folder = opts.base_folder;
						responseData = await this.helpers.httpRequest({ method: 'POST', url: `${baseUrl}/user/s3`, body, json: true, headers: { 'x-api-key': credentials.apiKey as string, 'Content-Type': 'application/json' } });
					}

					if (operation === 'deleteS3') {
						responseData = await this.helpers.httpRequest({ method: 'DELETE', url: `${baseUrl}/user/s3`, json: true, headers: { 'x-api-key': credentials.apiKey as string } });
					}

					if (operation === 'configureBlob') {
						const account_name = this.getNodeParameter('blobAccountName', i) as string;
						const container = this.getNodeParameter('blobContainer', i) as string;
						const opts = this.getNodeParameter('blobOptions', i) as { account_key?: string; sas_token?: string; folder_prefix?: string; base_folder?: string };
						const body: Record<string, unknown> = { account_name, container };
						if (opts.account_key) body.account_key = opts.account_key;
						if (opts.sas_token) body.sas_token = opts.sas_token;
						if (opts.folder_prefix) body.folder_prefix = opts.folder_prefix;
						if (opts.base_folder) body.base_folder = opts.base_folder;
						responseData = await this.helpers.httpRequest({ method: 'POST', url: `${baseUrl}/user/blob`, body, json: true, headers: { 'x-api-key': credentials.apiKey as string, 'Content-Type': 'application/json' } });
					}

					if (operation === 'deleteBlob') {
						responseData = await this.helpers.httpRequest({ method: 'DELETE', url: `${baseUrl}/user/blob`, json: true, headers: { 'x-api-key': credentials.apiKey as string } });
					}

					if (operation === 'configureGcs') {
						const project_id = this.getNodeParameter('gcsProjectId', i) as string;
						const bucket = this.getNodeParameter('gcsBucket', i) as string;
						const service_account_json = this.getNodeParameter('gcsServiceAccountJson', i) as string;
						const opts = this.getNodeParameter('gcsOptions', i) as { folder_prefix?: string; base_folder?: string };
						const body: Record<string, unknown> = { project_id, bucket, service_account_json };
						if (opts.folder_prefix) body.folder_prefix = opts.folder_prefix;
						if (opts.base_folder) body.base_folder = opts.base_folder;
						responseData = await this.helpers.httpRequest({ method: 'POST', url: `${baseUrl}/user/gcs`, body, json: true, headers: { 'x-api-key': credentials.apiKey as string, 'Content-Type': 'application/json' } });
					}

					if (operation === 'deleteGcs') {
						responseData = await this.helpers.httpRequest({ method: 'DELETE', url: `${baseUrl}/user/gcs`, json: true, headers: { 'x-api-key': credentials.apiKey as string } });
					}

					if (operation === 'configureOss') {
						const bucket = this.getNodeParameter('ossBucket', i) as string;
						const access_key_id = this.getNodeParameter('ossAccessKeyId', i) as string;
						const access_key_secret = this.getNodeParameter('ossAccessKeySecret', i) as string;
						const opts = this.getNodeParameter('ossOptions', i) as { endpoint?: string; folder_prefix?: string; base_folder?: string };
						const body: Record<string, unknown> = { bucket, access_key_id, access_key_secret };
						if (opts.endpoint) body.endpoint = opts.endpoint;
						if (opts.folder_prefix) body.folder_prefix = opts.folder_prefix;
						if (opts.base_folder) body.base_folder = opts.base_folder;
						responseData = await this.helpers.httpRequest({ method: 'POST', url: `${baseUrl}/user/oss`, body, json: true, headers: { 'x-api-key': credentials.apiKey as string, 'Content-Type': 'application/json' } });
					}

					if (operation === 'deleteOss') {
						responseData = await this.helpers.httpRequest({ method: 'DELETE', url: `${baseUrl}/user/oss`, json: true, headers: { 'x-api-key': credentials.apiKey as string } });
					}

					if (operation === 'configureBucket') {
						const endpoint = this.getNodeParameter('endpoint', i) as string;
						const bucket = this.getNodeParameter('bucket', i) as string;
						const region = this.getNodeParameter('region', i) as string;
						const accessKey = this.getNodeParameter('accessKey', i) as string;
						const secretKey = this.getNodeParameter('secretKey', i) as string;
						responseData = await this.helpers.httpRequest({ method: 'POST', url: `${baseUrl}/user/bucket`, body: { endpoint, bucket, region, access_key: accessKey, secret_key: secretKey }, json: true, headers: { 'x-api-key': credentials.apiKey as string, 'Content-Type': 'application/json' } });
					}

					if (operation === 'resetBucket') {
						responseData = await this.helpers.httpRequest({ method: 'DELETE', url: `${baseUrl}/user/bucket`, json: true, headers: { 'x-api-key': credentials.apiKey as string } });
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
