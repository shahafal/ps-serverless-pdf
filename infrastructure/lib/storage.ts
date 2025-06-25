import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class AssetStorage extends Construct {
    public readonly uploadBucket: s3.IBucket;
    public readonly assetBucket: s3.IBucket;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.uploadBucket = new s3.Bucket(this, 'UploadBucket', {
            encryption: s3.BucketEncryption.S3_MANAGED
        });

        this.assetBucket = new s3.Bucket(this, 'AssetBucket', {
            encryption: s3.BucketEncryption.S3_MANAGED
        });
    }
}