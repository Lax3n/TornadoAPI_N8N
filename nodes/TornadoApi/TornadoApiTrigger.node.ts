import {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';

export class TornadoApiTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tornado API Trigger',
		name: 'tornadoApiTrigger',
		icon: 'file:tornado.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Triggers when a Tornado job completes, fails, or changes status',
		defaults: {
			name: 'Tornado API Trigger',
		},
		inputs: [],
		outputs: ['main'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'Job Completed',
						value: 'completed',
						description: 'Triggers when a job finishes successfully',
					},
					{
						name: 'Job Failed',
						value: 'failed',
						description: 'Triggers when a job fails',
					},
					{
						name: 'Batch Completed',
						value: 'batch_completed',
						description: 'Triggers when all episodes in a batch are done',
					},
					{
						name: 'Progress Update',
						value: 'progress',
						description: 'Triggers on progress updates (downloading, muxing, uploading stages)',
					},
					{
						name: 'Any Event',
						value: 'all',
						description: 'Triggers on any webhook event',
					},
				],
				default: 'completed',
				description: 'The event to listen for',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Filter by Job ID',
						name: 'jobId',
						type: 'string',
						default: '',
						description: 'Only trigger for this specific job ID',
					},
					{
						displayName: 'Filter by Batch ID',
						name: 'batchId',
						type: 'string',
						default: '',
						description: 'Only trigger for jobs belonging to this batch',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				// Webhook is always available as Tornado will POST to it
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				// No registration needed - user provides the webhook URL to Tornado
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				// No cleanup needed
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const event = this.getNodeParameter('event') as string;
		const options = this.getNodeParameter('options') as { jobId?: string; batchId?: string };

		// Extract type and status from the webhook payload
		const webhookType = (bodyData.type as string)?.toLowerCase() || '';
		const jobStatus = (bodyData.status as string)?.toLowerCase() || '';

		// Filter by event type
		if (event === 'completed') {
			// Only trigger for job_completed with status Completed
			if (webhookType !== 'job_completed' || jobStatus !== 'completed') {
				return { noWebhookResponse: true };
			}
		}

		if (event === 'failed') {
			// Only trigger for job_completed with status Failed
			if (webhookType !== 'job_completed' || jobStatus !== 'failed') {
				return { noWebhookResponse: true };
			}
		}

		if (event === 'batch_completed') {
			// Only trigger for batch_completed type
			if (webhookType !== 'batch_completed') {
				return { noWebhookResponse: true };
			}
		}

		if (event === 'progress') {
			// Only trigger for progress type
			if (webhookType !== 'progress') {
				return { noWebhookResponse: true };
			}
		}

		// Filter by job ID if specified
		if (options.jobId && bodyData.job_id !== options.jobId) {
			return { noWebhookResponse: true };
		}

		// Filter by batch ID if specified
		if (options.batchId && bodyData.batch_id !== options.batchId) {
			return { noWebhookResponse: true };
		}

		// Return the webhook data
		return {
			workflowData: [
				[
					{
						json: bodyData,
					},
				],
			],
		};
	}
}
