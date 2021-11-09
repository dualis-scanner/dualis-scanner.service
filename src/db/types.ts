export interface AuthRecord {
    userID: string;
    encryptedCredentials: string | null
};

export interface CourseResult {
    userID: string;
    courseID: string;
    name: string;
    grade: number;
    credits: number;
    passed: CourseCompletion;
    exams: ExamResult[];
    lastModifiedAt: Date;
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