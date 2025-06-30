import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail'
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

interface ApplicationEventsProps {
    processingStateMachine: sfn.IStateMachine;
    uploadBucket: s3.IBucket;
    notificationsService: lambda.IFunction
}

export class ApplicationEvents extends Construct {
    constructor(scope: Construct, id: string, props: ApplicationEventsProps) {
        super(scope, id);

        const trail = new cloudtrail.Trail(this, 'CloudTrail', {
            includeGlobalServiceEvents: false,
            isMultiRegionTrail: false
        });

        trail.addS3EventSelector([{ bucket: props.uploadBucket }], {
            includeManagementEvents: false,
            readWriteType: cloudtrail.ReadWriteType.WRITE_ONLY
        });

        const uploadRule = props.uploadBucket.onCloudTrailWriteObject('UploadRule', {});
        const stateMachineTarget = new targets.SfnStateMachine(props.processingStateMachine, {});
        uploadRule.addTarget(stateMachineTarget);

        const bus = new events.EventBus(this, 'AppEventBus', {
            eventBusName: 'com.globomantics.dms',
        });

        const commentAddedRule = new events.Rule(this, 'CommentAddedRule', {
            eventBus: bus,
            enabled: true,
            description: 'When a new comment is added to a document',
            eventPattern: {
                source: ['com.globomantics.dms.comments'],
                detailType: ['CommentAdded'],
            },
            ruleName: 'CommentAddedRule',
        });

        commentAddedRule.addTarget(new targets.LambdaFunction(props.notificationsService));

        const failedProcessingRule = new events.Rule(this, 'FailedProcessingRule', {
            eventBus: bus,
            enabled: true,
            description: 'When a PDF file fails processing',
            eventPattern: {
                source: ['com.globomantics.dms.processing'],
                detailType: ['ProcessingFailed'],
            },
            ruleName: 'ProcessingFailedRule',
        });

        failedProcessingRule.addTarget(new targets.LambdaFunction(props.notificationsService));
    }
}