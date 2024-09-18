const signIn = require("./sign.js");
const { 
    listPools, 
    listClientsByPoolId, 
    createUser, 
    createPassword, 
    getUser 
} = require("./pools.js");

module.exports.auth = async (event) => {

    let rawBody = JSON.stringify(event.body);
    let body = JSON.parse(rawBody);
    let username = JSON.parse(body).username;

    try {
        const poolId = await listPools();
        const clientId = await listClientsByPoolId(poolId);

        if (await userExists(username, poolId)) {
            return await signInUser(poolId, clientId, username);
        }

        const createResponse = await createUser(username, poolId);
        if (createResponse !== 200) {
            throw new Error("Failed to create user");
        }

        const createPasswordResponse = await createPassword(username, poolId);
        if (createPasswordResponse !== 200) {
            throw new Error("Failed to set password");
        }

        console.log("User created and password set successfully");
        return await signInUser(poolId, clientId, username);
    } catch (error) {
        console.error("Error executing exec function:", error);
        return { statusCode: 500, error: error.message };
    }
}

async function userExists(username, poolId) {
    return await getUser(username, poolId);
}

async function signInUser(poolId, clientId, username) {
    let signInResponse = await signIn(poolId, clientId, username);
    let response = JSON.parse(JSON.stringify(signInResponse));
    if (response.$metadata.httpStatusCode === 200) {        
        let authentication = new Object();
        authentication.accessToken = response.AuthenticationResult.AccessToken;
        authentication.tokenType = response.AuthenticationResult.TokenType;
        authentication.expiresIn = response.AuthenticationResult.ExpiresIn;

        let authenticationResponse = {
            statusCode: response.$metadata.httpStatusCode,
            body: JSON.stringify(authentication)
        }
        
        return authenticationResponse;
    } else {
        return {
            statusCode: 500
        }
    }
}
