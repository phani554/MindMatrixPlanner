import { Employee } from "../models/employees.model.js";

/**
 * Fetches all employees from the database.
 * Assumes the database connection is already established.
 * 
 * @returns {Promise<Array<Object>>} A promise resolving to an array of lean employee objects.
 */
export const getAllEmployees = async () => {
    // Define the fields to include/exclude for performance.
    const projection = {
        _id: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0
    };

    // Use .lean() to get plain JS objects instead of Mongoose documents.
    // This is much faster for read-only operations.
    const data = await Employee.find({}, projection).lean();
    return data;
};