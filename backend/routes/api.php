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

// Login route doesn't require authentication.
Route::controller(AuthController::class)
    ->group(function () {
    Route::post('login', 'login');
});

// All routes require authentication.
Route::middleware('auth:sanctum')->group(function () {

    // Get current authnticated user
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // ======================
    // AuthController
    // ======================
    Route::controller(AuthController::class)->group(function () {
        Route::post('logout', 'logout');
   });

    // ======================
    // RoleController
    // ======================
    Route::controller(RoleController::class)->group(function () {

            Route::get('roles', 'getRoles');
            Route::get('roles/{role_id}', 'getSingleRole');
            // Managing user's role
            Route::get('users/{user_id}/role', 'getSingleUserRole');

        // RBAC: Technical Administrator only
        Route::middleware('role:Technical Administrator')->group(function () {   
        Route::post('roles', 'createRole');
            Route::put('roles/{role_id}', 'updateRole');
            Route::delete('roles/{role_id}', 'deleteRole');
            // Managing user's role
            Route::put('users/{user_id}/role', 'updateUserRole');
            Route::delete('users/{user_id}/role', 'deleteUserRole');
        });

    });

    // ======================
    // UserController
    // ======================
    Route::controller(UserController::class)->group(function () {

            Route::get('users', 'getUsers');
            Route::get('users/{user_id}', 'getSingleUser');

        // RBAC: Technical Administrator only
        Route::middleware('role:Technical Administrator')->group(function () {
            Route::post('users', 'createUser');
            Route::put('users/{user_id}', 'updateUser');
            Route::delete('users/{user_id}', 'deleteUser');
        });

    });

    // ======================
    // OfficeController 
    // ======================
    Route::controller(OfficeController::class)->group(function () {

            Route::get('offices', 'getOffices');
            Route::get('offices/{office_id}', 'getSingleOffice');

        // RBAC: Administrative Administrator only
        Route::middleware('role:Administrative Administrator')->group(function () {   
            Route::post('offices', 'createOffice');
            Route::put('offices/{office_id}', 'updateOffice');
            Route::delete('offices/{office_id}', 'deleteOffice');
        });

    });

    // ======================
    // EmployeeController
    // ======================
    Route::controller(EmployeeController::class)->group(function () {

        // RBAC: Technical Administrator/Administrative Administrator/Concerned Office
        Route::middleware('role:Technical Administrator,Administrative Administrator,Concerned Office')->group(function () {   
            Route::get('employees', 'getEmployees');
            Route::get('employees/{employee_id}', 'getSingleEmployee');
        });

        // RBAC: Technical Administrator only
        Route::middleware('role:Technical Administrator')->group(function () {   
            Route::post('employees', 'createEmployee');
            Route::put('employees/{employee_id}', 'updateEmployee');
            Route::delete('employees/{employee_id}', 'deleteEmployee');
            // Importing employee profile 
            Route::post('employees/import', 'importEmployees');
        });

    });

    // ======================
    // PositionController
    // ======================

    Route::controller(PositionController::class)->group(function () {

            Route::get('positions', 'getPositions');
            Route::get('positions/{position_id}', 'getSinglePosition');
            // Managing employee's assigned position
            Route::get('employees/{employee_id}/position', 'getSingleEmployeePosition');

        // RBAC: Administrative Administrator only
        Route::middleware('role:Administrative Administrator')->group(function () {   
            Route::post('positions', 'createPosition');
            Route::put('positions/{position_id}', 'updatePosition');
            Route::delete('positions/{position_id}', 'deletePosition');

            // Managing employee's assigned position
            Route::put('employees/{employee_id}/position', 'updateEmployeePosition');
            Route::delete('employees/{employee_id}/position', 'deleteEmployeePosition');
        });

    });

    // ======================
    // CompetencyController 
    // ======================
    Route::controller(CompetencyController::class)->group(function () {

        // RBAC: Executive/Administrative Administrator
        Route::middleware('role:Executive,Administrative Administrator')->group(function () {   
            Route::get('competencies', 'getCompetencies');
            Route::get('competencies/{competency_id}', 'getSingleCompetency');
            Route::get('competency-categories', 'getCategories');
            Route::get('competency-categories/{competency_category_id}', 'getSingleCategory');
            Route::get('competencies/{competency_id}/proficiency-levels', 'getProficiencyLevels');
            Route::get('competencies/{competency_id}/proficiency-levels/{proficiency_level_id}', 'getSingleProficiencyLevel');
        });

        // RBAC: Administrative Administrator only
        Route::middleware('role:Administrative Administrator')->group(function () {   
            Route::post('competencies', 'createCompetency');
            Route::put('competencies/{competency_id}', 'updateCompetency');
            Route::delete('competencies/{competency_id}', 'deleteCompetency');

            // Managing competency categories
            Route::post('competency-categories', 'createCategory');
            Route::put('competency-categories/{competency_category_id}', 'updateCategory');
            Route::delete('competency-categories/{competency_category_id}', 'deleteCategory');

            // Managing proficiency levels
            Route::post('competencies/{competency_id}/proficiency-levels', 'createProficiencyLevel');
            Route::put('competencies/{competency_id}/proficiency-levels/{proficiency_level_id}', 'updateProficiencyLevel');
            Route::delete('competencies/{competency_id}/proficiency-levels/{proficiency_level_id}', 'deleteProficiencyLevel');
        });

    });

    // ======================
    // PositionCompetencyController
    // ======================
    Route::controller(PositionCompetencyController::class)->group(function () {

        // RBAC: Executive/Administrative Administrator/Concerned Office
        Route::middleware('role:Executive,Administrative Administrator,Concerned Office')->group(function () {   
           Route::get('positions/{position_id}/competencies', 'getPositionCompetencies');
        });

        // RBAC: Administrative Administrator only
        Route::middleware('role:Administrative Administrator')->group(function () {
            Route::post('positions/{position_id}/competencies', 'createPositionCompetency');
            Route::put('positions/{position_id}/competencies/{competency_id}', 'updatePositionCompetency');
            Route::delete('positions/{position_id}/competencies/{competency_id}', 'deletePositionCompetency');
        });

        // Position Competencies by unit
        Route::get('units/{unit_id}/positions/competencies', 'getCompetenciesByUnit');

    });

    // ======================
    // EmployeeCompetencyController
    // ======================
    Route::controller(EmployeeCompetencyController::class)->group(function () {

        // RBAC: Executive/Administrative Administrator/Concerned Office
        Route::middleware('role:Executive,Administrative Administrator,Concerned Office')->group(function () {   
            Route::get('employees/{employee_id}/competencies', 'getEmployeeCompetencies');
            Route::get('employees/{employee_id}/competencies/{competency_id}', 'getSingleEmployeeCompetency');
        });

        // RBAC: Concerned Office only
        Route::middleware('role:Concerned Office')->group(function () {   
            Route::post('employees/{employee_id}/competencies', 'createEmployeeCompetency');
            Route::put('employees/{employee_id}/competencies/{competency_id}', 'updateEmployeeCompetency');
            Route::delete('employees/{employee_id}/competencies/{competency_id}', 'deleteEmployeeCompetency');
        });

    });

    // ======================
    // GapAnalysisController
    // ======================
    Route::controller(GapAnalysisController::class)->group(function () {

        // RBAC: Executive/Administrative Administrator
        Route::middleware('role:Executive,Administrative Administrator')->group(function () {   
            Route::get('gap-analyses', 'getGapAnalyses');
            Route::get('gap-analyses/{gap_analysis_id}', 'getSingleGapAnalysis');
        });
        // RBAC: Administrative Administrator only
        Route::middleware('role:Administrative Administrator')->group(function () {   
            Route::post('gap-analyses', 'createGapAnalysis');
            Route::put('gap-analyses/{gap_analysis_id}', 'updateGapAnalysis');
            Route::delete('gap-analyses/{gap_analysis_id}', 'deleteGapAnalysis');
        });

    });

    // ======================
    // GapAnalysisResultController
    // ======================
    Route::controller(GapAnalysisResultController::class)->group(function () {

        // RBAC: Administrative Administrator only
        Route::middleware('role:Administrative Administrator')->group(function () {   
            Route::get('gap-analyses-results', 'getGapAnalysisResults');
            Route::get('gap-analyses-results/{gap_analysis_result_id}', 'getSingleGapAnalysisResult');
        });
        // RBAC: Administrative Administrator/Concerned Office
        Route::middleware('role:Administrative Administrator,Concerned Office')->group(function () {
            Route::post('gap-analyses-results', 'createGapAnalysisResult');
            Route::put('gap-analyses-results/{gap_analysis_result_id}', 'updateGapAnalysisResult');
            Route::delete('gap-analyses-results/{gap_analysis_result_id}', 'deleteGapAnalysisResult');
        
            // GapAnalysisResult by employee / units
            Route::get('employees/{employee_id}/gap-analyses-results', 'getGapResultsByEmployee');
            Route::get('units/{unit_id}/gap-analyses-results', 'getGapResultsByUnit');
        });

    });


    // ======================
    // HistoricalRecordController
    // ======================
    Route::controller(HistoricalRecordController::class)->group(function () {

        // RBAC: Administrative Administrator only
        Route::middleware('role:Administrative Administrator')->group(function () {   
            Route::get('historical-records', 'getHistoricalRecords');
            Route::post('historical-records', 'createHistoricalRecord');
            Route::get('historical-records/{historical_record_id}', 'getSingleHistoricalRecord');
            Route::put('historical-records/{historical_record_id}', 'updateHistoricalRecord');
            Route::delete('historical-records/{historical_record_id}', 'deleteHistoricalRecord');
        });

    });

    // ======================
    // DashboardController
    // ======================

    Route::controller(DashboardController::class)->group(function () {

            // Managing dashboard
            Route::get('dashboard', 'displayDashboard');
    });

    // ======================
    // ReportController
    // ======================

    Route::controller(ReportController::class)->group(function () {
        // RBAC: Executive/Administrative Administrator/Concerned Office
        Route::middleware('role:Executive,Administrative Administrator,Concerned Office')->group(function () {
            Route::get('reports', 'getReports');
            Route::get('reports/{report_id}', 'getSingleReport');
        });
        // RBAC: Administrative Administrator only
        Route::middleware('role:Administrative Administrator')->group(function () {
            Route::post('reports', 'createReport');
            Route::delete('reports/{report_id}', 'deleteReport');
            // Downloading report 
            Route::get('reports/{report_id}/download', 'downloadReport');
        });

    });

    // ======================
    // AccessLogController
    // ======================

    Route::controller(AccessLogController::class)->group(function () {
        // RBAC: Technical Administrator only
        Route::middleware('role:Technical Administrator')->group(function () {   
            // Managing access-logs
            Route::get('access-logs', 'getAccessLogs');
            Route::get('access-logs/{access_log_id}', 'getSingleAccessLog');
        });
    });

});