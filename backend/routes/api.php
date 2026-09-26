<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\OfficeController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\CompetencyController;
use App\Http\Controllers\PositionCompetencyController;
use App\Http\Controllers\EmployeeCompetencyController;
use App\Http\Controllers\GapAnalysisController;
use App\Http\Controllers\GapAnalysisResultController;
use App\Http\Controllers\HistoricalRecordController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\AccessLogController;

// ======================
// AuthController
// ======================

Route::controller(AuthController::class)
    ->group(function () {

        Route::post('login', 'login');
        Route::post('logout', 'logout');

   });

// ======================
// RoleController
// ======================

Route::controller(RoleController::class)
    ->group(function () {

        // Role CRUD
        Route::get('roles', 'getRoles');
        Route::post('roles', 'createRole');
        Route::get('roles/{role_id}', 'getSingleRole');
        Route::put('roles/{role_id}', 'updateRole');
        Route::delete('roles/{role_id}', 'deleteRole');

        // Managing user's role
        Route::get('users/{user_id}/role', 'getSingleUserRole');
        Route::put('users/{user_id}/role', 'updateUserRole');
        Route::delete('users/{user_id}/role', 'deleteUserRole');

   });

// ======================
// UserController
// ======================

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');

Route::controller(UserController::class)
    ->group(function () {

        // User CRUD
        Route::get('users', 'getUsers');
        Route::post('users', 'createUser');
        Route::get('users/{user_id}', 'getSingleUser');
        Route::put('users/{user_id}', 'updateUser');
        Route::delete('users/{user_id}', 'deleteUser');

   });

// ======================
// OfficeController 
// ======================

Route::controller(OfficeController::class)
    ->group(function () {

        // Office CRUD
        Route::get('offices', 'getOffices');
        Route::post('offices', 'createOffice');
        Route::get('offices/{office_id}', 'getSingleOffice');
        Route::put('offices/{office_id}', 'updateOffice');
        Route::delete('offices/{office_id}', 'deleteOffice');
   });

// ======================
// EmployeeController
// ======================

Route::controller(EmployeeController::class)
    ->group(function () {

        // Importing employee profile 
        Route::post('employees/import', 'importEmployees');

        // Employee CRUD
        Route::get('employees', 'getEmployees');
        Route::post('employees', 'createEmployee');
        Route::get('employees/{employee_id}', 'getSingleEmployee');
        Route::put('employees/{employee_id}', 'updateEmployee');
        Route::delete('employees/{employee_id}', 'deleteEmployee');

   });

// ======================
// PositionController
// ======================

Route::controller(PositionController::class)
    ->group(function () {

        // Position CRUD
        Route::get('positions', 'getPositions');
        Route::post('positions', 'createPosition');
        Route::get('positions/{position_id}', 'getSinglePosition');
        Route::put('positions/{position_id}', 'updatePosition');
        Route::delete('positions/{position_id}', 'deletePosition');

        // Managing employee's assigned position
        Route::get('employees/{employee_id}/position', 'getSingleEmployeePosition');
        Route::put('employees/{employee_id}/position', 'updateEmployeePosition');
        Route::delete('employees/{employee_id}/position', 'deleteEmployeePosition');
   });

// ======================
// CompetencyController 
// ======================

Route::controller(CompetencyController::class)
    ->group(function () {

        // Competency CRUD
        Route::get('competencies', 'getCompetencies');
        Route::post('competencies', 'createCompetency');
        Route::get('competencies/{competency_id}', 'getSingleCompetency');
        Route::put('competencies/{competency_id}', 'updateCompetency');
        Route::delete('competencies/{competency_id}', 'deleteCompetency');

        // Managing competency categories
        Route::get('competency-categories', 'getCategories');
        Route::post('competency-categories', 'createCategory');
        Route::get('competency-categories/{competency_category_id}', 'getSingleCategory');
        Route::put('competency-categories/{competency_category_id}', 'updateCategory');
        Route::delete('competency-categories/{competency_category_id}', 'deleteCategory');

        // Managing proficiency levels
        Route::get('competencies/{competency_id}/proficiency-levels', 'getProficiencyLevels');
        Route::post('competencies/{competency_id}/proficiency-levels', 'createProficiencyLevel');
        Route::get('competencies/{competency_id}/proficiency-levels/{proficiency_level_id}', 'getSingleProficiencyLevel');
        Route::put('competencies/{competency_id}/proficiency-levels/{proficiency_level_id}', 'updateProficiencyLevel');
        Route::delete('competencies/{competency_id}/proficiency-levels/{proficiency_level_id}', 'deleteProficiencyLevel');

   });

// ======================
// PositionCompetencyController
// ======================

Route::controller(PositionCompetencyController::class)
    ->group(function () {

        // Position Competencies CRUD
        Route::get('positions/{position_id}/competencies', 'getPositionCompetencies');
        Route::post('positions/{position_id}/competencies', 'createPositionCompetency');
        Route::get('positions/{position_id}/competencies/{competency_id}', 'getSinglePositionCompetency');
        Route::put('positions/{position_id}/competencies/{competency_id}', 'updatePositionCompetency');
        Route::delete('positions/{position_id}/competencies/{competency_id}', 'deletePositionCompetency');

        // Position Competencies by unit
        Route::get('units/{unit_id}/positions/competencies', 'getCompetenciesByUnit');
   });

// ======================
// EmployeeCompetencyController
// ======================

Route::controller(EmployeeCompetencyController::class)
    ->group(function () {

       // Employee competency CRUD
        Route::get('employees/{employee_id}/employee-competencies', 'getEmployeeCompetencies');
        Route::post('employees/{employee_id}/employee-competencies', 'createEmployeeCompetency');
        Route::get('employees/{employee_id}/employee-competencies/{employee_competency_id}', 'getSingleEmployeeCompetency');
        Route::put('employees/{employee_id}/employee-competencies/{employee_competency_id}', 'updateEmployeeCompetency');
        Route::delete('employees/{employee_id}/employee-competencies/{employee_competency_id}', 'deleteEmployeeCompetency');

   });

// ======================
// GapAnalysisController
// ======================

Route::controller(GapAnalysisController::class)
    ->group(function () {

       // GapAnalysis CRUD
        Route::get('gap-analyses', 'getGapAnalyses');
        Route::post('gap-analyses', 'createGapAnalysis');
        Route::get('gap-analyses/{gap_analysis_id}', 'getSingleGapAnalysis');
        Route::put('gap-analyses/{gap_analysis_id}', 'updateGapAnalysis');
        Route::delete('gap-analyses/{gap_analysis_id}', 'deleteGapAnalysis');
   });

// ======================
// GapAnalysisResultController
// ======================

Route::controller(GapAnalysisResultController::class)
    ->group(function () {

        // GapAnalysis CRUD
        Route::get('gap-analyses-results', 'getGapAnalysisResults');
        Route::post('gap-analyses-results', 'createGapAnalysisResult');
        Route::get('gap-analyses-results/{gap_analysis_result_id}', 'getSingleGapAnalysisResult');
        Route::put('gap-analyses-results/{gap_analysis_result_id}', 'updateGapAnalysisResult');
        Route::delete('gap-analyses-results/{gap_analysis_result_id}', 'deleteGapAnalysisResult');
       
        //
        Route::get('employees/{employee_id}/gap-analyses-results', 'getGapResultsByEmployee');
        Route::get('units/{unit_id}/gap-analyses-results', 'getGapResultsByUnit');
   });


// ======================
// HistoricalRecordController
// ======================

Route::controller(HistoricalRecordController::class)
    ->group(function () {

        // HistoricalRecord CRUD
        Route::get('historical-records', 'getHistoricalRecords');
        Route::post('historical-records', 'createHistoricalRecord');
        Route::get('historical-records/{historical_record_id}', 'getSingleHistoricalRecord');
        Route::put('historical-records/{historical_record_id}', 'updateHistoricalRecord');
        Route::delete('historical-records/{historical_record_id}', 'deleteHistoricalRecord');
       
   });

// ======================
// DashboardController
// ======================

Route::controller(DashboardController::class)
    ->group(function () {

        // Managing dashboard
        Route::get('dashboard', 'displayDashboard');
   });

// ======================
// ReportController
// ======================

Route::controller(ReportController::class)
    ->group(function () {

        // Report CRUD
        Route::get('reports', 'getReports');
        Route::post('reports', 'createReport');
        Route::get('reports/{report_id}', 'getSingleReport');
        Route::delete('reports/{report_id}', 'deleteReport');

        // Downloading report 
        Route::get('reports/{report_id}/download', 'downloadReport');


   });

// ======================
// AccessLogController
// ======================

Route::controller(AccessLogController::class)
    ->group(function () {

        // Managing access-logs
        Route::get('access-logs', 'getAccessLogs');
        Route::get('access-logs/{access_log_id}', 'getSingleAccessLog');
   });