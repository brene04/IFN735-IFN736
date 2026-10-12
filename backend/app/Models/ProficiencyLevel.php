<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'competency_id',
    'level_number',
    'level_name',
    'description',
    'status'
])]
class ProficiencyLevel extends Model
{
    protected $table = 'tbl_proficiency_levels';
    protected $primaryKey = 'proficiency_level_id';
    public $timestamps = false;
    
    public function competency(): BelongsTo
    {
        return $this->belongsTo(Competency::class, 'competency_id', 'competency_id');
    }

    public function behavioralIndicators(): HasMany
    {
        return $this->hasMany(BehavioralIndicator::class, 'proficiency_level_id', 'proficiency_level_id');
    }
}
