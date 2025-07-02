import mongoose from "mongoose";


export const db = {
    /**
     * Connect to MongoDB with retries
     * @param {string} uri - MongoDB connection URI
     * @param {number} maxRetries - Maximum retry attempts
     * @param {number} retryDelay - Delay between retries in ms
     * @returns {Promise<void>}
     */
    
     DBconnect : async (uri, maxRetries = 3, retryDelay = 3000) => {
        // Check if we're already connected.
        // readyState values: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        if (mongoose.connection.readyState === 1) {
            console.info("✅ MongoDB is already connected.");
            return mongoose.connection;
        }
        let attempts = 0;
        
        while (attempts < maxRetries) {
        try {
            await mongoose.connect(uri);
            console.info("✅ Connected to MongoDB");
            
            return ;
        } catch (error) {
            attempts++;
            console.error(`Failed to connect to MongoDB (attempt ${attempts}/${maxRetries}): ${error.message}`);
            
            if (attempts < maxRetries) {
            console.info(`Retrying in ${retryDelay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
            throw error; // All retries failed, re-throw the error
            }
        }
    }
    },

};



