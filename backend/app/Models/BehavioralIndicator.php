<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'proficiency_level_id',
    'indicator_code',
    'description',
])]
class BehavioralIndicator extends Model
{
    protected $table = 'tbl_behavioral_indicators';
    protected $primaryKey = 'behavioral_indicator_id';

    public function proficiencyLevel(): BelongsTo
    {
        return $this->belongsTo(ProficiencyLevel::class, 'proficiency_level_id', 'proficiency_level_id');
    }

}
