import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { TextractClient } from "@aws-sdk/client-textract";
import { SESClient } from "@aws-sdk/client-ses";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";

let _dynamoDB;

const dynamoDB = () => {
    if (!_dynamoDB) {
        const client = new DynamoDBClient({});
        _dynamoDB = DynamoDBDocument.from(client);
    }
    return _dynamoDB;
}

let _s3;

const s3 = () => {
    if (!_s3) {
        _s3 = new S3Client({});
    }
    return _s3;
};

let _textract;

const textract = () => {
    if (!_textract) {
        _textract = new TextractClient({});
    }
    return _textract;
}

let _ses;

const ses = () => {
    if (!_ses) {
        _ses = new SESClient({});
    }
    return _ses;
}

let _eventbridge;

const eventbridge = () => {
    if (!_eventbridge) {
        _eventbridge = new EventBridgeClient({});
    }
    return _eventbridge;
}

export const AWSClients = {
    dynamoDB,
    s3,
    textract,
    ses,
    eventbridge
};