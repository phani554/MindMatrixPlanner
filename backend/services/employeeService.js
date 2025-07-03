import { Employee } from "../models/employees.model.js";
import { Schema } from 'mongoose';

/**
 * Service object encapsulating all employee-related database operations.
 */
export const employeeService = {
    /**
     * Fetches all employees from the database with a minimal projection.
     * Assumes the database connection is already established.
     * 
     * @returns {Promise<Array<Object>>} A promise resolving to an array of lean employee objects.
     */
    async getAllEmployeesRaw() {
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
    },

    /**
     * Finds the MongoDB ObjectId of a single employee based on a given identifier.
     * This is a crucial utility for resolving relationships before saving documents.
     * @param {object} identifier - An object specifying the lookup field, e.g., 
     *                              { githubId: 12345 } or { name: "Phani Kumar" }.
     * @returns {Promise<Schema.Types.ObjectId|null>} A promise that resolves to the 
     *                                                employee's ObjectId if found, or null otherwise.
     */
    async findEmployeeId(identifier) {
        // The query is built directly from the identifier object.
        // This makes the function flexible for future lookup needs (e.g., by email).
        const employee = await Employee.findOne(identifier, '_id').lean();
        return employee ? employee._id : null;
    },

    /**
     * Fetches all employee records from the database.
     * @returns {Promise<Array>} A promise that resolves to an array of all employees.
     */
    async getAllEmployees() {
        return await Employee.find().lean();
    },

    /**
     * Fetches only the names of all employees, sorted for display.
     * @returns {Promise<Array>} A promise that resolves to an array of employee objects,
     *                           each containing only the _id and name.
     */
    async getAllEmployeeNames() {
        return await Employee.find({}, 'name').sort({ name: 1 }).lean();
    },

    /**
     * Creates a new employee in the database.
     * @param {object} employeeData - The data for the new employee.
     * @returns {Promise<object>} A promise that resolves to the newly created employee document.
     */
    async createEmployee(employeeData) {
        const newEmployee = new Employee(employeeData);
        return await newEmployee.save();
    }
};