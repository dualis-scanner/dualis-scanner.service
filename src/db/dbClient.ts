import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import { AuthRecord, CourseCache, CourseResult } from "./types";
import dotenv from "dotenv";
dotenv.config();

const dbURL = () => `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@${process.env.DB_URL}?retryWrites=true&writeConcern=majority`;
let client: MongoClient | null = null;
let database: Db | null = null;
let COURSES: Collection<CourseCache> | null = null;
let CREDENTIALS: Collection<AuthRecord> | null = null;

export default async function dbClient() {
    if (!client || !database || !COURSES || !CREDENTIALS) {
        client = new MongoClient(dbURL());
        console.log("Before");
        await client.connect();
        console.log("After");
        database = client.db(process.env.DB_NAME);
        COURSES = database.collection<CourseCache>("courses");
        CREDENTIALS = database.collection<AuthRecord>("credentials");
    }

    return {
        getEncryptedCredentials,
        getCourseCacheFromUser,
        addUser,
        userExists,
        updateUserCredentials
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
    const result = await CREDENTIALS?.updateOne({userID}, {encryptedCredentials});
    return result?.modifiedCount === 1;
}