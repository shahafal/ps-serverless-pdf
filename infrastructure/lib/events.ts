import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail'
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { NodejsServiceFunction } from './constructs/lambda'
import { Duration } from 'aws-cdk-lib';

interface ApplicationEventsProps {
    processingStateMachine: sfn.IStateMachine;
    uploadBucket: s3.IBucket;
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
    }
}