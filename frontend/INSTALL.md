# Installation Instructions

Follow these steps to properly install all dependencies for the Connectify Like Minds frontend:

## Prerequisites
- Node.js (v18 or higher recommended)
- npm (v8 or higher recommended)

## Steps to Install Dependencies

### Method 1: Using the Command Line

1. Open a command prompt or PowerShell window
2. Navigate to the frontend directory:
   ```
   cd "path\to\Connectify Like Minds\frontend"
   ```
3. Install all dependencies:
   ```
   npm install
   ```
4. Install specific dependencies that might be missing:
   ```
   npm install tailwind-merge clsx --save
   ```

### Method 2: Using the Installation Script

1. Navigate to the `frontend` folder in File Explorer
2. Double-click the `install-dependencies.bat` file
3. Wait for the installation to complete

### Verifying Installation

To verify that all dependencies are installed correctly:

1. In the frontend directory, run:
   ```
   npm list tailwind-merge
   npm list clsx
   ```
2. You should see the versions of these packages listed

## Troubleshooting

If you encounter any issues:

1. Delete the `node_modules` folder and the `package-lock.json` file
2. Run `npm cache clean --force`
3. Run `npm install` again

## Running the Application

After installing dependencies, you can start the development server:

```
npm run dev
```

The application should be available at http://localhost:5173/ 