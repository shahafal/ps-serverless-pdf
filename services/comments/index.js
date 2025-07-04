import { DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { createRouter, RouterType, Matcher, validatePathVariables, validateBodyJSONVariables, getLogger } from 'lambda-micro';
import { AWSClients, generateID } from '../common';

const dynamoDB = AWSClients.dynamoDB();
const tableName = process.env.DYNAMO_DB_TABLE;

const eventbridge = AWSClients.eventbridge();

const schemas = {
    createComment: require('./schemas/createComment.json'),
    deleteComment: require('./schemas/deleteComment.json'),
    getComments: require('./schemas/getComments.json')
};

const getAllCommentsForDocument = async (request, response) => {
    const logger = getLogger(request.event, request.context);

    logger.info(`Getting all comments for document id ${request.pathVariables.docid}`);

    const params = {
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': request.pathVariables.docid,
            ':sk': 'Comment'
        }
    };
    const results = await dynamoDB.send(new QueryCommand(params));

    logger.info('Successfully got all comments');

    return response.output(results.Items, 200);
};

const createComment = async (request, response) => {
    const logger = getLogger(request.event, request.context);

    logger.info(`Creating a new comment for document id ${request.pathVariables.docid}`);

    const userId = request.event.requestContext.authorizer.jwt.claims.username;
    const commentId = `Comment#${generateID()}`;
    const item = {
        PK: request.pathVariables.docid,
        SK: commentId,
        DateAdded: new Date().toISOString(),
        Owner: userId,
        ...JSON.parse(request.event.body)
    };
    const params = {
        TableName: tableName,
        Item: item,
        ReturnValues: 'NONE'
    };
    await dynamoDB.put(params);

    logger.info('Raising a new CommentAdded event');

    const detail = {
        documentId: request.pathVariables.docid,
        commentId,
    };
    const eventParams = {
        Entries: [
            {
                Detail: JSON.stringify(detail),
                DetailType: 'CommentAdded',
                EventBusName: 'com.globomantics.dms',
                Resources: [],
                Source: 'com.globomantics.dms.comments',
            }
        ]
    };
    await eventbridge.send(new PutEventsCommand(eventParams));

    logger.info('Successfully raised CommentAdded event');

    return response.output(item, 200);
};

const deleteComment = async (request, response) => {
    const logger = getLogger(request.event, request.context);

    logger.info(`Deleting comment id ${request.pathVariables.commentid} for document id ${request.pathVariables.docid}`);

    const sk = `Comment#${request.pathVariables.commentid}`;
    const params = {
        TableName: tableName,
        Key: {
            PK: request.pathVariables.docid,
            SK: sk
        },
        ReturnValues: 'ALL_OLD'
    };
    const result = await dynamoDB.send(new DeleteCommand(params));

    if (!result.Attributes) {
        logger.info(`No item was found to delete with PK ${request.pathVariables.docid} and SK: ${sk}`);
        return response.output({}, 404);
    }

    logger.info('Successfully deleted comment');
    return response.output({}, 200);
};

const router = createRouter(RouterType.HTTP_API_V2);

router.add(Matcher.HttpApiV2('GET', '/comments/(:docid)'), validatePathVariables(schemas.getComments), getAllCommentsForDocument);
router.add(Matcher.HttpApiV2('POST', '/comments/(:docid)'), validateBodyJSONVariables(schemas.createComment), createComment);
router.add(Matcher.HttpApiV2('DELETE', '/comments/(:docid)/(:commentid)'), validatePathVariables(schemas.deleteComment), deleteComment);

exports.handler = async (event, context) => {
    return router.run(event, context);
};