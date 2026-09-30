<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'position_code',
    'position_title',
    'description',
    'department',
    'employment_type',
    'status'
])]
class Position extends Model
{
    protected $table = 'tbl_positions';
    protected $primaryKey = 'position_id';
    public $timestamps = false;

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'position_id', 'position_id');
    }

    public function positionCompetencies(): HasMany
    {
        return $this->hasMany(PositionCompetency::class, 'position_id', 'position_id');
    }

    public function gapAnalyses(): HasMany
    {
        return $this->hasMany(GapAnalysis::class, 'position_id', 'position_id');
    }
}
