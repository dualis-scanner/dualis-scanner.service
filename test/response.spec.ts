import assert, { doesNotMatch } from "assert";
import fs from "fs";

describe("Response Test", () => {
    it("Response Object should have less deltas than total objects", () => {
        const data = fs.readFileSync("./test/responseObject.json", {
            encoding: "utf-8"
        });

        const json = JSON.parse(data);
        console.log(`Deltas: ${json.deltas.length}`);
        console.log(`Total courses: ${json.data.courses.length}`);
        assert(json.data.courses.length > json.deltas.length);
    });
})