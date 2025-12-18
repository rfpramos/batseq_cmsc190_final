
/**
 * 
 * @file dataRoutes.js
 * @description Express router for handling data-related API endpoints, including CRUD operations,
 * user management, authentication, data sharing, and BLASTN functionality.
 * Routes are mapped to corresponding controller methods in dataController.
 * @author Ramnick Francis Ramos
 * 
 * @version 1.0.0
 * @since 2024-08-11
 * @purpose Backend Auditing - Revisting Code for Data Management
 * @sprint 1, Ticket 1
 * 
 * 
 * Remaining To-Do:
 * 1. Implement Routes (if needed) for seqviz
 * 2. Implement Routes for phylogenetic tree generation using phylotreeJS
 */

// Import necessary modules
const express = require('express'); // Express framework for building web applications
const router = express.Router(); // Create a new router instance
const dataController = require('../controllers/dataController'); // Import the data controller for handling requests

// Define routes for data management
router.post('/data', dataController.addData); // Route to add new data
router.get('/data', dataController.getAllData); // Route to get all data
router.put('/data/:isolate_code', dataController.editDataByIsolateCode); // Route to edit data by isolate code
router.delete('/data/:isolate_code', dataController.deleteDataByIsolateCode); // Route to delete data by isolate code

router.post('/data/checkifadmin', dataController.checkIfAdmin); // Route to check if the user is an admin
router.post('/data/checkifallowed', dataController.checkDataAccess); // Route to check if the user is allowed to access the data
// Data Access and Sharing Routes: only the uploader can edit or delete their data


/**
 * @deprecated 
 * This shareto and shared route is deprecated and will be removed in future versions.
 */
router.post('/data/shareto', dataController.shareDataToUser); // Route to share data with another user

router.get('/data/shared', dataController.getSharedData);


/**
 * The following routes are for user management and authentication
 */

router.post('/signup', dataController.addUser); // Route for user signup

router.post('/auth/user', dataController.authenticateUser); // Route for user login

router.post('/auth/admin', dataController.authenticateAdmin); // Route for admin login

router.get('/data/getuser', dataController.getUsers); // Route to get all users
router.post('/data/approveUser', dataController.approveUser); // Route to approve a user, approve means the user can mutate the dataset
router.post('/data/restrictUser', dataController.restrictUser); // Route to restrict a user, restrict means the user cannot mutate the dataset

router.post('/blastn', dataController.blastn); // Route to perform BLASTN search

/**
 * @todo Implement Routes (if needed) for seqviz
 * @todo Implement Routes for phylogenetic tree generation using phylotreeJS
 */

// router.post('/seqviz', dataController.seqviz); // Route to perform seqviz analysis
// router.post('/phylo', dataController.phyloTree); // Route to generate phylogenetic tree

module.exports = router;
