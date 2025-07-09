import fs from 'fs/promises';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { Employee } from './models/employees.model.js';

dotenv.config();

// Utility to parse module string into array
function cleanModules(str) {
  return str
    ? str.split(',').map(s => s.trim()).filter(Boolean)
    : [];
}

  // 1. Connect to MongoDB
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('FATAL: MONGODB_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('✔️ Connected to MongoDB');


  const devs = [ 
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
  const tests = [ 
    {
       "name": "Sageer Shaikh",
       "githubId": 92398225,
       "reportsTo": "",
       "role": "admin"
    },
    {
      "email": "sunil.rao@mindmatrix.net",
      "name": "Sunil Rao",
      "reportsTo": "",
      "module": "Product",
      "office": "Mumbai",
      "role": "tester"
    },
    {
      "email": "dubbaka.nagarani@maxval.net",
      "name": "Nagarani Dubbaka",
      "reportsTo": "",
      "module": "",
      "office": "Hyderabad",
      "role": "tester"
    },
    {
      "email": "vardharaj.kawde@rebackoffice.com",
      "name": "Vardharaj Kawde",
      "reportsTo": "Sunil Rao",
      "module": "Editors, LMS, Playbooks, View Assets, Content Syndication",
      "office": "Mumbai",
      "role": "tester"
    },
    {
      "email": "manjiri@revclerx.com",
      "name": "Manjiri Desmukh",
      "reportsTo": "Sageer",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "parveen@revclerx.com",
      "name": "Parveen Kumar",
      "reportsTo": "Sunil Rao",
      "module": "Galleries, User Mgmt",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "lovish@revclerx.com",
      "name": "Lovish Bhatti",
      "reportsTo": "Sageer",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "amandeep.kaur@revclerx.com",
      "name": "Amandeep Kaur",
      "reportsTo": "Sageer",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "amitabh.talukdar@maxval.net",
      "name": "Amitabh Talukdar",
      "reportsTo": "Sunil Rao",
      "module": "CRM, External Links",
      "office": "Hyderabad",
      "role": "tester"
    },
    {
      "email": "roma@revclerx.com",
      "name": "Roma Soni",
      "reportsTo": "Sageer",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "rharidas@vectre.net",
      "name": "Rohit Haridas",
      "reportsTo": "Sunil Rao",
      "module": "Social, Drip",
      "office": "Mumbai",
      "role": "tester"
    },
    {
      "email": "Vidya.Bade@maxval.net",
      "name": "Vidya Bade",
      "reportsTo": "Sunil Rao",
      "module": "Accounts, Contacts",
      "office": "Mumbai",
      "role": "tester"
    },
    {
      "email": "abhay.gaikwad@maxval.net",
      "name": "Abhay Gaikwad",
      "reportsTo": "Vardharaj",
      "module": "View Assets",
      "office": "Mumbai",
      "role": "tester"
    },
    {
      "email": "abhishek.kumar@revclerx.com",
      "name": "Abhishek Kumar",
      "reportsTo": "Manjiri",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "aditi.thakur@revclerx.com",
      "name": "Aditi Thakur",
      "reportsTo": "Parveen",
      "module": "Galleries",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "akash.kumar@revclerx.com",
      "name": "Akash Kumar",
      "reportsTo": "Lovish",
      "module": "Automation, Security",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "amandeep@revclerx.com",
      "name": "Aman Deep",
      "reportsTo": "Amandeep",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "amit.kumar@revclerx.com",
      "name": "Amit Sharma",
      "reportsTo": "Lovish",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "anandit.sood@revclerx.com",
      "name": "Anandit Sood",
      "reportsTo": "Amitabh",
      "module": "Collaboration, Asset List",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "ankit.kumar@revclerx.com",
      "name": "Ankit Kumar",
      "reportsTo": "Roma",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "anuj@revclerx.com",
      "name": "Anuj Singh",
      "reportsTo": "Lovish",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "Asher.Kumar@maxval.net",
      "name": "Asher Kumar",
      "reportsTo": "Nagarani",
      "module": "Opportunities",
      "office": "Hyderabad",
      "role": "tester"
    },
    {
      "email": "atul.sharma@revclerx.com",
      "name": "Atul Sharma",
      "reportsTo": "Vardharaj",
      "module": "Print Editor",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "bhagyashri.wankhade@revclerx.com",
      "name": "Bhagyashri Wankhade",
      "reportsTo": "Lovish",
      "module": "Automation/Security",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "deeksha.sharma@revclerx.com",
      "name": "Deeksha Sharma",
      "reportsTo": "Lovish",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "dheeraj.sobti@revclerx.com",
      "name": "Dheeraj Sobti",
      "reportsTo": "Parveen",
      "module": "User Mgmt",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "eshwar.chavan@maxval.net",
      "name": "Eshwar Chavan",
      "reportsTo": "Vardharaj",
      "module": "Playbooks",
      "office": "Mumbai",
      "role": "tester"
    },
    {
      "email": "gudia@revclerx.com",
      "name": "Gudia",
      "reportsTo": "Vardharaj",
      "module": "AI",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "hritikesh.kumar@revclerx.com",
      "name": "Hritikesh Kumar",
      "reportsTo": "Roma",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "imteyaz.ahamad@revclerx.com",
      "name": "Imteyaz Ahamad",
      "reportsTo": "Amitabh",
      "module": "SFDC",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "jasdeep.kaur@revclerx.com",
      "name": "Jasdeep Kaur",
      "reportsTo": "Vardharaj",
      "module": "Playbooks",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "kanchan.singh@revclerx.com",
      "name": "Kanchan Singh",
      "reportsTo": "Lovish",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "krishnakant.dubey@revclerx.com",
      "name": "Krishnakant Dubey",
      "reportsTo": "Amandeep",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    
    {
      "email": "Manish.k@revclerx.com",
      "name": "Manish Kumar",
      "reportsTo": "Vardharaj",
      "module": "Dataroom",
      "office": "Chandigarh",
      "role": "tester"
    },
    
    {
      "email": "meenakshi@revclerx.com",
      "name": "Meenakshi",
      "reportsTo": "Amandeep",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "megha.solanke@maxval.net",
      "name": "Megha Solanke",
      "reportsTo": "Rohit Haridas",
      "module": "Drip",
      "office": "Mumbai",
      "role": "tester"
    },
    {
      "email": "miryala.anusha@maxval.net",
      "name": "Anusha Miryala",
      "reportsTo": "Vidya",
      "module": "Contacts",
      "office": "Hyderabad",
      "role": "tester"
    },
    {
      "email": "mitali.thakur@revclerx.com",
      "name": "Mitali Thakur",
      "reportsTo": "Vardharaj",
      "module": "Web",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "mohit.makhaik@revclerx.com",
      "name": "Mohit Makhaik",
      "reportsTo": "Manjiri",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "natasha.kapoor@revclerx.com",
      "name": "Natasha Kapoor",
      "reportsTo": "Lovish",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "navdeep.singh@revclerx.com",
      "name": "Navdeep Singh",
      "reportsTo": "Rohit Haridas",
      "module": "Social",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "nikhil.rai@revclerx.com",
      "name": "Nikhil Rai",
      "reportsTo": "Lovish",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "nikhil.sidana@revclerx.com",
      "name": "Nikhil Sidana",
      "reportsTo": "Lovish",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "nishtha.aneja@revclerx.com",
      "name": "Nishtha Aneja",
      "reportsTo": "Parveen",
      "module": "User Mgmt",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "pankaj@revclerx.com",
      "name": "Pankaj Bhardwaj",
      "reportsTo": "Amitabh",
      "module": "Solution Mgmt",
      "office": "Chandigarh",
      "role": "tester"
    },
    
    {
      "email": "pooja.upreti@revclerx.com",
      "name": "Pooja Upreti",
      "reportsTo": "Vardharaj",
      "module": "Playbooks",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "prerna.sharma@revclerx.com",
      "name": "Prerna Sharma",
      "reportsTo": "Lovish",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "priyank.kumar@revclerx.com",
      "name": "Priyank Kumar",
      "reportsTo": "Amitabh",
      "module": "MDF, Deals",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "sahil.thakur@revclerx.com",
      "name": "Sahil Thakur",
      "reportsTo": "Lovish",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "sukreeti.sharma@revclerx.com",
      "name": "Sukreeti Sharma",
      "reportsTo": "Amandeep",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "tarun.jamwal@revclerx.com",
      "name": "Tarun jamwal",
      "reportsTo": "Lovish",
      "module": "Custom",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "tarun.mittal@revclerx.com",
      "name": "Tarun Mittal",
      "reportsTo": "Vardharaj",
      "module": "LMS",
      "office": "Chandigarh",
      "role": "tester"
    },
    {
      "email": "vara.prasad@maxval.net",
      "name": "Varaprasad Rao",
      "reportsTo": "Sunil Rao",
      "module": "Editors, CRM",
      "office": "Hyderabad",
      "role": "tester"
    },
    {
      "email": "viraj.madhavi@maxval.net",
      "name": "Viraj Madhavi",
      "reportsTo": "Amitabh",
      "module": "External Links, Product/Database",
      "office": "Mumbai",
      "role": "tester"
    },
    {
      "email": "yash.jain@maxval.net",
      "name": "Yash Jain",
      "reportsTo": "Vardharaj",
      "module": "Email",
      "office": "Mumbai",
      "role": "tester"
    }
  ];
  const all = [...devs, ...tests];

  const teamLeadsRaw = [
    'Vishal Patil', 'Vinayak Suryavanshi', 'Sumit Kumar', 'Shiv Mishra', 'Mahima Patil',
    'Tajinder Sharma', 'Furquan Khan', 'Tamanna Rana', 'Yogesh Gharat', 'Haresh Kedar',
    'Rahul Jogdand', 'Philip Kanth', 'Pushpendra Pandey', 'Abhay Mohnot', 'Meghana Thakekar',
    'Sayak Mitra', 'Priyanka Borunde', 'Vinesh Desham', 'Jatinder Singh',
    'Vardharaj Kawde', 'Manjiri Deshmukh', 'Parveen Kumar', 'Lovish Bhatti', 'Sageer Shaikh',
    'Amandeep Kaur', 'Sunil Rao', 'Amitabh Talukdar', 'Roma Soni', 'Nagarani Dubbaka',
    'Rohit Haridas', 'Vidya Bade'
  ];
  
  const moduleOwnersRaw = [
    'Furquan Khan', 'Haresh Kedar', 'Mahima Patil', 'Meghana Thakekar', 'Mohammed Ubaid',
    'Philip Kanth', 'Pushpendra Pandey', 'Rahul Jogdand', 'Shailesh Tayde', 'Shiv Mishra',
    'Tajinder Sharma', 'Vishal Patil', 'Yogesh Gharat',
    'Sunil Rao', 'Nagarani Dubbaka'
  ];
  
  function nameMatches(targetName, nameList) {
    const firstName = targetName.split(' ')[0];
    const directMatch = nameList.includes(targetName);
    const uniqueFirstMatch = nameList.filter(n => n.startsWith(firstName)).length === 1 && nameList.some(n => n.startsWith(firstName));
    return directMatch || uniqueFirstMatch;
  }
  
  async function seedEmployees() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('FATAL: MONGODB_URI not set in .env');
      process.exit(1);
    }
  
    await mongoose.connect(uri);
    console.log('✔️ Connected to MongoDB');
  
    const nameToId = new Map();
    const reportsToMap = new Map();
  
    console.log('--- Seeding employees ---');
    for (const rec of all) {
      const name = rec.name.trim();
      const isLead = nameMatches(name, teamLeadsRaw);
      const isOwner = nameMatches(name, moduleOwnersRaw);
  
      const payload = {
        name,
        email: rec.email?.toLowerCase().trim() || null,
        role: rec.role,
        office: rec.office || null,
        modules: cleanModules(rec.module),
        reportsTo: null,
        username: rec.username || null,
        githubId: rec.githubId || null,
        isTeamLead: isLead,
        isModuleOwner: isOwner
      };
  
      const emp = await Employee.create(payload);
      nameToId.set(name, emp._id);
      if (rec.reportsTo) {
        reportsToMap.set(emp._id.toString(), rec.reportsTo.trim());
      }
    }
  
    console.log('--- Linking reportsTo relationships ---');
    for (const [empId, mgrName] of reportsToMap.entries()) {
      let mgrId = nameToId.get(mgrName);
      if (!mgrId) {
        const matches = Array.from(nameToId.entries()).filter(([name]) => name.startsWith(mgrName));
        if (matches.length === 1) mgrId = matches[0][1];
      }
      if (mgrId) {
        await Employee.findByIdAndUpdate(empId, { reportsTo: mgrId });
      }
    }
  
    await mongoose.disconnect();
    console.log('✅ Seeding complete & disconnected');
  }
  
  seedEmployees().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
  

