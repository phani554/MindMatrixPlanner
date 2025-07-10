import mongoose from "mongoose";
import { Employee } from "./models/employees.model.js";
import { log } from "console";

try {
    await mongoose.connect('mongodb://localhost:27017/github-dashboard');
    console.log("Connected ");
    const rec = new Employee({
        name: "Venkat Phaneendra Nittala",
        githubId: 157595414,
        role: 'developer',
        username: 'phani554'
    });
    await rec.save();
} catch (error) {
    console.log(error);
}
finally{
    mongoose.disconnect();
}