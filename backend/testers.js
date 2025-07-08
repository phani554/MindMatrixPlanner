const testers = [ 
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