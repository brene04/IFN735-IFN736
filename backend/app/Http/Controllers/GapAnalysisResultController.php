<?php

namespace App\Http\Controllers;
use App\Http\Requests\CreateGapAnalysisResultsRequest;
use App\Http\Requests\UpdateGapAnalysisResultsRequest;

class GapAnalysisResultController extends Controller
{
    /**
     * Display a listing of gap analysis result.
     */
    public function getGapAnalysisResults()
    {
        //
    }

    /**
     * Store a newly created gap analysis result in storage.
     */
    public function createGapAnalysisResult(CreateGapAnalysisResultsRequest $request)
    {
        $validated = $request->validated(); 
        //
    }

    /**
     * Display the specified gap analysis result.
     */
    public function getSingleGapAnalysisResult(int $gap_analysis_result_id)
    {
        //
    }

    /**
     * Update the specified gap analysis result in storage.
     */
    public function updateGapAnalysisResult(UpdateGapAnalysisResultsRequest $request, int $gap_analysis_result_id)
    {
        $validated = $request->validated(); 
        //
    }

    /**
     * Remove the specified gap analysis result from storage.
     */
    public function deleteGapAnalysisResult(int $gap_analysis_result_id)
    {
        //
    }

    /**
     * Display a listing of gap analysis result for the specified employee.
     */
    public function getGapResultsByEmployee(int $employee_id)
    {
        //
    }

    /**
     * Display a listing of gap analysis result for the specified unit.
     */
    public function getGapResultsByUnit(int $unit_id)
    {
        //
    }
}
