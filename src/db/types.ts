import { ObjectId } from "mongodb";

export interface AuthRecord {
    _id?: ObjectId;
    userID: string;
    encryptedCredentials: string | null
};

export interface CourseCache {
    lastModifiedAt: Date;
    userID: string;
    courses: CourseResult[];
}

export interface CourseResult {
    courseID: string;
    name: string;
    grade: number;
    credits: number;
    passed: CourseCompletion;
    exams: ExamResult[];
};

export enum CourseCompletion {
    FAILED,
    UNKNOWN,
    PASSED
};

export interface ExamResult {
    attempt: number;
    semester: number;
    examType: string;
    date: Date;
    grade: number;
    lecture: String;
};

export interface UserHash {
    userID: string;
    userHash: string;
};