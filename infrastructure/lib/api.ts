import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigi from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { CfnOutput, Duration } from 'aws-cdk-lib';
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';

interface ApplicationAPIProps {
    commentsService: lambda.IFunction;
    documentsService: lambda.IFunction;
    userPool: cognito.IUserPool;
    userPoolClient: cognito.IUserPoolClient;
};

export class ApplicationAPI extends Construct {
    public readonly httpApi: apigw.HttpApi;

    constructor(scope: Construct, id: string, props: ApplicationAPIProps) {
        super(scope, id);

        const serviceMethods = [
            HttpMethod.GET,
            HttpMethod.POST,
            HttpMethod.DELETE,
            HttpMethod.PUT,
            HttpMethod.PATCH
        ];

        this.httpApi = new apigw.HttpApi(this, 'HttpProxyApi', {
            apiName: 'serverless-api',
            createDefaultStage: true,
            corsPreflight: {
                allowHeaders: ['Authorization', 'Content-Type', '*'],
                allowMethods: [
                    CorsHttpMethod.GET,
                    CorsHttpMethod.POST,
                    CorsHttpMethod.DELETE,
                    CorsHttpMethod.PUT,
                    CorsHttpMethod.PATCH
                ],
                allowOrigins: ['http://localhost:3000', 'https://*'],
                allowCredentials: true,
                maxAge: Duration.days(10)
            }
        });

        const authorizer = new HttpUserPoolAuthorizer('Authorizer', props.userPool, {
            userPoolClients: [props.userPoolClient],
        });

        const commentsServiceIntegration = new apigi.HttpLambdaIntegration('CommentsIntegration', props.commentsService);

        this.httpApi.addRoutes({
            path: `/comments/{proxy+}`,
            methods: serviceMethods,
            integration: commentsServiceIntegration,
            authorizer
        });

        const documentsServiceIntegration = new apigi.HttpLambdaIntegration('DocumentsServiceIntegration', props.documentsService);

        this.httpApi.addRoutes({
            path: `/documents/{proxy+}`,
            methods: serviceMethods,
            integration: documentsServiceIntegration,
            authorizer
        });

        const queue = new sqs.Queue(this, 'ModerationQueue');

        const moderaeRole = new iam.Role(this, 'ModerateRole', {
            assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com')
        });

        moderaeRole.addToPolicy(
            new iam.PolicyStatement({
                resources: [queue.queueArn],
                actions: ['sqs:SendMessage']
            })
        );

        const sqsIntegration = new apigw.CfnIntegration(this, 'ModerateIntegration', {
            apiId: this.httpApi.apiId,
            integrationType: 'AWS_PROXY',
            integrationSubtype: 'SQS-SendMessage',
            credentialsArn: moderaeRole.roleArn,
            requestParameters: {
                QueueUrl: queue.queueUrl,
                MessageBody: '$request.body'
            },
            payloadFormatVersion: '1.0',
            timeoutInMillis: 10000
        });

        new apigw.CfnRoute(this, 'ModerateRoute', {
            apiId: this.httpApi.apiId,
            routeKey: 'POST /moderate',
            target: `integrations/${sqsIntegration.ref}`
        });

        new CfnOutput(this, 'URL', {
            value: this.httpApi.apiEndpoint
        });
    }
}