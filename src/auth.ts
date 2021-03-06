import { randomUUID } from "crypto";
import { UserHash } from "./db/types";
import dbClient from "./db/dbClient";

export function generateHash(): string {
    const symbols = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    const hashLength = 32;

    let hash = "";
    for(let i = 0; i < hashLength; i++) {
        hash += symbols[Math.floor(Math.random() * symbols.length)];
    }

    return hash;
}

export async function generateUserID(): Promise<string> {
    // TODO: change back to uuid when deltas work
    const database = await dbClient();
    let uuid = randomUUID();
    
    if (await database.userExists(uuid)) {
        uuid = await generateUserID();
    }

    return uuid;
    // return "testID";
}

export async function registerUser(): Promise<UserHash> {
    const database = await dbClient();

    const userID = await generateUserID();
    const userHash = generateHash();

    await database.addUser(userID);

    return {
        userID,
        userHash
    };
}

export async function updateUserCredentials(userID: string, encryptedCredentials: string, res: any) {
    const database = await dbClient();
    if (!await database.userExists(userID)) {
        res.status(400).send("Given user does not exist.");
        return;
    }
    await database.updateUserCredentials(userID, encryptedCredentials);
    res.status(200).send("");
}

export async function userHasCredentials(userID: string): Promise<boolean> {
    const database = await dbClient();
    return await database.hasCredentials(userID);
}