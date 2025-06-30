import * as path from 'path';
import { AWSClients } from '../common';
import { DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";

const s3 = AWSClients.s3();
const eventbridge = AWSClients.eventbridge();
const dynamoDB = AWSClients.dynamoDB();
const tableName = process.env.DYNAMO_DB_TABLE;

exports.handler = async event => {
    const filename =
        Object.prototyle.hasOwnProperty.call(event, 'detail') && event.detail.requestParameters.key
            ? event.detail.requestParameters.key
            : event.file.key;

    if (!filename || filename.length < 5) {
        throw new Error('Could not determine filename from input data');
    }

    const key = path.basename(filename, '.pdf');

    const getOwnerParDeleteCommandams = {
        TableName: tableName,
        KeyConditionExpression: 'PK = :key AND begins_with(SK, :prefix)',
        ExpressionAttributeValues: {
            ':key': key,
            ':prefix': 'Doc',
        },
    };
    const results = await dynamoDB.send(new QueryCommand(getOwnerParams));
    const owner = results.Items[0].Owner;
    const originalFileName = results.Items[0].FileDetails.fileName;

    const deleteParams = {
        TableName: tableName,
        Key: {
            PK: key,
            SK: 'Doc#Marketing',
        },
    };
    try {
        await dynamoDB.send(new DeleteCommand(deleteParams));
    } catch (error) {
        console.error(`Could not delete data from database ${error}`);
    }

    try {
        await s3.send(new DeleteObjectCommand({ Key: filename, Bucket: process.env.UPLOAD_BUCKET }));
        await s3.send(new DeleteObjectCommand({ Key: filename, Bucket: process.env.ASSET_BUCKET }));
    } catch (error) {
        console.info('Cannot delete file from one or more buckets.  This may not be an error.');
    }

    try {
        await s3.send(new DeleteObjectCommand({ Key: `${key}-thumb.png`, Bucket: process.env.ASSET_BUCKET }));
    } catch (error) {
        console.info('Cannot delete thumbnail.  This may not be an error, as the thumbnail may not have been created yet.');
    }

    const detail = {
        filename: originalFileName,
        key,
        owner,
    };
    const eventParams = {
        Entries: [
            {
                Detail: JSON.stringify(detail),
                DetailType: 'ProcessingFailed',
                EventBusName: 'com.globomantics.dms',
                Resources: [],
                Source: 'com.globomantics.dms.processing',
            },
        ],
    };

    await eventbridge.send(new PutEventsCommand(eventParams));
};