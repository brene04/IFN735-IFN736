<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'employee_id',
    'record_type',
    'description',
    'effective_date'
])]
class HistoricalRecord extends Model
{
    protected $table = 'tbl_historical_records';
    protected $primaryKey = 'record_id';
    public $timestamps = false;

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}
