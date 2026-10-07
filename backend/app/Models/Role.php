<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'role_name',
    'description',
    'status'
])]
class Role extends Model
{
    protected $table = 'tbl_roles';
    protected $primaryKey = 'role_id';

    public $incrementing = false;
    public $timestamps = false;

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role_id', 'role_id');
    }
}
