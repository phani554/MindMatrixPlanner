import { getAllEmployees } from '../services/employeeService.js';

/**
 * Controller to handle the request for fetching all employees.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const getEmployeesController = async (req, res) => {
    try {
        const employees = await getAllEmployees();

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
    // There is NO `finally` block and NO `mongoose.disconnect()` here.
    // The connection must stay open for the next request.
};