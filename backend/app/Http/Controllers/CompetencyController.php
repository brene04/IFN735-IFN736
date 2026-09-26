<?php

namespace App\Http\Controllers;
use App\Http\Requests\CreateCompetencyRequest;
use App\Http\Requests\UpdateCompetencyRequest;
use App\Http\Requests\CreateCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Requests\CreateProficiencyLevelRequest;
use App\Http\Requests\UpdateProficiencyLevelRequest;

use Illuminate\Http\Request;

class CompetencyController extends Controller
{
    /**
     * Display a listing of competency.
     */
    public function getCompetencies()
    {
        //
    }

    /**
     * Store a newly created competency in storage.
     */
    public function createCompetency(CreateCompetencyRequest $request)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Display the specified competency.
     */
    public function getSingleCompetency(int $competency_id)
    {
        //
    }

    /**
     * Update the specified competency in storage.
     */
    public function updateCompetency(UpdateCompetencyRequest $request, int $competency_id)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Remove the specified competency from storage.
     */
    public function deleteCompetency(int $competency_id)
    {
        //
    }

    /**
     * Display a listing of competency category.
     */
    public function getCategories()
    {
        //
    }

    /**
     * Store a newly created competency category in storage.
     */
    public function createCategory(CreateCategoryRequest $request)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Display the specified competency category.
     */
    public function getSingleCategory(int $competency_category_id)
    {
        //
    }

    /**
     * Update the specified competency category in storage.
     */
    public function updateCategory(UpdateCategoryRequest $request, int $competency_category_id)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Remove the specified competency category from storage.
     */
    public function deleteCategory(int $competency_category_id)
    {
        //
    }

    /**
     * Display a listing of proficiency level.
     */
    public function getProficiencyLevels()
    {
        //
    }

    /**
     * Store a newly created proficiency level in storage.
     */
    public function createProficiencyLevel(CreateProficiencyLevelRequest $request)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Display the specified proficiency level.
     */
    public function getSingleProficiencyLevel(int $level_id)
    {
        //
    }

    /**
     * Update the specified proficiency level in storage.
     */
    public function updateProficiencyLevel(UpdateProficiencyLevelRequest $request, int $level_id)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Remove the specified proficiency level from storage.
     */
    public function deleteProficiencyLevel(int $level_id)
    {
        //
    }
}
