<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'position_id',
    'office_id',
    'employee_no',
    'first_name',
    'middle_name',
    'last_name',
    'email',
    'phone',
    'date_hired',
    'status'
])]
class Employee extends Model
{
    protected $table = 'tbl_employees';
    protected $primaryKey = 'employee_id';
    public $timestamps = false;

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'position_id', 'position_id');
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class, 'office_id', 'office_id');
    }

    public function employeeCompetencies(): HasMany
    {
        return $this->hasMany(EmployeeCompetency::class, 'employee_id', 'employee_id');
    }

    public function gapAnalyses(): HasMany
    {
        return $this->hasMany(GapAnalysis::class, 'employee_id', 'employee_id');
    }

    public function historicalRecords(): HasMany
    {
        return $this->hasMany(HistoricalRecord::class, 'employee_id', 'employee_id');
    }
}
