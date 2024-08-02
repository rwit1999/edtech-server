"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLast12MonthsData = generateLast12MonthsData;
// Generics: <T extends Document> allows the function to accept any Mongoose model that extends the Document type.
// Parameters: model is a Mongoose model of type T.
// Return Type: The function returns a promise that resolves to an object containing an array of MonthData objects.
async function generateLast12MonthsData(model) {
    const last12Months = [];
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1); // to include current date
    for (let i = 11; i >= 0; i--) {
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i * 30 //2nd August 2023   (todays date lets say 1st July 2024)
        );
        const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 30 //2nd July 2023
        );
        const monthYear = endDate.toLocaleDateString("default", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
        const count = await model.countDocuments({
            createdAt: {
                $gte: startDate,
                $lt: endDate,
            },
        });
        last12Months.push({ month: monthYear, count }); //example  { month: "Aug 2023", count: 5 }
    }
    return { last12Months };
}
