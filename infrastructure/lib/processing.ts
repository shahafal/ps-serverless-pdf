import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamoDB from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { NodejsServiceFunction } from './constructs/lambda'
import { Duration } from 'aws-cdk-lib';

interface DocumentProcessingProps {
    uploadBucket: s3.IBucket;
    assetBucket: s3.IBucket;
    documentsTable: dynamoDB.ITable;
}

export class DocumentProcessing extends Construct {
    public readonly processingStateMachine: sfn.IStateMachine;

    constructor(scope: Construct, id: string, props: DocumentProcessingProps) {
        super(scope, id);

        const getDocumentMetadata = new NodejsServiceFunction(this, 'MetadataLambda', {
            entry: path.join(__dirname, '../../services/processing/metadata.js'),
            timeout: Duration.seconds(120)
        });

        getDocumentMetadata.addEnvironment('UPLOAD_BUCKET', props.uploadBucket.bucketName);
        getDocumentMetadata.addEnvironment('ASSET_BUCKET', props.assetBucket.bucketName);
        props.uploadBucket.grantRead(getDocumentMetadata);
        props.assetBucket.grantWrite(getDocumentMetadata);

        const getDocumentMetadataInvoke = new tasks.LambdaInvoke(this, 'Get Document Metadata', {
            lambdaFunction: getDocumentMetadata,
            outputPath: '$.Payload'
        });

        const createThumbnail = new NodejsServiceFunction(this, 'ThumbnailLambda', {
            entry: path.join(__dirname, '../../services/processing/thumbnail.js'),
            timeout: Duration.seconds(120),
            runtime: lambda.Runtime.NODEJS_18_X,
            layers: [
                lambda.LayerVersion.fromLayerVersionAttributes(this, 'GhostscriptLayerVersion', {
                    layerVersionArn: 'arn:aws:lambda:us-east-2:764866452798:layer:ghostscript:17',
                    compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
                }),
                lambda.LayerVersion.fromLayerVersionAttributes(this, 'FontsLayerVersion', {
                    layerVersionArn: 'arn:aws:lambda:us-east-2:347599033421:layer:amazon_linux_fonts:1',
                    compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
                })
            ]
        });

        createThumbnail.addEnvironment('UPLOAD_BUCKET', props.uploadBucket.bucketName);
        createThumbnail.addEnvironment('ASSET_BUCKET', props.assetBucket.bucketName);
        createThumbnail.addEnvironment('GS_FONTPATH', '/opt/usr/share/fonts/dejavu');
        props.uploadBucket.grantRead(createThumbnail);
        props.assetBucket.grantWrite(createThumbnail);

        const createThumbnailInvoke = new tasks.LambdaInvoke(this, 'Create Document Thumbnail', {
            lambdaFunction: createThumbnail,
            outputPath: '$.Payload'
        });

        const startTextDetection = new NodejsServiceFunction(this, 'StartTextDetectionLambda', {
            entry: path.join(__dirname, '../../services/processing/startTextDetection.js'),
        });

        startTextDetection.addEnvironment('UPLOAD_BUCKET', props.uploadBucket.bucketName);
        startTextDetection.addToRolePolicy(
            new iam.PolicyStatement({
                resources: ['*'],
                actions: ['textract:StartDocumentTextDetection']
            })
        );
        props.uploadBucket.grantReadWrite(startTextDetection);

        const startTextDetectionInvoke = new tasks.LambdaInvoke(this, 'Start Text Detection Process', {
            lambdaFunction: startTextDetection,
            outputPath: '$.Payload'
        });

        const getTextDetectionResults = new NodejsServiceFunction(this, 'GetTextDetectionLambda', {
            entry: path.join(__dirname, '../../services/processing/parseTextDetectionResults.js'),
            timeout: Duration.seconds(300)
        });

        getTextDetectionResults.addToRolePolicy(
            new iam.PolicyStatement({
                resources: ['*'],
                actions: ['textract:GetDocumentTextDetection']
            })
        );

        const getTextDetectionResultsInvoke = new tasks.LambdaInvoke(this, 'Get Text Detection Results', {
            lambdaFunction: getTextDetectionResults,
            outputPath: '$.Payload'
        });

        getTextDetectionResultsInvoke.addRetry({
            maxAttempts: 100,
            interval: Duration.seconds(5),
            backoffRate: 2
        });

        const insertDocument = new NodejsServiceFunction(this, 'InsertDocumentLambda', {
            entry: path.join(__dirname, '../../services/processing/insert.js')
        });

        insertDocument.addEnvironment('DYNAMO_DB_TABLE', props.documentsTable.tableName);
        insertDocument.addEnvironment('UPLOAD_BUCKET', props.uploadBucket.bucketName);
        insertDocument.addEnvironment('ASSET_BUCKET', props.assetBucket.bucketName);
        props.uploadBucket.grantReadWrite(insertDocument);
        props.assetBucket.grantReadWrite(insertDocument);

        insertDocument.addToRolePolicy(
            new iam.PolicyStatement({
                resources: [props.documentsTable.tableArn],
                actions: ['dynamodb:UpdateItem']
            })
        );

        const insertDocumentInvoke = new tasks.LambdaInvoke(this, 'Insert Document into Database', {
            lambdaFunction: insertDocument,
            outputPath: '$.Payload'
        });

        const catchError = new NodejsServiceFunction(this, 'CatchErrorLambda', {
            entry: path.join(__dirname, '../../services/processing/catchError.js'),
        });

        catchError.addEnvironment('DYNAMO_DB_TABLE', props.documentsTable.tableName);
        catchError.addEnvironment('UPLOAD_BUCKET', props.uploadBucket.bucketName);
        catchError.addEnvironment('ASSET_BUCKET', props.assetBucket.bucketName);
        props.uploadBucket.grantReadWrite(catchError);
        props.assetBucket.grantReadWrite(catchError);

        catchError.addToRolePolicy(
            new iam.PolicyStatement({
                resources: [props.documentsTable.tableArn],
                actions: ['dynamodb:DeleteItem', 'dynamodb:Query'],
            })
        );

        catchError.addToRolePolicy(
            new iam.PolicyStatement({
                resources: ['*'],
                actions: ['events:PutEvents'],
            })
        );

        const catchErrorInvoke = new tasks.LambdaInvoke(this, 'Unable to process - Rollback all data', {
            lambdaFunction: catchError
        });

        const waitStep = new sfn.Wait(this, 'WaitStep', {
            time: sfn.WaitTime.duration(Duration.seconds(60)),
            comment: 'Wait before checking for text detection'
        });

        const pass = new sfn.Pass(this, 'PassStep', {
            inputPath: '$',
            outputPath: '$'
        });

        const isTextDetectionCompletedChoice = new sfn.Choice(this, 'Has Text Detection Completed', {});
        isTextDetectionCompletedChoice
            .when(sfn.Condition.stringEquals('$.textDetection.jobStatus', 'SUCCEEDED'), pass)
            .otherwise(waitStep);

        startTextDetectionInvoke.next(waitStep);
        waitStep.next(getTextDetectionResultsInvoke);
        getTextDetectionResultsInvoke.next(isTextDetectionCompletedChoice);

        const parallelProcessing = new sfn.Parallel(this, 'ParallelProcessing');
        parallelProcessing.branch(createThumbnailInvoke);
        parallelProcessing.branch(startTextDetectionInvoke);

        const stepFunctionDefinition = getDocumentMetadataInvoke
            .next(parallelProcessing)
            .next(insertDocumentInvoke);

        const catchProps: sfn.CatchProps = {
            resultPath: '$.error'
        };

        getDocumentMetadataInvoke.addCatch(catchErrorInvoke, catchProps);
        parallelProcessing.addCatch(catchErrorInvoke, catchProps);
        insertDocumentInvoke.addCatch(catchErrorInvoke, catchProps);

        this.processingStateMachine = new sfn.StateMachine(this, 'ProcessingStateMachine', {
            definitionBody: sfn.DefinitionBody.fromChainable(stepFunctionDefinition),
            timeout: Duration.minutes(30)
        });
    }
}