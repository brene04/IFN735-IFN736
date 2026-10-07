<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'employee_id',
    'competency_id',
    'current_level',
    'evidence',
    'last_updated',
    'status'
])]
class EmployeeCompetency extends Model
{
    protected $table = 'tbl_employee_competencies';
    protected $primaryKey = 'employee_competency_id';
    public $timestamps = false;

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function competency(): BelongsTo
    {
        return $this->belongsTo(Competency::class, 'competency_id', 'competency_id');
    }
}
