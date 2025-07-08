// import-employees.js

import mongoose from 'mongoose';
// Adjust the path to your Employee model as needed
import { Employee } from './models/employees.model.js';

/**
 * Finds a manager by their first name or full name and returns their ObjectId.
 * This function is case-insensitive and handles potential ambiguity.
 */
async function getManagerId(managerName) {
    if (!managerName || typeof managerName.trim() === "") return null;
    const escapedName = managerName.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp('^' + escapedName, 'i');
    try {
        const potentialManagers = await Employee.find({ name: regex }).select('_id name').lean();
        if (potentialManagers.length === 1) return potentialManagers[0]._id;
        if (potentialManagers.length > 1) {
            console.warn(`  -> ⚠️ Ambiguous Manager: '${managerName}' matched [${potentialManagers.map(m => m.name).join(', ')}]. Skipping.`);
            return null;
        }
        console.warn(`  -> ⚠️ Manager not found for name starting with '${managerName}'.`);
        return null;
    } catch (error) {
        console.error(`  -> ❌ Error finding manager '${managerName}':`, error);
        return null;
    }
}

async function runFinalImport() {
    // ================== PASTE YOUR EMPLOYEE DATA HERE ==================
    const dataToImport = [ 
        {
          "githubId":6465508,
          "email": "mm.amp.vg",
          "name": "Abhay Mohnot",
          "reportsTo": "",
          "role": "admin",
        },
        {
          "email": "meghana.thakekar@maxval.net",
          "name": "Meghana Thakekar",
          "reportsTo": "",
          "module": "Opportunities, Custom Work, Imports, Reports",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "vishal.patil@mindmatrix.net",
          "name": "Vishal Patil",
          "reportsTo": "",
          "module": "Editor, MDF, Deals",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "Pushpendra.Pandey@maxval.net",
          "name": "Pushpendra Pandey",
          "reportsTo": "",
          "module": "Playbook, LMS",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "philip.kanth@mindmatrix.net",
          "name": "Philip Kanth",
          "reportsTo": "",
          "module": "CRMs, Third Party Integration",
          "office": "Hyderabad",
          "role": "developer"
        },
        {
          "email": "shiv.mishra@mindmatrix.net",
          "name": "Shiv Mishra",
          "reportsTo": "",
          "module": "Performance, Client Tickets, Customization",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "yogesh.gharat@maxval.net",
          "name": "Yogesh Gharat",
          "reportsTo": "",
          "module": "Dashboard",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "mahima.patil@maxval.net",
          "name": "Mahima Patil",
          "reportsTo": "",
          "module": "Drip, Reports, Exports, Custom Work",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "tajinder@revclerx.com",
          "name": "Tajinder Sharma",
          "reportsTo": "",
          "module": "SSO, Social",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "furquan.khan@mindmatrix.net",
          "name": "Furquan Khan",
          "reportsTo": "",
          "module": "Salesforce CRM, IFT, AI, Fanfliks, Dynamics, Rebo, PaP",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "rahul.jogdand@maxval.net",
          "name": "Rahul Jogdand",
          "reportsTo": "",
          "module": "UI/UX",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "tamanna.rana@revclerx.com",
          "name": "Tamanna Rana",
          "reportsTo": "Philip Kanth",
          "module": "Partner Locator, Filter Mgmt",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "sumit@revclerx.com",
          "name": "Sumit Kumar Mittal",
          "username": "sumitrevclerx",
          "githubId": 58559444,
          "reportsTo": "Yogesh Gharat",
          "module": "Dashboard",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "haresh.kedar@maxval.net",
          "name": "Haresh Kedar",
          "reportsTo": "",
          "module": "Case, Collaboration, LeadRouting, Business Planning, Reports, Localization",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "vinayak.suryavanshi@maxval.net",
          "name": "Vinayak Suryavanshi",
          "reportsTo": "Shiv Mishra",
          "module": "Setup/ Locators/ Performance",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "priyanka.borunde@maxval.net",
          "name": "Priyanka Borunde",
          "reportsTo": "Shiv Mishra",
          "module": "Gallery, Setup",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "abdur.rauf@maxval.net",
          "name": "Abdur Rauf",
          "reportsTo": "Vishal Patil",
          "module": "Web, Dataroom, MDF",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "abhijit.nair@maxval.net",
          "name": "Abhijit Nair",
          "reportsTo": "Vinayak Suryavanshi",
          "module": "System Notifiaction Configuration, Setup",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "abhineet.kumar@revclerx.com",
          "name": "Abhineet Kumar",
          "reportsTo": "Sumit Kumar",
          "module": "Dashboard",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "abhishek.saiswani@maxval.net",
          "name": "Abhishek Saiswani",
          "reportsTo": "Shiv Mishra",
          "module": "Marketplace, Navigation",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "abhishek.ugale@maxval.net",
          "name": "Abhishek Ugale",
          "reportsTo": "Mahima Patil",
          "module": "Drips",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "achal.kumar@revclerx.com",
          "name": "Achal Kumar",
          "reportsTo": "Tajinder Sharma",
          "module": "Fanfliks",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "ajitpal.singh@revclerx.com",
          "name": "Ajitpal Singh",
          "reportsTo": "Furquan Khan",
          "module": "IFT",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "akanksha.sharma@revclerx.com",
          "name": "Akanksha Sharma",
          "reportsTo": "Tamanna Rana",
          "module": "Partner Locator, Filter Mgmt",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "amit.ahuja@revclerx.com",
          "name": "Amit Ahuja",
          "reportsTo": "Sumit Kumar",
          "module": "Dashboard",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "amritpal.singh@revclerx.com",
          "name": "Amritpal Singh",
          "reportsTo": "Furquan Khan",
          "module": "Postgres, Fanfliks",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "amruta.kamble@maxval.net",
          "name": "Amruta Kamble",
          "reportsTo": "Vinayak Suryavanshi",
          "module": "Campaign, Link Manager, Reports",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "aniket.kumar@revclerx.com",
          "name": "Aniket Kumar",
          "reportsTo": "Furquan Khan",
          "module": "Salesforce CRM, Postgres",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "anju.v@revclerx.com",
          "name": "Anju Vishwakarma",
          "reportsTo": "Furquan Khan",
          "module": "IFT",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "ashif.husain@revclerx.com",
          "name": "Ashif Husain",
          "reportsTo": "Tajinder Sharma",
          "module": "Social Drips, SSO",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "ashutosh.pandey@maxval.net",
          "name": "Ashutosh Pandey",
          "reportsTo": "Yogesh Gharat",
          "module": "Dashboard",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "ashwani.kumar@revclerx.com",
          "name": "Ashwani Kumar",
          "reportsTo": "Furquan Khan",
          "module": "Salesforce CRM",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "Chinna.kotareddy@maxval.net",
          "name": "Chinna Kotareddy",
          "reportsTo": "Mahima Patil",
          "module": "Custom Work - Acronis",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "cnigdha.soares@maxval.net",
          "name": "Cnigdha Soares",
          "reportsTo": "Mahima Patil",
          "module": "Custom Work - Acronis",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "dikshita.kasare@maxval.net",
          "name": "Dikshita Kasare",
          "reportsTo": "Haresh Kedar",
          "module": "Localization",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "dilleswar@revclerx.com",
          "name": "R Dilleswar Rao",
          "reportsTo": "Furquan Khan",
          "module": "Salesforce",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "dilpreet.kaur@revclerx.com",
          "name": "Dilpreet Kaur",
          "reportsTo": "Rahul Jogdand",
          "module": "UI/UX",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "divyesh.hole@maxval.net",
          "name": "Divyesh Hole",
          "reportsTo": "Yogesh Gharat",
          "module": "Dashboard",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "eva.chaudhary@revclerx.com",
          "name": "Eva Chaudhary",
          "reportsTo": "Furquan Khan",
          "module": "IFT",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "gurinder.singh@revclerx.com",
          "name": "Gurinder Singh",
          "reportsTo": "Tajinder Sharma",
          "module": "Mobile APP, Social",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "harikumar.reddy@mindmatrix.net",
          "name": "Harikumar Reddy",
          "reportsTo": "Tajinder Sharma",
          "module": "DevOps",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "jaskaran.singh1@revclerx.com",
          "name": "Jaskaran Singh",
          "reportsTo": "Tajinder Sharma",
          "module": "Social",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "jay.barot@maxval.net",
          "name": "Jay Barot",
          "reportsTo": "Vishal Patil",
          "module": "MDF",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "jatinder.dhaliwal@mindmatrix.net",
          "name": "Jatinder Singh",
          "reportsTo": "Philip Kanth",
          "module": "View Assets, Bridge AI, Fanfliks, Chrome Extension",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "kadiri.zaid@maxval.net",
          "name": "Zaid Kadri",
          "reportsTo": "Pushpendra Pandey",
          "module": "Playbook, LMS",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "komal.chawla@revclerx.com",
          "name": "Komal Chawla",
          "reportsTo": "Rahul Jogdand",
          "module": "UI/UX",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "kriti.shetty@maxval.net",
          "name": "Kriti Shetty",
          "reportsTo": "Vishal Patil",
          "module": "Editor",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "kumar.chandan@revclerx.com",
          "name": "Kumar Chandan",
          "reportsTo": "Sumit Kumar",
          "module": "Dashboard",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "kunal.wavhule@maxval.net",
          "name": "Kunal Wavhule",
          "reportsTo": "Yogesh Gharat",
          "module": "Dashboard",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "latha.reddy@mindmatrix.net",
          "name": "Latha Reddy",
          "reportsTo": "Abhay Mohnot",
          "module": "Postgres",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "laxmikant.yadav@maxval.net",
          "name": "Laxmikant Yadav",
          "reportsTo": "Furquan Khan",
          "module": "Salesforce CRM",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "lekha.ram@revclerx.com",
          "name": "Lekha Ram",
          "reportsTo": "Furquan Khan",
          "module": "Salesforce CRM",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "lidiya.dominic@maxval.net",
          "name": "Lidiya Dominic",
          "reportsTo": "Vishal Patil",
          "module": "Editors",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "manali.patil@maxval.net",
          "name": "Manali Patil",
          "reportsTo": "Meghana Thakekar",
          "module": "Opportunity, Cusom Work",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "manoj.sharma@revclerx.com",
          "name": "Manoj Sharma",
          "reportsTo": "Furquan Khan",
          "module": "SFDC, Custom Work",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "mayur.patil@maxval.net",
          "name": "Mayur Patil",
          "reportsTo": "Pushpendra Pandey",
          "module": "Playbook, LMS",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "mohammed.hammad@maxval.net",
          "name": "Mohammed Hammad",
          "reportsTo": "Vishal Patil",
          "module": "MDF",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "mohammed.saeed@maxval.net",
          "name": "Mohammed Saeed",
          "reportsTo": "Shiv Mishra",
          "module": "SNC, Setup, Opportunity related",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "mubaid@mindmatrix.net",
          "name": "Mohammed Ubaid",
          "reportsTo": "",
          "module": "Custom Work",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "muwaj.mulla@maxval.net",
          "name": "Muwaj Mulla",
          "reportsTo": "Vishal Patil",
          "module": "Automation UI",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "noor.ansari@maxval.net",
          "name": "Noor Ansari",
          "reportsTo": "Sayak Mitra",
          "module": "Hubspot CRM",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "parvesh.sharma@revclerx.com",
          "name": "Parvesh Sharma",
          "reportsTo": "Rahul Jogdand",
          "module": "UI/UX",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "payal.thakur@revclerx.com",
          "name": "Payal Thakur",
          "reportsTo": "Furquan Khan",
          "module": "IFT",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "pooja.ghope@maxval.net",
          "name": "Pooja Ghope",
          "reportsTo": "Shiv Mishra",
          "module": "Setup",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "prachi.bansode@maxval.net",
          "name": "Prachi Bansode",
          "reportsTo": "Priyanka Borunde",
          "module": "User Mgmt, Custom Work",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "prashant.ghule@maxval.net",
          "name": "Prashant Ghule",
          "reportsTo": "Meghana Thakekar",
          "module": "Account Overlap, Opportunity,  Collaboration",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "pratik.bhagit@maxval.net",
          "name": "Pratik Bhagit",
          "reportsTo": "Vishal Patil",
          "module": "Contract",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "priya.badyal@revclerx.com",
          "name": "Priya Badyal",
          "reportsTo": "Furquan Khan",
          "module": "SFDC, Custom Work",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "rohin.sharma@revclerx.com",
          "name": "Rohin Sharma",
          "reportsTo": "Sumit Kumar",
          "module": "Dashboard",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "rohit.gupta@revclerx.com",
          "name": "Rohit Gupta",
          "reportsTo": "Furquan Khan",
          "module": "IFT",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "saba.shaikh@maxval.net",
          "name": "Saba Shaikh",
          "reportsTo": "Pushpendra Pandey",
          "module": "Playbook, LMS",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "sabharee.raj@maxval.net",
          "name": "Sabharee Raj",
          "reportsTo": "Vinesh Desham",
          "module": "Smartlists Scoring",
          "office": "Hyderabad",
          "role": "developer"
        },
        {
          "email": "sakshi.phalke@maxval.net",
          "name": "Sakshi Phalke",
          "reportsTo": "Vinayak Suryavanshi",
          "module": "Setup",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "Salmaan@revclerx.com",
          "name": "Salmaan Ali",
          "reportsTo": "Sumit Kumar",
          "module": "Dashboard",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "sarbjit.raju@revclerx.com",
          "name": "Sarbjit Raju",
          "reportsTo": "Tajinder Sharma",
          "module": "AI",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "saurab.kumar@revclerx.com",
          "name": "Saurab Kumar",
          "reportsTo": "Jatinder Singh",
          "module": "View Assets",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "sayak.mitra@maxval.net",
          "name": "Sayak Mitra",
          "reportsTo": "Philip Kanth",
          "module": "CRMs",
          "office": "Hyderabad",
          "role": "developer"
        },
        {
          "email": "Shailesh.Tayde@mindmatrix.net",
          "name": "Shailesh Tayde",
          "reportsTo": "",
          "module": "Global + Custom Work, Security, Performance",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "shakeb.anwar@revclerx.com",
          "name": "Shakeb Anwar",
          "reportsTo": "Haresh Kedar",
          "module": "Cases",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "shubham.tyagi@revclerx.com",
          "name": "Shubham Tyagi",
          "reportsTo": "Sayak Mitra",
          "module": "CRM",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "shubhangi.jadhav@maxval.net",
          "name": "Shubhangi Jadhav",
          "reportsTo": "Yogesh Gharat",
          "module": "Dashboard",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "shubhankar.sharma@revclerx.com",
          "name": "Shubhankar Sharma",
          "reportsTo": "Jatinder Singh",
          "module": "Fanfliks, View Assets",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "srushti.sakharkar@maxval.net",
          "name": "Srushti Sakharkar",
          "reportsTo": "Sayak Mitra",
          "module": "CRM",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "steffi.mary@maxval.net",
          "name": "Steffi Mary",
          "reportsTo": "Vishal Patil",
          "module": "Editor, Business Planning",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "sunil.kumar@revclerx.com",
          "name": "Sunil Kumar",
          "reportsTo": "Rahul Jogdand",
          "module": "UI/UX",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "tushar.gupta@maxval.net",
          "name": "Tushar Gupta",
          "reportsTo": "Haresh Kedar",
          "module": "Localization",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "umed.gunjal@maxval.net",
          "name": "Umed Gunjal",
          "reportsTo": "Furquan Khan",
          "module": "SFDC",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "varsha.golimbade@maxval.net",
          "name": "Varsha Golimbade",
          "reportsTo": "Priyanka Borunde",
          "module": "Announcement/2FA/Login/Password",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "Vinesh.desham@maxval.net",
          "name": "Vinesh Desham",
          "reportsTo": "Philip Kanth",
          "module": "Automation",
          "office": "Hyderabad",
          "role": "developer"
        },
        {
          "email": "wasim.khan@maxval.net",
          "name": "Wasim Khan",
          "reportsTo": "Pushpendra Pandey",
          "module": "Playbook,  LMS",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "wasima.shaikh@maxval.net",
          "name": "Wasima Shaikh",
          "reportsTo": "Meghana Thakekar",
          "module": "Opportunity",
          "office": "Mumbai",
          "role": "developer"
        },
        {
          "email": "yasin.shaikh@revclerx.com",
          "name": "Yasin Shaikh",
          "reportsTo": "Tajinder Sharma",
          "module": "Social",
          "office": "Chandigarh",
          "role": "developer"
        },
        {
          "email": "yogendra.matkar@maxval.net",
          "name": "Yogendra matkar",
          "reportsTo": "Vishal Patil",
          "module": "Editor, Deals",
          "office": "Mumbai",
          "role": "developer"
        }
    ];
    // ===================================================================

    console.log('--- Starting Final Employee Data Import ---');
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/github-dashboard';
    if (MONGO_URI === 'your_mongodb_connection_string') {
        console.error("❌ ERROR: Please configure your MONGO_URI.");
        return;
    }
    
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Database connected.');

        // This set will store the ObjectId of every person who is a manager.
        const managerObjectIds = new Set();

        // --- PHASE 1: UPSERT ALL EMPLOYEES & IDENTIFY MANAGERS ---
        console.log('\n--- Phase 1: Upserting employee data ---');
        for (const employeeData of dataToImport) {
            if (!employeeData.name) {
                console.error('Skipping record due to missing name:', employeeData);
                continue;
            }
            
            const moduleArray = (employeeData.module || "").split(',').map(m => m.trim()).filter(Boolean);
            const managerId = await getManagerId(employeeData.reportsTo);

            if (managerId) {
                managerObjectIds.add(managerId.toString()); // Store as string for easy comparison
            }

            const payload = {
                ...employeeData,
                reportsTo: managerId,
                modules: moduleArray,
            };
            delete payload.module;

            await Employee.findOneAndUpdate({ name: employeeData.name }, payload, { upsert: true, new: true, setDefaultsOnInsert: true });
            console.log(`  -> Upserted: ${employeeData.name}`);
        }
        console.log('--- Phase 1 Complete ---');

        // --- PHASE 2: SET OWNERSHIP STATUS BASED ON COLLECTED IDs ---
        console.log('\n--- Phase 2: Updating module owner statuses ---');

        await Employee.updateMany({}, { $set: { isModuleOwner: false } });
        console.log('  -> Reset all employees to non-owner status.');

        if (managerObjectIds.size > 0) {
            // --- THIS IS THE CORRECTED PART ---
            // Simply convert the Set to an Array of strings.
            const managerIdArray = [...managerObjectIds];

            // Mongoose will automatically cast the strings in the array to ObjectIds
            // when used in a query against an ObjectId field like `_id`.
            const updateResult = await Employee.updateMany(
                { _id: { $in: managerIdArray } },
                { $set: { isModuleOwner: true } }
            );
            console.log(`  -> Successfully marked ${updateResult.modifiedCount} employees as module owners.`);
        } else {
            console.log('  -> No managers identified, no owners marked.');
        }
        console.log('--- Phase 2 Complete ---');

    } catch (error) {
        console.error('\n❌ A critical error occurred during the import process:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDatabase disconnected.');
    }
}

// Execute the import script
runFinalImport();