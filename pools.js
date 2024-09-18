const { 
    CognitoIdentityProviderClient, 
    AdminCreateUserCommand, 
    AdminSetUserPasswordCommand, 
    ListUserPoolsCommand, 
    ListUserPoolClientsCommand, 
    AdminGetUserCommand 
} = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });

async function listPools() {
    const command = new ListUserPoolsCommand({ MaxResults: 1 });
    const response = await client.send(command);
    return response.UserPools[0]?.Id || null;
}

async function listClientsByPoolId(poolId) {
    const command = new ListUserPoolClientsCommand({
        UserPoolId: poolId,
        MaxResults: 1
    });
    const response = await client.send(command);
    return response.UserPoolClients[0]?.ClientId || null;
}

async function createUser(username, userPoolId) {
    const command = new AdminCreateUserCommand({
        UserPoolId: userPoolId, 
        Username: username,
        MessageAction: "SUPPRESS", 
        TemporaryPassword: username,
        DesiredDeliveryMediums: ["EMAIL"]
    });
    const response = await client.send(command);
    return response.$metadata.httpStatusCode;
}

async function createPassword(username, userPoolId) {
    const command = new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: username,
        Password: username,
        Permanent: true
    });
    const response = await client.send(command);
    return response.$metadata.httpStatusCode;
}

async function getUser(username, poolId) {
    const command = new AdminGetUserCommand({
        UserPoolId: poolId,
        Username: username
    });

    try {
        await client.send(command);
        return true; // User exists
    } catch (error) {
        if (error.name === 'UserNotFoundException') {
            return false; // User does not exist
        }
        throw error; // Rethrow for other errors
    }
}

module.exports = { listPools, listClientsByPoolId, createUser, createPassword, getUser };
