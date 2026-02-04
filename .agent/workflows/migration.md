---
description: How to migrate the CRM to another computer
---

// turbo-all
# Migration Guide

To move the Hair Salon CRM to a new computer, follow these steps:

### 1. Locate the Project
The project is currently located at:
`C:\Users\Dell\.gemini\antigravity\scratch\hair-salon-crm`

### 2. Copy the Files
Copy the entire `hair-salon-crm` folder to a USB drive or cloud storage.
> [!NOTE]
> You do NOT need to copy the `node_modules` folder. If you do, it will just take more time and space.

### 3. Setup the New Computer
1. **Install Node.js**: Download and install the LTS version from [nodejs.org](https://nodejs.org/).
2. **Paste the Folder**: Place the `hair-salon-crm` folder on the new computer (e.g., in your Documents folder).

### 4. Initialize and Run
Open a terminal (PowerShell or CMD) in the project directory and run:
1. `npm install` (Installs all necessary libraries)
2. `npm run dev` (Starts the application)

### 5. Important: Database Notice
> [!WARNING]
> The database (Dexie/IndexedDB) is stored **locally in your browser**. Moving the code folders will **NOT** automatically move your clients and visit history.
> Currently, the data is tied to the computer where you entered it. If you need to move data, you would need to export it from the browser's DevTools or use a backup plugin (not yet implemented in the UI).
