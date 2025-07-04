import * as AWSXRay from 'aws-xray-sdk';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { TextractClient } from "@aws-sdk/client-textract";
import { SESClient } from "@aws-sdk/client-ses";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

let _dynamoDB;

const dynamoDB = () => {
    if (!_dynamoDB) {
        const client = new DynamoDBClient({});
        const tracedClient = AWSXRay.captureAWSv3Client(client);
        _dynamoDB = DynamoDBDocument.from(tracedClient);
    }
    return _dynamoDB;
}

let _s3;

const s3 = () => {
    if (!_s3) {
        _s3 = new S3Client({});
        AWSXRay.captureAWSv3Client(_s3);
    }
    return _s3;
};

let _textract;

const textract = () => {
    if (!_textract) {
        _textract = new TextractClient({});
        AWSXRay.captureAWSv3Client(_textract);
    }
    return _textract;
}

let _ses;

const ses = () => {
    if (!_ses) {
        _ses = new SESClient({});
        AWSXRay.captureAWSv3Client(_ses);
    }
    return _ses;
}

let _eventbridge;

const eventbridge = () => {
    if (!_eventbridge) {
        _eventbridge = new EventBridgeClient({});
        AWSXRay.captureAWSv3Client(_eventbridge);
    }
    return _eventbridge;
}

let _cisp;

const cisp = () => {
  if (!_cisp) {
    _cisp = new CognitoIdentityProviderClient({});
    AWSXRay.captureAWSv3Client(_cisp);
  }
  return _cisp;
};

export const AWSClients = {
    dynamoDB,
    s3,
    textract,
    ses,
    eventbridge,
    cisp
};