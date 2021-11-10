import { CourseCache, CourseResult, ExamResult, getExamDate } from "./db/types";
import _ from "lodash";

export function determineDeltas(results: CourseCache, cache: CourseCache): CourseResult[] | undefined {
    const commonCourses = _.intersectionWith(results.courses, cache.courses, (a,b) => courseResultEqual(a,b));
    const deltas = _.differenceWith(results.courses, commonCourses, (a,b) => courseResultEqual(a,b));

    return deltas.length > 0 ? deltas : undefined;
}

export function courseResultEqual(fromUpdate: CourseResult, fromCache: CourseResult): boolean {
    const propEq = fromUpdate.courseID === fromCache.courseID 
        && fromUpdate.credits === fromCache.credits && fromUpdate.grade === fromCache.grade 
        && fromUpdate.name === fromCache.name && fromUpdate.passed === fromCache.passed;

    const containedInBoth = 
        _.intersectionWith(fromUpdate.exams, fromCache.exams, (a,b) => examResultEqual(a,b));

    return propEq && containedInBoth.length === (fromUpdate.exams?.length ?? 0);
}

function examResultEqual(fromUpdate: ExamResult, fromCache: ExamResult): boolean {
    const updateDate = getExamDate(fromUpdate);
    const cacheDate = getExamDate(fromCache);
    const eq = fromUpdate.attempt === fromCache.attempt && updateDate === cacheDate 
        && fromUpdate.examType === fromCache.examType && fromUpdate.grade === fromCache.grade 
        && fromUpdate.semester === fromCache.semester;
    return eq;
}
