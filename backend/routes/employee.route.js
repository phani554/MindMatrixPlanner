import { Employee } from "../models/employees.model.js";
import mongoose from "mongoose";
import { Router } from "express";
import { db } from "../db/dbConnect.js";

const router = Router();

/**
 * Fetches all employee data from the database.
 * Uses .lean() for performance, returning plain JavaScript objects.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of employee objects.
 */
async function fetchEmployeeData() {
    // No need to connect here every time. The connection should be established once when the app starts.
    // The .lean() method tells Mongoose to return plain JavaScript objects, not Mongoose documents.
    // This is faster and uses less memory.
    const connection = await db.DBconnect('mongodb://localhost:27017/github-dashboard');
    const projection = {
        _id: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0
    };
    const data = await Employee.find({}, projection).lean();
    return data;
}

router.get('/', async (req, res) => {
    try {
        const employees = await fetchEmployeeData();

        if (!employees || employees.length === 0) {
            return res.status(404).json({ message: "No employees found." });
        }

        // Transform the data to convert githubid to a string
        const transformedEmployees = employees.map(employee => {
            // Check if githubid exists and is a number before converting
            if (employee.githubId && typeof employee.githubId === 'number') {
                return {
                    ...employee,
                    githubId: employee.githubId.toString()
                };
            }
            return employee; // Return unmodified if no githubid or not a number
        });

        res.status(200).json(transformedEmployees);

    } catch (error) {
        console.error("Error fetching or transforming employee data:", error);
        res.status(500).json({ message: "An error occurred on the server." });
    }
});

export default router