<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'employee_id',
    'position_id',
    'analysis_date',
    'status',
    'remarks',
    'created_by'
])]
class GapAnalysis extends Model
{
    protected $table = 'tbl_gap_analyses';
    protected $primaryKey = 'gap_analysis_id';
    public $timestamps = false;

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'position_id', 'position_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(GapAnalysisResult::class, 'gap_analysis_id', 'gap_analysis_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }
}
