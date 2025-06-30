import * as path from 'path';
import { enforceGroupMembership, createRouter, validatePathVariables, parseMultipartFormData, validateBodyJSONVariables, RouterType, Matcher } from 'lambda-micro';
import { AWSClients } from '../common';
import { AdminAddUserToGroupCommand, AdminCreateUserCommand, AdminDeleteUserAttributesCommand, AdminDeleteUserCommand, AdminGetUserCommand, AdminUpdateUserAttributesCommand, ListUsersInGroupCommand } from "@aws-sdk/client-cognito-identity-provider"
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const userPoolId = process.env.USER_POOL_ID;
const cisp = AWSClients.cisp();
const s3 = AWSClients.s3();

const schemas = {
    idPathVariable: require('./schemas/idPathVariable.json'),
    createUser: require('./schemas/createUser.json'),
};

const groups = ['admin', 'reader', 'contributor'];

const doesOutputHaveUser = (output, user) => {
    const foundUser = output.find(existingUser => existingUser.userId === user.userId);
    if (foundUser) {
        return true;
    }
    return false;
};

const getUserAttribute = (user, attrName, defaultVal) => {
    const attrProperty = Object.prototype.hasOwnProperty.call(user, 'Attributes')
        ? 'Attributes'
        : 'UserAttributes';
    const attr = user[attrProperty].find(a => a.Name === attrName);
    if (!attr) {
        return defaultVal;
    }
    return attr.Value;
};

const getSignedURL = async picture => {
    const urlExpirySeconds = 60 * 60 * 24;
    const params = {
        Bucket: process.env.ASSET_BUCKET,
        Key: picture
    };
    const signedURL = await getSignedUrl(client, new GetObjectCommand(params), {
        expiresIn: urlExpirySeconds
    });
    return signedURL;
};

const transformUser = async user => {
    const output = {};
    output.userId = user.Username;
    output.dateCreated = user.UserCreateDate;
    output.name = getUserAttribute(user, 'name', '');
    output.email = getUserAttribute(user, 'email', '');
    output.picture = getUserAttribute(user, 'picture', '');
    if (output.picture) {
        output.pictureURL = await getSignedURL(output.picture);
    }
    return output;
};

const getUsersInGroup = async (groupName, nextToken) => {
    const params = {
        GroupName: groupName,
        UserPoolId: userPoolId,
        Limit: 60,
    };
    if (nextToken) {
        params.NextToken = nextToken;
    }
    const result = await cisp.send(new ListUsersInGroupCommand(params));
    let users = result.Users;
    if (result.NextToken) {
        users = [...users, await getUsersInGroup(groupName, result.NextToken)];
    }
    return users;
};

const getUsersInAllGroups = async () => {
    const output = [];
    await Promise.all(
        groups.map(async group => {
            const users = await getUsersInGroup(group);
            users.map(async user => {
                const transformedUser = await transformUser(user);
                transformedUser.group = group;
                if (!doesOutputHaveUser(output, transformedUser)) {
                    output.push(transformedUser);
                }
            });
        }),
    );
    return output;
};

const uploadPhotoToS3 = async (id, formFile) => {
    const params = {
        Bucket: process.env.ASSET_BUCKET,
        Key: `profile/${id}${path.extname(formFile.fileName)}`,
        Body: formFile.content,
        ContentType: formFile.contentType,
    };
    return s3.send(new PutObjectCommand(params));
};

const getAllUsers = async (request, response) => {
    const users = await getUsersInAllGroups();
    return response.output({ users }, 200);
};

const getCurrentUser = async (request, response) => {
    const userId = request.event.requestContext.authorizer.jwt.claims.username;
    const params = {
        UserPoolId: userPoolId,
        Username: userId,
    };
    const rawUser = await cisp.send(new AdminGetUserCommand(params));
    if (!rawUser) {
        return response.output({}, 404);
    }
    const user = await transformUser(rawUser);
    return response.output({ user }, 200);
};

const updateCurrentUser = async (request, response) => {
    const userId = request.event.requestContext.authorizer.jwt.claims.username;
    const { fields } = request.formData;

    if (fields && fields.deletePicture) {
        const userParams = {
            UserPoolId: userPoolId,
            Username: userId,
        };
        const rawUser = await cisp.send(new AdminGetUserCommand(userParams));
        const photoKey = getUserAttribute(rawUser, 'picture');
        if (photoKey) {
            const deleteParams = {
                Bucket: process.env.ASSET_BUCKET,
                Key: photoKey,
            };
            await s3.send(new DeleteObjectCommand(deleteParams));
        }
        const attributeParams = {
            UserAttributeNames: ['picture'],
            UserPoolId: userPoolId,
            Username: userId,
        };
        await cisp.send(new AdminDeleteUserAttributesCommand(attributeParams));
    }

    let formFile;
    if (request.formData.files && request.formData.files[0]) {
        [formFile] = request.formData.files;
        await uploadPhotoToS3(userId, formFile);
    }

    if (fields && fields.name) {
        const params = {
            UserPoolId: userPoolId,
            Username: userId,
            UserAttributes: [
                {
                    Name: 'name',
                    Value: fields.name,
                },
            ],
        };
        if (formFile) {
            params.UserAttributes.push({
                Name: 'picture',
                Value: `profile/${userId}${path.extname(formFile.fileName)}`,
            });
        }
        await cisp.send(new AdminUpdateUserAttributesCommand(params));
    }

    return getCurrentUser(request, response);
};

const getAllProfiles = async (request, response) => {
    const users = await getUsersInAllGroups();
    const output = users.map(user => {
        return {
            userId: user.userId,
            name: user.name,
            pictureURL: user.pictureURL,
        };
    });
    return response.output({ users: output }, 200);
};

const deleteUser = async (request, response) => {
    const userId = request.pathVariables.id;
    const params = {
        UserPoolId: userPoolId,
        Username: userId,
    };
    await cisp.send(new AdminDeleteUserCommand(params));
    return response.output('User Deleted', 200);
};

const createUser = async (request, response) => {
    const fields = JSON.parse(request.event.body);
    const createUserParams = {
        UserPoolId: userPoolId,
        Username: fields.email,
        UserAttributes: [
            {
                Name: 'name',
                Value: fields.name,
            },
            {
                Name: 'email',
                Value: fields.email,
            },
            {
                Name: 'email_verified',
                Value: 'true',
            },
        ],
        ForceAliasCreation: false,
        DesiredDeliveryMediums: ['EMAIL'],
    };
    const results = await cisp.send(new AdminCreateUserCommand(createUserParams));

    const addToGroupParams = {
        UserPoolId: userPoolId,
        Username: results.User.Username,
        GroupName: fields.group,
    };

    await cisp.send(new AdminAddUserToGroupCommand(addToGroupParams));
    return response.output({}, 200);
};

const router = createRouter(RouterType.HTTP_API_V2);
router.add(Matcher.HttpApiV2('GET', '/users/'), enforceGroupMembership('admin'), getAllUsers);
router.add(Matcher.HttpApiV2('POST', '/users/'), enforceGroupMembership('admin'), validateBodyJSONVariables(schemas.createUser), createUser);
router.add(Matcher.HttpApiV2('GET', '/users/profile'), getCurrentUser);
router.add(Matcher.HttpApiV2('PATCH', '/users/profile'), parseMultipartFormData, updateCurrentUser);
router.add(Matcher.HttpApiV2('GET', '/users/profiles'), getAllProfiles);
router.add(Matcher.HttpApiV2('DELETE', '/users(/:id)'), enforceGroupMembership('admin'), validatePathVariables(schemas.idPathVariable), deleteUser);

exports.handler = async (event, context) => {
    return router.run(event, context);
};