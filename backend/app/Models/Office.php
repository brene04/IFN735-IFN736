<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'office_name',
    'office_code',
    'description',
    'status'
])]
class Office extends Model
{
    protected $table = 'tbl_offices';
    protected $primaryKey = 'office_id';
    public $timestamps = false;

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'office_id', 'office_id');
    }
}
