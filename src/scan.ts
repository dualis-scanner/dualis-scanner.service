import { CourseCache, CourseResult, UserHash } from "./db/types";
import * as crypto from "crypto";
import { exec } from "child_process";
import dbClient from "./db/dbClient";

export const CREDENTIAL_SPLITTER = "_+*CRED*+_";
const CACHE_EXPIRE_TIME = 15;

export async function scan(userData: UserHash, res: any): Promise<void> {
    const database = await dbClient();

    const authRecord = await database.getEncryptedCredentials(userData.userID);
    if (!authRecord) {
        res.status(400).send("Given User does not exist.");
        return;
    }

    // Check if cache is still valid
    const cachedData = await database.getCourseCacheFromUser(userData.userID);
    // const cachedData = cacheMockTable.find(record => record.userID === userData.userID);
    if (!!cachedData && isCacheValid(cachedData)) {
        res.status(200).send({
            data: cachedData.courses
        });
        return;
    }

    const { userHash: hash } = userData;
    
    const { encryptedCredentials } = authRecord;
    if (!encryptedCredentials) {
        res.status(400).send("No user credentials maintained.");
        return;
    }
    const iv = Buffer.alloc(16);
    const key = Buffer.from(hash);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decryptedCredentials = decipher.update(encryptedCredentials, "base64", "utf8");
    decryptedCredentials += decipher.final("utf8");
    console.log(`Finished decryption: ${decryptedCredentials}`);

    const [ username, password, ] = decryptedCredentials.split(CREDENTIAL_SPLITTER);
    // TODO: Run actual worker script
    exec(`dualis-scanner-worker ${process.env.DUALIS_USERNAME} ${process.env.DUALIS_PWD} --driver=${process.env.CHROMEDRIVER_PATH}/chromedriver --dry`, (err, stdout, stderr) => {
        console.log(stdout, stderr);
        console.log("Finished scanning");
    });

    // Mock
    const results: CourseResult[] = [];
    if (!cachedData) {
        res.status(200).send({
            data: results,
            deltas: results
        });
        return;
    }

    const deltas = determineDeltas(results, cachedData);
    res.status(200).send({
        data: results,
        deltas
    });
}

function isCacheValid(cacheRecord: CourseCache): boolean {
    const delta = Date.now() - cacheRecord.lastModifiedAt.valueOf();
    return delta < CACHE_EXPIRE_TIME * 60 * 1000; // Mins to millis
}

export function determineDeltas(results: CourseResult[], cache: CourseCache): CourseResult[] | undefined {
    const deltas: CourseResult[] = [];

    for(const item of results) {
        if (!cache.courses.find(record => record == item)) {
            deltas.push(item);
        }
    }

    return deltas.length > 0 ? deltas : undefined;
}