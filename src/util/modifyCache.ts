import dbClient from "../db/dbClient";
import fs from "fs";

(async () => {
    const database = await dbClient();
    const caches = await database.findNotEmptyCaches();
    const cache = caches.find(c => c.userID === "testID");
    if (!cache) throw new Error("testID-User not found")
    const newCourses = cache.courses.slice(3);
    fs.writeFileSync("./resultReduced.json", JSON.stringify(newCourses));
    cache.courses = newCourses;
    await database.setCourseCacheFromUser(cache);
})();