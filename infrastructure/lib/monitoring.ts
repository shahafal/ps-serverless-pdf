import * as apigv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamoDB from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { generateDashboardBody, MonitoringDashboardConfigProps } from './config/dashboard';

interface ApplicationMonitoringProps {
    api: apigv2.IHttpApi;
    table: dynamoDB.ITable;
    documentsService: lambda.IFunction;
    commentsService: lambda.IFunction;
    usersService: lambda.IFunction;
    processingStateMachine: sfn.IStateMachine;
    assetsBucket: s3.IBucket;
}

export class ApplicationMonitoring extends Construct {
    private readonly topic: sns.ITopic;

    constructor(scope: Construct, id: string, props: ApplicationMonitoringProps) {
        super(scope, id);

        this.topic = new sns.Topic(this, 'AlertingTopic', {
            displayName: 'Serverless Application Alerting Topic',
        });

        this.topic.addSubscription(
            new subscriptions.EmailSubscription(ssm.StringParameter.valueForStringParameter(this, 'dms-globomantics-email'))
        );

        this.addAlarmsToService('Documents', props.documentsService);
        this.addAlarmsToService('Comments', props.commentsService);
        this.addAlarmsToService('Users', props.usersService);

        const dashboardProps: MonitoringDashboardConfigProps = {
            api: props.api,
            table: props.table,
            documentsService: props.documentsService,
            commentsService: props.commentsService,
            usersService: props.usersService,
            processingStateMachine: props.processingStateMachine,
            assetsBucket: props.assetsBucket,
        };
        const dashboardBody = generateDashboardBody(dashboardProps);

        new cw.CfnDashboard(this, 'MonitoringDashboard', {
            dashboardName: 'DMS_Dashboard',
            dashboardBody,
        });
    }

    addAlarmsToService(name: string, service: lambda.IFunction): void {
        new cw.Alarm(this, `${name}ServiceErrorsAlarm`, {
            metric: service.metricErrors(),
            evaluationPeriods: 1,
            datapointsToAlarm: 1,
            comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            actionsEnabled: true,
            threshold: 1,
        }).addAlarmAction(new cw_actions.SnsAction(this.topic));

        new cw.Alarm(this, `${name}ServiceInvocationsAlarm`, {
            metric: service.metricInvocations(),
            evaluationPeriods: 1,
            datapointsToAlarm: 1,
            comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            actionsEnabled: true,
            threshold: 100,
        }).addAlarmAction(new cw_actions.SnsAction(this.topic));

        new cw.Alarm(this, `${name}ServiceThrottlesAlarm`, {
            metric: service.metricThrottles(),
            evaluationPeriods: 1,
            datapointsToAlarm: 1,
            comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            actionsEnabled: true,
            threshold: 1,
        }).addAlarmAction(new cw_actions.SnsAction(this.topic));
    }
}