import * as path from 'path';
import * as dynamoDB from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { NodejsServiceFunction } from './constructs/lambda'
import { Duration } from 'aws-cdk-lib';

interface AppServicesProps {
    documentsTable: dynamoDB.ITable;
    uploadBucket: s3.IBucket;
    assetBucket: s3.IBucket;
}

export class AppServices extends Construct {
    public readonly commentsService: NodejsFunction;
    public readonly documentsService: NodejsFunction;

    constructor(scope: Construct, id: string, props: AppServicesProps) {
        super(scope, id);

        this.commentsService = new NodejsServiceFunction(this, 'CommentServiceLambda', {
            entry: path.join(__dirname, '../../services/comments/index.js')
        });

        props.documentsTable.grantReadWriteData(this.commentsService);

        this.commentsService.addEnvironment('DYNAMO_DB_TABLE', props.documentsTable.tableName);

        this.documentsService = new NodejsServiceFunction(this, 'DocumentServiceLambda', {
            entry: path.join(__dirname, '../../services/documents/index.js'),
            timeout: Duration.seconds(10),
        });

        props.documentsTable.grantReadWriteData(this.documentsService);
        props.uploadBucket.grantWrite(this.documentsService);
        props.assetBucket.grantRead(this.documentsService);
        this.documentsService.addEnvironment('DYNAMO_DB_TABLE', props.documentsTable.tableName);
        this.documentsService.addEnvironment('UPLOAD_BUCKET', props.uploadBucket.bucketName);
        this.documentsService.addEnvironment('ASSET_BUCKET', props.assetBucket.bucketName);
    }
}