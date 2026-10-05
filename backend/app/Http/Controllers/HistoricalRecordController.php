<?php

namespace App\Http\Controllers;
use App\Http\Requests\CreateHistoricalRecordsRequest;
use App\Http\Requests\UpdateHistoricalRecordsRequest;

class HistoricalRecordController extends Controller
{
    /**
     * Display a listing of historical record.
     */
    public function getHistoricalRecords()
    {
        //
    }

    /**
     * Store a newly created historical record in storage.
     */
    public function createHistoricalRecord(CreateHistoricalRecordsRequest $request)
    {
        $validated = $request->validated(); 
        //
    }

    /**
     * Display the specified historical record.
     */
    public function getSingleHistoricalRecord(int $historical_record_id)
    {
        //
    }

    /**
     * Update the specified historical record in storage.
     */
    public function updateHistoricalRecord(UpdateHistoricalRecordsRequest $request, int $historical_record_id)
    {
        $validated = $request->validated(); 
        //
    }

    /**
     * Remove the specified historical record from storage.
     */
    public function deleteHistoricalRecord(int $historical_record_id)
    {
        //
    }
}
