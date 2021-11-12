import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import { AuthRecord, CourseCache, CourseResult } from "./types";
import dotenv from "dotenv";
dotenv.config();

const dbURL = () => `mongodb://${process.env.DB_URL}?retryWrites=true&writeConcern=majority`;
// const dbURL = () => `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@${process.env.DB_URL}?retryWrites=true&writeConcern=majority`;
let client: MongoClient | null = null;
let database: Db | null = null;
let COURSES: Collection<CourseCache> | null = null;
let CREDENTIALS: Collection<AuthRecord> | null = null;

export default async function dbClient() {
    if (!client || !database || !COURSES || !CREDENTIALS) {
        console.log(dbURL());
        client = new MongoClient(dbURL());
        await client.connect();
        database = client.db(process.env.DB_NAME);
        COURSES = database.collection<CourseCache>("courses");
        CREDENTIALS = database.collection<AuthRecord>("credentials");
    }

    return {
        getEncryptedCredentials,
        getCourseCacheFromUser,
        setCourseCacheFromUser,
        addUser,
        userExists,
        updateUserCredentials,
        getUsers,
        findNotEmptyCaches,
        setWrongCredentialsFlag,
        hasCredentials
    };
}

const getEncryptedCredentials = async (userID: string): Promise<AuthRecord | null> => {
    const credentials = await CREDENTIALS?.findOne({userID});

    return credentials ?? null;
}

const getCourseCacheFromUser = async (userID: string): Promise<CourseCache | null> => {
    const course = await COURSES?.findOne({userID});
    
    return course ?? null;
}

const setCourseCacheFromUser = async (cache: CourseCache) => {
    const existingCache = await COURSES?.findOne({userID: cache.userID});
    if (existingCache) {
        const result = await COURSES?.replaceOne({userID: cache.userID}, cache);
        return result?.modifiedCount === 1;
    }
    await COURSES?.insertOne(cache);
    return true;
}

const addUser = async (userID: string): Promise<boolean> => {
    const user: AuthRecord = {
        userID,
        encryptedCredentials: null
    };
    const createdElement = await CREDENTIALS?.insertOne(user);
    return !!createdElement;
}

const userExists = async (userID: string): Promise<boolean> => {
    const records = await CREDENTIALS?.find({userID}).toArray();
    return (!!records && records.length > 0);
}

const updateUserCredentials = async (userID: string, encryptedCredentials: string): Promise<boolean> => {
    const result = await CREDENTIALS?.updateOne({userID}, {$set: {encryptedCredentials, wrongCredentials: false}});
    return result?.modifiedCount === 1;
}

const getUsers = async () => {
    const users = await CREDENTIALS?.find().toArray();
    return users;
}

const findNotEmptyCaches = async (): Promise<CourseCache[]> => {
    const caches = await COURSES?.find({courses: {$exists: true}}).toArray();
    return caches ?? [];
}

const setWrongCredentialsFlag = async (userID: string) => {
    const result = await CREDENTIALS?.updateOne({userID}, {$set: {wrongCredentials: true}});
    console.log(`Blocked User-Credentials: ${result?.modifiedCount}`);
    const blockedUser = await CREDENTIALS?.findOne({userID});
    console.log("Blocked user: ", blockedUser);
}

const hasCredentials = async (userID: string) => {
    const result = await CREDENTIALS?.findOne({userID});
    return !!result && !!result.encryptedCredentials && !result.wrongCredentials;
}