import { CourseCache, CourseCompletion, ExamResult } from "./types";

export function mapToTypeScriptStructure(userID: string, json: any): CourseCache | null {
    if (json.length === 0) {
        return null;
    }
    const cache: CourseCache = {
        lastModifiedAt: new Date(),
        userID,
        courses: []
    };

    for (const courseJSON of json) {
        const exams: ExamResult[] = [];
        for (const examJSON of courseJSON.Exams) {
            exams.push({
                attempt: examJSON.Attempt,
                date: parseDate(examJSON.Date),
                examType: examJSON.ExamType,
                grade: examJSON.Grade,
                semester: examJSON.Semester
            });
        }
        cache.courses.push({
            courseID: courseJSON.ID,
            credits: courseJSON.Credits,
            grade: courseJSON.Grade,
            name: courseJSON.Name,
            passed: courseJSON.Passed as CourseCompletion,
            exams
        });
    }
    return cache;
}

function parseDate(date: string): Date | null {
    if (!date) {
        return null;
    }
    const [day, month, year] = date.split(".").map(element => element as unknown as number);
    return new Date(year, month-1, day);
}