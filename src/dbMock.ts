// import { generateUserID } from "./auth";
// import { AuthRecord, Exam, CourseResult } from "./db/types";

// const authMockTable: AuthRecord[] = [
//     {
//         userID: "someUserID",
//         encryptedCredentials: "foo"
//     }
// ];

// const cacheMockTable: CourseResult[] = [
//     {
//         lastModifiedAt: new Date(),
//         userID: "someUserID",
//         cachedItems: []
//     }
// ]

// export function userExists(userID: string): boolean {
//     return authMockTable.find(record => record.userID === userID) != undefined;
// }

// export {authMockTable, cacheMockTable};