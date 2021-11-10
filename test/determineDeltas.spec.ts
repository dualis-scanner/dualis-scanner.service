import assert, { doesNotMatch } from "assert";
import { courseResultEqual, determineDeltas } from "../src/delta";
import fs from "fs";
import { CourseCache, CourseResult } from "../src/db/types";

describe("Delta Test", () => {
    let cachedResult: CourseResult[] = [];
    let newResult: CourseResult[] = [];
    it("Loading and parsing works successfully", () => {
        cachedResult = JSON.parse(fs.readFileSync("./test/resultReduced.json", {encoding: "utf-8"})) as CourseResult[];
        newResult = JSON.parse(fs.readFileSync("./test/result.json", {encoding: "utf-8"})) as CourseResult[];

        assert.notEqual(cachedResult, null);
        assert.notEqual(newResult, null);
    });

    it("Cache contains less elements than updated data", () => {
        assert(newResult.length > cachedResult.length, `updated-length: ${newResult.length}, cached-length: ${cachedResult.length}`);
    });

    it("Equality-checking of different courses should work properly", () => {
        const fromUpdate = newResult[3];
        const fromCache = cachedResult[0];
        // console.log({run: 1, fromUpdate, fromCache});
        assert(courseResultEqual(fromUpdate, fromCache));

        const fromUpdate2 = newResult[1];
        const fromCache2 = cachedResult[5];
        // console.log({run: 2, fromUpdate2, fromCache2});
        const eq = courseResultEqual(fromUpdate2, fromCache2)
        assert(!eq);
    });

    it("Deltas found", () => {
        const wrapCache: CourseCache = {
            courses: cachedResult,
            lastModifiedAt: new Date(),
            userID: "not relevant"
        };
        const wrapResults: CourseCache = {
            courses: newResult,
            lastModifiedAt: new Date(),
            userID: "not relevant"
        };
        const deltas = determineDeltas(wrapResults, wrapCache);
        assert(deltas !== undefined, "There should be deltas");
        console.log(deltas.length, cachedResult.length, newResult.length);
        
        // Will fail when deltas occur on exam level
        // assert.equal(deltas.length, newResult.length - cachedResult.length, "The amount of deltas should be equal to the difference of the updated and cached results");
    });
});