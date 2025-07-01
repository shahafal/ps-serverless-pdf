import { Construct } from 'constructs';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs'

type NodejsServiceFunctionProps = NodejsFunctionProps;

export class NodejsServiceFunction extends NodejsFunction {
    constructor(scope: Construct, id: string, props: NodejsServiceFunctionProps) {
        const runtime = props.runtime ?? Runtime.NODEJS_22_X;
        const handler = 'handler';
        const bundling = {
            externalModules: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb']
        };
        const tracing = Tracing.ACTIVE;
        super(scope, id, { ...props, tracing, runtime, handler, bundling });
    }
}