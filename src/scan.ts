import { CourseCache, CourseResult, UserHash } from "./db/types";
import * as crypto from "crypto";
import util from "util";
const exec = util.promisify(require('child_process').exec);
import dbClient from "./db/dbClient";
import fs from "fs";
import { mapToTypeScriptStructure } from "./db/mapper";
import { determineDeltas } from "./delta";

export const CREDENTIAL_SPLITTER = "_+*CRED*+_";
const CACHE_EXPIRE_TIME = 15;

export async function scan(userData: UserHash, res: any): Promise<void> {
    const database = await dbClient();

    const authRecord = await database.getEncryptedCredentials(userData.userID);
    if (!authRecord) {
        res.status(400).send("Given User does not exist.");
        return;
    }
    if (!!authRecord.wrongCredentials) {
        res.status(403).json({
            code: 403,
            message: "The user credentials were wrong. Please update them."
        });
        return;
    }

    // Check if cache is still valid
    const cachedData = await database.getCourseCacheFromUser(userData.userID);
    if (!!cachedData && isCacheValid(cachedData)) {
        res.status(200).send({
            // @ts-ignore
            data: cachedData.courses,
            deltas: [],
            lastModified: cachedData.lastModifiedAt
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
    
    const [ username, password, ] = decryptedCredentials.split(CREDENTIAL_SPLITTER);
    console.log(`Finished decryption: ${username} : ${password.replace(/[\w\W]/g, "*")}`);
    
    let execRes;
    try {
        execRes = await exec(`dualis-scanner-worker ${username} ${password} --driver=${process.env.CHROMEDRIVER_PATH}/chromedriver --logDir ./logs/${userData.userID}` );
    }
    catch (e) {
        console.log(e as any);
        execRes = {stdout: "", stderr: JSON.parse((e as any).stderr ?? "{}")}
        if (!(e as any).stderr) {
            console.log("No standard error returned.", (e as any).stderr);
        }
    }
    const { stdout, stderr: { exitCode } } = execRes;

    switch (exitCode) {
        case -2: { // Crash
            res.status(500).json({
                code: 500,
                message: "Updates could not be resolved due to internal server issues."
            });
            return;
        }
        case -1: { // Invalid Login
            res.status(403).json({
                code: 403,
                message: "The user credentials were wrong. Please update them."
            });
            await database.setWrongCredentialsFlag(userData.userID);
            return;
        }
    };

    const resultJSON = JSON.parse(stdout);
    console.log(resultJSON);
    
    const results: CourseCache | null = mapToTypeScriptStructure(userData.userID, resultJSON);
    if (!results) {
        res.status(200).send("No data");
        return;
    }
    // fs.writeFileSync("./result.json", JSON.stringify(results.courses));
    const success = await database.setCourseCacheFromUser(results);
    console.log(`Cache was updated: ${success}`);
    if (!cachedData) {
        res.status(200).send({
            data: results.courses,
            deltas: results.courses,
            lastModified: results.lastModifiedAt
        });
        return;
    }

    const deltas = determineDeltas(results, cachedData);
    res.status(200).send({
        data: results.courses,
        deltas,
        lastModifiedAt: results.lastModifiedAt
    });
}

function isCacheValid(cacheRecord: CourseCache): boolean {
    const delta = Date.now() - cacheRecord.lastModifiedAt.valueOf();
    return delta < CACHE_EXPIRE_TIME * 60 * 1000; // Mins to millis
}