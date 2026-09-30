<?php

namespace App\Http\Controllers;
use App\Http\Requests\CreateGapAnalysisRequest;
use App\Http\Requests\UpdateGapAnalysisRequest;

class GapAnalysisController extends Controller
{
    /**
     * Display a listing of gap analysis.
     */
    public function getGapAnalyses()
    {
        //
    }

    /**
     * Store a newly created gap analysis in storage.
     */
    public function createGapAnalysis(CreateGapAnalysisRequest $request)
    {
        $validated = $request->validated(); 
        //
    }

    /**
     * Display the specified gap analysis.
     */
    public function getSingleGapAnalysis(int $gap_analysis_id)
    {
        //
    }

    /**
     * Update the specified gap analysis in storage.
     */
    public function updateGapAnalysis(UpdateGapAnalysisRequest $request, int $gap_analysis_id)
    {
        $validated = $request->validated(); 
        //
    }

    /**
     * Remove the specified gap analysis from storage.
     */
    public function deleteGapAnalysis(int $gap_analysis_id)
    {
        //
    }
}
