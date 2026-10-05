<?php

namespace App\Http\Controllers;
use App\Http\Requests\CreatePositionCompetencyRequest;
use App\Http\Requests\UpdatePositionCompetencyRequest;

class PositionCompetencyController extends Controller
{
    /**
     * Display a listing of position competency.
     */
    public function getPositionCompetencies(int $position_id)
    {
        //
    }

    /**
     * Store a newly created position competency in storage.
     */
    public function createPositionCompetency(CreatePositionCompetencyRequest $request, int $position_id)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Display the specified position competency.
     */
    public function getSinglePositionCompetency(int $position_id, int $competency_id)
    {
        //
    }

    /**
     * Update the specified position competency in storage.
     */
    public function updatePositionCompetency(UpdatePositionCompetencyRequest $request, int $position_id, int $competency_id)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Remove the specified position competency from storage.
     */
    public function deletePositionCompetency(int $position_id, int $competency_id)
    {
        //
    }

    /**
     * Display a listing of position competencies linked to the specified unit.
     */
    public function getCompetenciesByUnit(int $unit_id)
    {
        //
    }
}
