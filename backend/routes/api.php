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
        Route::get('roles', 'index');
        Route::post('roles', 'store');
        Route::get('roles/{role_id}', 'show');
        Route::put('roles/{role_id}', 'update');
        Route::delete('roles/{role_id}', 'destroy');

        // Managing user's role
        Route::get('users/{user_id}/roles', 'getUserRoles');
        Route::put('users/{user_id}/roles/{role_id}', 'updateUserRole');
        Route::delete('users/{user_id}/roles/{role_id}', 'destroyUserRole');

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
        Route::get('users', 'index');
        Route::post('users', 'store');
        Route::get('users/{user_id}', 'show');
        Route::put('users/{user_id}', 'update');
        Route::delete('users/{user_id}', 'destroy');

   });

// ======================
// OfficeController 
// ======================

Route::controller(OfficeController::class)
    ->group(function () {

        // Office CRUD
        Route::get('offices', 'index');
        Route::post('offices', 'store');
        Route::get('offices/{office_id}', 'show');
        Route::put('offices/{office_id}', 'update');
        Route::delete('offices/{office_id}', 'destroy');
   });

// ======================
// EmployeeController
// ======================

Route::controller(EmployeeController::class)
    ->group(function () {

        // Importing employee profile 
        Route::post('employees/import', 'importEmployees');

        // Employee CRUD
        Route::get('employees', 'index');
        Route::post('employees', 'store');
        Route::get('employees/{employee_id}', 'show');
        Route::put('employees/{employee_id}', 'update');
        Route::delete('employees/{employee_id}', 'destroy');

   });

// ======================
// PositionController
// ======================

Route::controller(PositionController::class)
    ->group(function () {

        // Position CRUD
        Route::get('positions', 'index');
        Route::post('positions', 'store');
        Route::get('positions/{position_id}', 'show');
        Route::put('positions/{position_id}', 'update');
        Route::delete('positions/{position_id}', 'destroy');

        // Managing employee's assigned position
        Route::get('employees/{employee_id}/positions', 'getEmployeePositions');
        Route::post('employees/{employee_id}/positions', 'createEmployeePosition');
        Route::get('employees/{employee_id}/positions/{position_id}', 'getSingleEmployeePosition');
        Route::put('employees/{employee_id}/positions/{position_id}', 'updateEmployeePosition');
        Route::delete('employees/{employee_id}/positions/{position_id}', 'deleteEmployeePosition');
   });

// ======================
// CompetencyController 
// ======================

Route::controller(CompetencyController::class)
    ->group(function () {

        // Competency CRUD
        Route::get('competencies', 'index');
        Route::post('competencies', 'store');
        Route::get('competencies/{competency_id}', 'show');
        Route::put('competencies/{competency_id}', 'update');
        Route::delete('competencies/{competency_id}', 'destroy');

        // Managing competency categories
        Route::get('competency-categories', 'getCategories');
        Route::post('competency-categories', 'storeCategory');
        Route::get('competency-categories/{category_id}', 'showCategory');
        Route::put('competency-categories/{category_id}', 'updateCategory');
        Route::delete('competency-categories/{category_id}', 'destroyCategory');

        // Managing proficiency levels
        Route::get('proficiency-levels', 'getProficiencyLevels');
        Route::post('proficiency-levels', 'storeProficiencyLevel');
        Route::get('proficiency-levels/{level_id}', 'showProficiencyLevel');
        Route::put('proficiency-levels/{level_id}', 'updateProficiencyLevel');
        Route::delete('proficiency-levels/{level_id}', 'destroyProficiencyLevel');

   });

// ======================
// PositionCompetencyController
// ======================

Route::controller(PositionCompetencyController::class)
    ->group(function () {

        // Position Competencies CRUD
        Route::get('positions/{position_id}/competencies', 'index');
        Route::post('positions/{position_id}/competencies', 'store');
        Route::get('positions/{position_id}/competencies/{competency_id}', 'show');
        Route::put('positions/{position_id}/competencies/{competency_id}', 'update');
        Route::delete('positions/{position_id}/competencies/{competency_id}', 'destroy');

        // Position Competencies by Unit
        Route::get('units/{unit_id}/positions/competencies', 'getCompetenciesByUnit');
   });

// ======================
// EmployeeCompetencyController
// ======================

Route::controller(EmployeeCompetencyController::class)
    ->group(function () {

       // Employee competency CRUD
        Route::get('employees/{employee_id}/employee-competencies', 'index');
        Route::post('employees/{employee_id}/employee-competencies', 'store');
        Route::get('employees/{employee_id}/employee-competencies/{employee_competency_id}', 'show');
        Route::put('employees/{employee_id}/employee-competencies/{employee_competency_id}', 'update');
        Route::delete('employees/{employee_id}/employee-competencies/{employee_competency_id}', 'destroy');

   });

// ======================
// GapAnalysisController
// ======================

Route::controller(GapAnalysisController::class)
    ->group(function () {

       // GapAnalysis CRUD
        Route::get('gap-analyses', 'index');
        Route::post('gap-analyses', 'store');
        Route::get('gap-analyses/{gap_analysis_id}', 'show');
        Route::put('gap-analyses/{gap_analysis_id}', 'update');
        Route::delete('gap-analyses/{gap_analysis_id}', 'destroy');
   });

// ======================
// GapAnalysisResultController
// ======================

Route::controller(GapAnalysisResultController::class)
    ->group(function () {

        // GapAnalysis CRUD
        Route::get('gap-analyses-results', 'index');
        Route::post('gap-analyses-results', 'store');
        Route::get('gap-analyses-results/{gap_analysis_result_id}', 'show');
        Route::put('gap-analyses-results/{gap_analysis_result_id}', 'update');
        Route::delete('gap-analyses-results/{gap_analysis_result_id}', 'destroy');
       
        //
        Route::get('employees/{employee_id}/gap-analyses-results', 'getGapResultByEmployee');
        Route::get('units/{unit_id}/gap-analyses-results', 'getGapResultByUnit');
   });


// ======================
// HistoricalRecordController
// ======================

Route::controller(HistoricalRecordController::class)
    ->group(function () {

        // HistoricalRecord CRUD
        Route::get('historical-records', 'index');
        Route::post('historical-records', 'store');
        Route::get('historical-records/{historical_record_id}', 'show');
        Route::put('historical-records/{historical_record_id}', 'update');
        Route::delete('historical-records/{historical_record_id}', 'destroy');
       
   });

// ======================
// DashboardController
// ======================

Route::controller(DashboardController::class)
    ->group(function () {

        // Managing dashboard
        Route::get('dashboard', 'getDashboard');
   });

// ======================
// ReportController
// ======================

Route::controller(ReportController::class)
    ->group(function () {

        // Report CRUD
        Route::get('reports', 'index');
        Route::post('reports', 'store');
        Route::get('reports/{report_id}', 'show');
        Route::put('reports/{report_id}', 'update');
        Route::delete('reports/{report_id}', 'destroy');

        // Exporting report 
        Route::post('reports/{report_id}/export', 'exportReport');

        // Managing exported reports
        Route::get('exported-reports', 'getExportedReport');
        Route::get('exported-reports/{export_id}/download', 'downloadReport');


   });

// ======================
// AccessLogController
// ======================

Route::controller(AccessLogController::class)
    ->group(function () {

        // Managing access-logs
        Route::get('access-logs', 'getAccessLogs');
   });