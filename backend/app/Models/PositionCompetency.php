<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'position_id',
    'competency_id',
    'required_level',
    'priority'
])]
class PositionCompetency extends Model
{
    protected $table = 'tbl_position_competencies';
    protected $primaryKey = 'position_competency_id';
    public $timestamps = false;

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'position_id', 'position_id');
    }

    public function competency(): BelongsTo
    {
        return $this->belongsTo(Competency::class, 'competency_id', 'competency_id');
    }
}
