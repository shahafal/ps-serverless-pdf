import * as cdk from 'aws-cdk-lib';
import { AppDatabase } from './database';
import { ApplicationAPI } from './api';
import { ApplicationAuth } from './auth';
import { ApplicationEvents } from './events';
import { ApplicationMonitoring } from './monitoring';
import { AppServices } from './services';
import { AssetStorage } from './storage';
import { Construct } from 'constructs';
import { DocumentProcessing } from './processing';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const storage = new AssetStorage(this, 'Storage');

    const auth = new ApplicationAuth(this, 'Auth');

    const database = new AppDatabase(this, 'Database');

    const services = new AppServices(this, 'Services', {
      documentsTable: database.documentsTable,
      uploadBucket: storage.uploadBucket,
      assetBucket: storage.assetBucket,
      userPool: auth.userPool
    });

    const api = new ApplicationAPI(this, 'API', {
      commentsService: services.commentsService,
      documentsService: services.documentsService,
      usersService: services.usersService,
      userPool: auth.userPool,
      userPoolClient: auth.userPoolClient
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

    new ApplicationMonitoring(this, 'Monitoring', {
      api: api.httpApi,
      table: database.documentsTable,
      processingStateMachine: processing.processingStateMachine,
      assetsBucket: storage.assetBucket,
      documentsService: services.documentsService,
      commentsService: services.commentsService,
      usersService: services.usersService
    });
  }
}
