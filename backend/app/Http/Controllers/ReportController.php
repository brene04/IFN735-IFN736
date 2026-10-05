<?php

namespace App\Http\Controllers;
use App\Http\Requests\CreateReportRequest;

class ReportController extends Controller
{
    /**
     * Display a listing of report.
     */
    public function getReports()
    {
        //
    }

    /**
     * Generate(export) and store a new report.
     */
    public function createReport()
    {
        $validated = $request->validated();
        //
    }

    /**
     * Display the specified report.
     */
    public function getSingleReport(int $report_id)
    {
        //
    }

    /**
     * Remove the specified report from storage.
     */
    public function deleteReport(int $report_id)
    {
        //
    }

    /**
     * Download the specified report.
     */
    public function downloadReport(int $report_id)
    {
        //
    }
}
