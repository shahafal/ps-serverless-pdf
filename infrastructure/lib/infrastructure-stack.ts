import { Construct } from 'constructs';
import { AssetStorage } from './storage';
import * as cdk from 'aws-cdk-lib';
import { AppDatabase } from './database';
import { AppServices } from './services';
import { ApplicationAPI } from './api';
import { ApplicationEvents } from './events';
import { DocumentProcessing } from './processing';
import { ApplicationAuth } from './auth';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const storage = new AssetStorage(this, 'Storage');

    new ApplicationAuth(this, 'Auth');

    const database = new AppDatabase(this, 'Database');

    const services = new AppServices(this, 'Services', {
      documentsTable: database.documentsTable,
      uploadBucket: storage.uploadBucket,
      assetBucket: storage.assetBucket
    });

    new ApplicationAPI(this, 'API', {
      commentsService: services.commentsService,
      documentsService: services.documentsService
    });

    const processing = new DocumentProcessing(this, 'Processing', {
      uploadBucket: storage.uploadBucket,
      assetBucket: storage.assetBucket,
      documentsTable: database.documentsTable,
    });

    new ApplicationEvents(this, 'Events', {
      uploadBucket: storage.uploadBucket,
      processingStateMachine: processing.processingStateMachine,
      notificationsService: services.notificationsService
    });
  }
}
