<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'gap_analysis_id',
    'competency_id',
    'required_level',
    'current_level',
    'gap_level',
    'status',
    'remarks'
])]
class GapAnalysisResult extends Model
{
    protected $table = 'tbl_gap_analysis_results';
    protected $primaryKey = 'gap_analysis_result_id';
    public $timestamps = false;

    public function gapAnalysis(): BelongsTo
    {
        return $this->belongsTo(GapAnalysis::class, 'gap_analysis_id', 'gap_analysis_id');
    }

    public function competency(): BelongsTo
    {
        return $this->belongsTo(Competency::class, 'competency_id', 'competency_id');
    }
}
