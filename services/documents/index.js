import * as path from 'path';
import { URL } from 'url';
import { validatePathVariables, validateMultipartFormData, parseMultipartFormData, createRouter, RouterType, Matcher, enforceGroupMembership, getLogger } from 'lambda-micro';
import { AWSClients, generateID } from '../common';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { QueryCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

const s3 = AWSClients.s3();

const dynamoDB = AWSClients.dynamoDB();
const tableName = process.env.DYNAMO_DB_TABLE;

const schemas = {
    idPathVariable: require('./schemas/idPathVariable.json'),
    createDocument: require('./schemas/createDocument.json'),
};

const generateDeleteRequestsForItems = items => {
    return items.map(item => {
        return {
            DeleteRequest: {
                Key: {
                    PK: item.PK,
                    SK: item.SK
                }
            }
        };
    });
};

const uploadFileToS3 = async (id, formFile) => {
    const params = {
        Bucket: process.env.UPLOAD_BUCKET,
        Key: `${id}.pdf`,
        Body: formFile.content,
        ContentType: formFile.contentType
    };
    return await s3.send(new PutObjectCommand(params));
};

const createSignedS3URL = async unsignedURL => {
    const urlExpirySeconds = 60 * 5;
    const parsedURL = new URL(unsignedURL);
    const filename = path.basename(parsedURL.pathname);
    const params = {
        Bucket: process.env.ASSET_BUCKET,
        Key: filename,
    };
    const signedURL = await getSignedUrl(s3, new GetObjectCommand(params), { expiresIn: urlExpirySeconds });
    return signedURL;
};

const getAllDocuments = async (request, response) => {
    const logger = getLogger(request.event, request.context);
    
    logger.info("Getting all documents from dynamoDB");

    const params = {
        TableName: tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'SK = :key ',
        ExpressionAttributeValues: {
            ':key': 'Doc#Marketing',
        },
    };
    const results = await dynamoDB.send(new QueryCommand(params));

    logger.info("Successfully got all documents from dynamoDB");

    return response.output(results.Items, 200);
};

const getDocument = async (request, response) => {
    const logger = getLogger(request.event, request.context);
    
    logger.info(`Getting document id ${request.pathVariables.id} from dynamoDB`);

    const params = {
        TableName: tableName,
        KeyConditionExpression: 'PK = :key AND begins_with(SK, :prefix)',
        ExpressionAttributeValues: {
            ':key': request.pathVariables.id,
            ':prefix': 'Doc',
        },
    };
    const results = await dynamoDB.send(new QueryCommand(params));
    
    logger.info("Successfully got document from dynamoDB");

    const document = results.Items[0];
    document.Thumbnail = await createSignedS3URL(document.Thumbnail);
    logger.info("Successfully signed thumbnail s3 url");
    document.Document = await createSignedS3URL(document.Document);
    logger.info("Successfully signed document s3 url");
    return response.output(document, 200);
};

const deleteDocument = async (request, response) => {
    const logger = getLogger(request.event, request.context);

    logger.info(`Deleting document id ${request.pathVariables.id} from dynamoDB`);

    const params = {
        TableName: tableName,
        KeyConditionExpression: 'PK = :key',
        ExpressionAttributeValues: {
            ':key': request.pathVariables.id,
        },
    };
    const allValues = await dynamoDB.send(new QueryCommand(params));
    const batchParams = {
        RequestItems: {
            [tableName]: generateDeleteRequestsForItems(allValues.Items),
        },
    };
    await dynamoDB.send(new BatchWriteCommand(batchParams));

    logger.info("Successfully deleted document from dynamoDB");

    return response.output({}, 200);
};

const createDocument = async (request, response) => {
    const logger = getLogger(request.event, request.context);

    logger.info("Creating a new document");

    const file = request.formData.files[0];
    const { fields } = request.formData;
    const fileId = generateID();

    logger.info("Uploading document to s3");
    await uploadFileToS3(fileId, file);

    logger.info("Adding a new document record to dynamoDB");
    const userId = request.event.requestContext.authorizer.jwt.claims.username;
    const item = {
        PK: fileId,
        SK: 'Doc#Marketing',
        DateUploaded: new Date().toISOString(),
        FileDetails: {
            encoding: file.encoding,
            contentType: file.contentType,
            fileName: file.fileName,
        },
        Owner: userId,
        Name: fields.name,
    };

    if (fields.tags && fields.tags.length > 0) {
        item.Tags = fields.tags.split(',');
    }

    const params = {
        TableName: tableName,
        Item: item,
        ReturnValues: 'NONE',
    };
    await dynamoDB.put(params);
    
    logger.info("Successfully created new document record in dynamoDB");

    return response.output('Document created', 200);
};

const router = createRouter(RouterType.HTTP_API_V2);

router.add(Matcher.HttpApiV2('GET', '/documents/'), getAllDocuments);
router.add(Matcher.HttpApiV2('GET', '/documents(/:id)'), validatePathVariables(schemas.idPathVariable), getDocument);
router.add(Matcher.HttpApiV2('DELETE', '/documents(/:id)'), enforceGroupMembership(['admin', 'contributor']),validatePathVariables(schemas.idPathVariable), deleteDocument);
router.add(Matcher.HttpApiV2('POST', '/documents/'), enforceGroupMembership(['admin', 'contributor']), parseMultipartFormData, validateMultipartFormData(schemas.createDocument), createDocument);

exports.handler = async (event, context) => {
    return router.run(event, context);
};