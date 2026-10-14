<?php

namespace App\Http\Controllers;
use App\Http\Requests\CreatePositionCompetencyRequest;
use App\Http\Requests\UpdatePositionCompetencyRequest;
use App\Models\PositionCompetency;
use App\Models\Position;
use App\Models\Competency;
use Illuminate\Http\JsonResponse;

class PositionCompetencyController extends Controller
{
    /**
     * Display a listing of position competency.
     */
    public function getPositionCompetencies(int $position_id)
    {
        $positionCompetencies = PositionCompetency::where('position_id', $position_id)
            ->get();

        return response()->json([
            'data' => $positionCompetencies
        ], 200);
    }

    /**
     * Store a newly created position competency in storage.
     */
    public function createPositionCompetency(CreatePositionCompetencyRequest $request, int $position_id)
    {
        $validated = $request->validated();
        $positionCompetency = PositionCompetency::create([
            'position_id' => $position_id,
            'competency_id' => $validated['competency_id'],
            'required_level' => $validated['required_level'],
            'priority' => $validated['priority'],
        ]);
        
        return response()->json([
            'message' => 'Position competency created successfully.',
            'data' => $positionCompetency
        ], 201);     
    }

    /**
     * Display the specified position competency.
     */
    public function getSinglePositionCompetency(int $position_id, int $competency_id)
    {
        $positionCompetency = PositionCompetency::where('position_id', $position_id)
            ->where('competency_id', $competency_id)
            ->firstOrFail();

        return response()->json([
            'data' => $positionCompetency
        ], 200);
    }

    /**
     * Update the specified position competency in storage.
     */
    public function updatePositionCompetency(UpdatePositionCompetencyRequest $request, int $position_id, int $competency_id)
    {
        $validated = $request->validated();
        $positionCompetency = PositionCompetency::where('position_id', $position_id)
            ->where('competency_id', $competency_id)
            ->firstOrFail();

        $positionCompetency->update($validated);

        return response()->json([
            'message' => 'Position competency updated successfully.',
            'data' => $positionCompetency
        ], 200);
    }

    /**
     * Remove the specified position competency from storage.
     */
    public function deletePositionCompetency(int $position_id, int $competency_id)
    {
        $positionCompetency = PositionCompetency::where('position_id', $position_id)
            ->where('competency_id', $competency_id)
            ->firstOrFail();

        $positionCompetency->delete();

        return response()->json([
            'message' => 'Position competency deleted successfully.',
        ], 200);
    }

    /**
     * Display a listing of position competencies linked to the specified office.
     */
    public function getCompetenciesByUnit(string $department)
    {
        $positionIds = Position::where('department', $department)
            ->pluck('position_id');

        $positionCompetencies = PositionCompetency::whereIn('position_id', $positionIds)
            ->get();

        return response()->json([
            'data' => $positionCompetencies
        ], 200);
    }
}
