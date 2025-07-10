import {employeeService} from '../services/employeeService.js';
import { handleAsync } from '../utils/handleAsync.js';
import { Employee } from '../models/employees.model.js';

export const employeeController = {
        /**
     * Controller to handle the creation of a new employee.
     * It resolves the 'reportsTo' manager reference before saving.
     * @param {import('express').Request} req - The Express request object.
     * @param {import('express').Response} res - The Express response object.
     */
    createEmployeeController : async (req, res) => {
        try {
            const employeeData = req.body; // e.g., { name: "New Hire", reportsTo: 98765 }

            // --- The Core Logic ---
            // If a manager ('reportsTo') is specified, resolve it to an ObjectId.
            if (employeeData.reportsTo) {
                // The identifier could be a githubId, name, or email.
                // We assume it's a githubId here for simplicity.
                const managerId = await employeeService.findEmployeeId({ githubId: employeeData.reportsTo });

                if (!managerId) {
                    // If the specified manager doesn't exist, return an error.
                    return res.status(400).json({ 
                        message: `Manager with GitHub ID '${employeeData.reportsTo}' not found.` 
                    });
                }

                // Replace the githubId with the actual ObjectId for saving.
                employeeData.reportsTo = managerId;
            }
            // --- End of Core Logic ---

            const newEmployee = await employeeService.createEmployee(employeeData);
            res.status(201).json(newEmployee);

        } catch (error) {
            // Handle potential validation errors from the model
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: "Validation Error", details: error.message });
            }
            console.error("Error in createEmployeeController:", error);
            res.status(500).json({ message: "An error occurred on the server." });
        }
    },
    /**
     * Controller to handle the request for fetching all employees.
     * @param {import('express').Request} req - The Express request object.
     * @param {import('express').Response} res - The Express response object.
     */
    getEmployeesRawController : async (req, res) => {
        try {
            const employees = await employeeService.getAllEmployeesRaw();

            if (!employees || employees.length === 0) {
                return res.status(404).json({ message: "No employees found." });
            }

            // The transformation logic belongs in the controller, as it's related
            // to how the data should be presented to the client.
            const transformedEmployees = employees.map(employee => {
                if (employee.githubId && typeof employee.githubId === 'number') {
                    return { ...employee, githubId: employee.githubId.toString() };
                }
                return employee;
            });

            res.status(200).json(transformedEmployees);

        } catch (error) {
            console.error("Error in getEmployeesController:", error);
            // Avoid sending detailed error info to the client in production.
            res.status(500).json({ message: "An error occurred on the server." });
        }

    },
};

export const getModuleList = handleAsync(async (req, res) => {
    const modules = await Employee.getAllModuleNames();
    res.status(200).json({
        status: 'success',
        data: modules,
    });
});