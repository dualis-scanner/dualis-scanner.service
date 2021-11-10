import { ObjectId } from "mongodb";

export interface AuthRecord {
    _id?: ObjectId;
    userID: string;
    encryptedCredentials: string | null;
    wrongCredentials?: boolean;
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
    FAILED = -1,
    UNKNOWN = 0,
    PASSED = 1
};

export interface ExamResult {
    attempt: number;
    semester: number;
    examType: string;
    date: Date | null;
    grade: number;
};

export function getExamDate(exam: ExamResult): Date | null {
    if (!exam.date || exam.date.valueOf() === 0 || new Date(exam.date).valueOf() === 0) {
        return null;
    }
    return exam.date;
}

export interface UserHash {
    userID: string;
    userHash: string;
};