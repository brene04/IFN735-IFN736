<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'competency_code',
    'competency_name',
    'description',
    'competency_type',
    'status'
])]
class Competency extends Model
{
    protected $table = 'tbl_competencies';
    protected $primaryKey = 'competency_id';
    public $timestamps = false;

    public function positionCompetencies(): HasMany
    {
        return $this->hasMany(PositionCompetency::class, 'competency_id', 'competency_id');
    }

    public function employeeCompetencies(): HasMany
    {
        return $this->hasMany(EmployeeCompetency::class, 'competency_id', 'competency_id');
    }

    public function gapAnalysisResults(): HasMany
    {
        return $this->hasMany(GapAnalysisResult::class, 'competency_id', 'competency_id');
    }
}
