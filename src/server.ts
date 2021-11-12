import express from "express";
import { registerUser, updateUserCredentials, userHasCredentials } from "./auth";
import { UserHash } from "./db/types";
import { scan } from "./scan";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT ?? 5000;

const app = express();

// app.use(bodyParser.json({

// }));

app.use(express.json({
}));

app.use(express.urlencoded({
    extended: true
}));

app.get("/", (req, res) => res.send("Welcome in the Dualis-Scanner-Backend!"));

app.post("/register", async (req, res) => {
    console.log("Registration process started.");
    const authHash = await registerUser();
    console.log(authHash);
    res.status(201).json(authHash);
});

app.put("/updateCredentials", async (req, res) => {
    const { userID, encryptedCredentials } = (req as any).body;
    await updateUserCredentials(userID, encryptedCredentials, res);
    console.log("Credentials were updated", res.statusCode);
});

app.post("/updateFromDualis", async (req, res) => {
    const userData: UserHash = req.body;
    await scan(userData, res);
});

app.get("/hasCredentials(:userID)", async (req, res) => {
    const userIDWithParantheses = req.params.userID;
    const userID = userIDWithParantheses.substr(1, userIDWithParantheses.length-2);
    res.send({hasCredentials: await userHasCredentials(userID)});
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}...`);
});